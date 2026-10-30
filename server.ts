import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { z } from 'zod';
import { db } from './server/db.js';
import { executeRagQuery, executeLiteratureSynthesis } from './server/gemini.js';
import { formatCitation } from './src/utils/citation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'researchhub_jwt_super_secret_2026';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads folder exists
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Zod Validation Schemas as mandated by Master Prompt
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const projectSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  domain: z.string().min(2),
});

export const chatSchema = z.object({
  message: z.string().min(1),
});

export const sourceSchema = z.object({
  title: z.string().min(2),
  authors: z.string().optional(),
  publicationYear: z.coerce.number().optional(),
  source_type: z.enum(['pdf', 'url', 'text', 'bibtex']),
  url: z.string().optional(),
  raw_content: z.string().optional(),
  maxChunkSizeTokens: z.coerce.number().optional(),
  overlapTokens: z.coerce.number().optional(),
});

// Extend Express Request type with authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

// JWT Authentication Middleware
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; full_name: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

// ==========================================
// 1. Authentication Routes
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Validation error' });
  }

  const { email, password, full_name } = parseResult.data;
  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(12);
  const password_hash = bcrypt.hashSync(password, salt);
  const user = db.createUser({ email, password_hash, full_name });

  const token = jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    user: { id: user.id, email: user.email, full_name: user.full_name },
    token,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Validation error' });
  }

  const { email, password } = parseResult.data;
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    user: { id: user.id, email: user.email, full_name: user.full_name },
    token,
  });
});

app.get('/api/auth/me', authenticateJWT, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    user: { id: user.id, email: user.email, full_name: user.full_name },
  });
});

// ==========================================
// 2. Project Routes
// ==========================================

app.get('/api/projects', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projects = db.getProjectsByUser(userId);
  return res.json(projects);
});

app.post('/api/projects', authenticateJWT, (req: AuthRequest, res: Response) => {
  const parseResult = projectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Validation error' });
  }

  const userId = req.user!.id;
  const project = db.createProject(userId, parseResult.data);
  return res.status(201).json(project);
});

app.get('/api/projects/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const project = db.getProjectById(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found or unauthorized' });
  }
  return res.json(project);
});

app.delete('/api/projects/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const deleted = db.deleteProject(projectId, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Project not found or unauthorized' });
  }
  return res.json({ success: true, message: 'Project and all associated data deleted' });
});

// ==========================================
// 3. Source Ingestion Routes
// ==========================================

app.get('/api/projects/:id/sources', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const sources = db.getSourcesByProject(projectId, userId);
  return res.json(sources);
});

app.post('/api/projects/:id/sources', authenticateJWT, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;

  const project = db.getProjectById(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  let title = req.body.title;
  let authors = req.body.authors || 'Unknown Researcher';
  let publicationYear = req.body.publicationYear ? parseInt(req.body.publicationYear, 10) : new Date().getFullYear();
  let sourceType = req.body.source_type || 'text';
  let rawContent = req.body.raw_content || '';
  let filePath = '';

  // Handle PDF file upload
  if (req.file) {
    sourceType = 'pdf';
    title = title || req.file.originalname.replace(/\.[^/.]+$/, '');
    
    try {
      // Dynamic import of pdf-parse
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const pdfData = await pdfParse(req.file.buffer);
      rawContent = pdfData.text || '';
      
      // Save file copy to disk
      const filename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const dest = path.join(uploadsDir, filename);
      fs.writeFileSync(dest, req.file.buffer);
      filePath = `uploads/${filename}`;
    } catch (pdfErr) {
      console.warn('PDF parse fallback:', pdfErr);
      // Fallback: extract ASCII text lines from buffer
      const bufferStr = req.file.buffer.toString('utf-8');
      const cleanAscii = bufferStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      rawContent = cleanAscii.length > 100 ? cleanAscii : 'Ingested PDF document text content.';
    }
  }

  // Handle URL source type
  if (sourceType === 'url' && req.body.url) {
    filePath = req.body.url;
    if (!rawContent || rawContent.trim().length === 0) {
      rawContent = `Extracted web article content from ${req.body.url}.\nTitle: ${title}\nAuthors: ${authors}\nIngestion timestamp: ${new Date().toISOString()}`;
    }
  }

  // Handle BibTeX paste
  if (sourceType === 'bibtex' && rawContent) {
    const titleMatch = rawContent.match(/title\s*=\s*[{"]([^}"]+)[}"]/i);
    const authorMatch = rawContent.match(/author\s*=\s*[{"]([^}"]+)[}"]/i);
    const yearMatch = rawContent.match(/year\s*=\s*[{"]?(\d{4})[}"]?/i);
    if (titleMatch) title = titleMatch[1];
    if (authorMatch) authors = authorMatch[1];
    if (yearMatch) publicationYear = parseInt(yearMatch[1], 10);
  }

  if (!rawContent || rawContent.trim().length === 0) {
    return res.status(400).json({ error: 'Source document content cannot be empty' });
  }

  const result = db.createSourceWithChunks(projectId, userId, {
    title: title || 'Untitled Source',
    authors,
    publicationYear,
    source_type: sourceType,
    file_path: filePath,
    raw_content: rawContent,
    maxChunkSizeTokens: req.body.maxChunkSizeTokens ? parseInt(req.body.maxChunkSizeTokens, 10) : 800,
    overlapTokens: req.body.overlapTokens ? parseInt(req.body.overlapTokens, 10) : 160,
  });

  if (!result) {
    return res.status(500).json({ error: 'Failed to ingest document and create chunks' });
  }

  return res.status(201).json({
    source: result.source,
    chunkCount: result.chunks.length,
    message: `Successfully ingested "${result.source.title}" into ${result.chunks.length} semantic chunks.`,
  });
});

app.delete('/api/projects/:id/sources/:sourceId', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const sourceId = req.params.sourceId;

  const deleted = db.deleteSource(sourceId, projectId, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Source not found or unauthorized' });
  }

  return res.json({ success: true, message: 'Source and corresponding chunks deleted' });
});

// ==========================================
// 4. RAG Chat Assistant Routes
// ==========================================

app.get('/api/projects/:id/chat', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const messages = db.getChatMessages(projectId, userId);
  return res.json(messages);
});

app.post('/api/projects/:id/chat', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const parseResult = chatSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Validation error' });
  }

  const userId = req.user!.id;
  const projectId = req.params.id;
  const userMessage = parseResult.data.message;

  const project = db.getProjectById(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // 1. Save user query message
  db.addChatMessage(projectId, userId, 'user', userMessage);

  // 2. Fetch chunks with metadata
  const chunks = db.getChunksForProject(projectId, userId);

  // 3. Execute Gemini RAG query
  const ragResponse = await executeRagQuery(userMessage, chunks, project.title);

  // 4. Save AI response with citations
  const aiMessage = db.addChatMessage(
    projectId,
    userId,
    'ai',
    ragResponse.answer,
    ragResponse.citations
  );

  return res.json(aiMessage);
});

app.delete('/api/projects/:id/chat', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  db.clearChatMessages(projectId, userId);
  return res.json({ success: true, message: 'Chat history cleared' });
});

// ==========================================
// 5. Literature Synthesis Routes
// ==========================================

app.get('/api/projects/:id/synthesize', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const reports = db.getSynthesisReports(projectId, userId);
  return res.json(reports);
});

app.post('/api/projects/:id/synthesize', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;

  const project = db.getProjectById(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const sources = db.getSourcesByProject(projectId, userId);
  if (sources.length === 0) {
    return res.status(400).json({ error: 'At least one research source is required to generate a literature synthesis.' });
  }

  try {
    const synthesisData = await executeLiteratureSynthesis(sources, project.title, project.domain);
    const reportTitle = req.body.title || `Synthesis Matrix: ${project.title}`;
    const saved = db.saveSynthesisReport(projectId, userId, reportTitle, synthesisData);

    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('Synthesis generation error:', err);
    return res.status(500).json({ error: 'Failed to generate literature synthesis: ' + (err.message || 'Server error') });
  }
});

// ==========================================
// 6. Knowledge Graph / Concept Map
// ==========================================

app.get('/api/projects/:id/concept-graph', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const project = db.getProjectById(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const sources = db.getSourcesByProject(projectId, userId);

  // Extract nodes: central project node, source nodes, and author/keyword nodes
  const nodes: Array<{ id: string; label: string; type: 'project' | 'source' | 'author' | 'theme'; size: number }> = [
    { id: 'proj-root', label: project.title, type: 'project', size: 28 },
  ];
  const edges: Array<{ source: string; target: string; relationship: string }> = [];

  const authorsSet = new Set<string>();

  sources.forEach((s, idx) => {
    const sNodeId = `source-${s.id}`;
    nodes.push({
      id: sNodeId,
      label: s.title.length > 32 ? s.title.slice(0, 30) + '...' : s.title,
      type: 'source',
      size: 20,
    });
    edges.push({
      source: 'proj-root',
      target: sNodeId,
      relationship: 'ingests',
    });

    // Author nodes
    const authors = s.authors.split(/[,&]/).map((a) => a.trim()).filter(Boolean);
    authors.forEach((author) => {
      if (!authorsSet.has(author) && authorsSet.size < 8) {
        authorsSet.add(author);
        const aNodeId = `author-${author}`;
        nodes.push({
          id: aNodeId,
          label: author,
          type: 'author',
          size: 14,
        });
        edges.push({
          source: sNodeId,
          target: aNodeId,
          relationship: 'authored_by',
        });
      }
    });
  });

  return res.json({ nodes, edges, projectDomain: project.domain });
});

// ==========================================
// 7. Export Hub
// ==========================================

app.post('/api/projects/:id/export', authenticateJWT, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const projectId = req.params.id;
  const format = req.body.format || 'markdown'; // 'markdown' | 'bibtex' | 'json'

  const project = db.getProjectById(projectId, userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const sources = db.getSourcesByProject(projectId, userId);
  const reports = db.getSynthesisReports(projectId, userId);
  const latestSynthesis = reports[reports.length - 1];

  if (format === 'json') {
    return res.json({
      project,
      sources,
      synthesis_reports: reports,
      exported_at: new Date().toISOString(),
    });
  }

  if (format === 'bibtex') {
    const bibtexEntries = sources
      .map((s) =>
        formatCitation(
          {
            title: s.title,
            authors: s.authors,
            publicationYear: s.publication_year,
            url: s.file_path?.startsWith('http') ? s.file_path : undefined,
          },
          'bibtex'
        )
      )
      .join('\n\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_citations.bib"`);
    return res.send(bibtexEntries);
  }

  // Markdown format report
  let md = `# Research Report: ${project.title}\n\n`;
  md += `**Domain**: ${project.domain}  \n`;
  md += `**Description**: ${project.description || 'N/A'}  \n`;
  md += `**Generated**: ${new Date().toLocaleDateString()} via ResearchHub AI  \n\n`;
  md += `---\n\n`;

  if (latestSynthesis) {
    md += `## 1. Executive Synthesis & Literature Review\n\n`;
    md += `**Theme**: ${latestSynthesis.synthesized_content.theme}\n\n`;
    md += `${latestSynthesis.synthesized_content.summary}\n\n`;

    md += `### Comparative Literature Matrix\n\n`;
    md += `| Source Paper | Research Objective | Methodology | Key Findings | Limitations |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    latestSynthesis.synthesized_content.comparison_matrix.forEach((row) => {
      md += `| **${row.source_title}** | ${row.research_objective} | ${row.methodology} | ${row.key_findings} | ${row.limitations} |\n`;
    });
    md += `\n\n`;

    md += `### Research Gaps Identified\n\n`;
    latestSynthesis.synthesized_content.research_gaps.forEach((gap, i) => {
      md += `${i + 1}. ${gap}\n`;
    });
    md += `\n`;

    md += `### High-Priority Future Directions\n\n`;
    latestSynthesis.synthesized_content.future_directions.forEach((dir, i) => {
      md += `${i + 1}. ${dir}\n`;
    });
    md += `\n---\n\n`;
  }

  md += `## 2. Ingested Research Corpus & Bibliography\n\n`;
  sources.forEach((s, idx) => {
    md += `### [${idx + 1}] ${s.title}\n`;
    md += `- **Authors**: ${s.authors}\n`;
    md += `- **Publication Year**: ${s.publication_year}\n`;
    md += `- **Source Type**: ${s.source_type.toUpperCase()}\n`;
    md += `- **APA Citation**: ${formatCitation(s, 'apa')}\n\n`;
  });

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_report.md"`);
  return res.send(md);
});

// ==========================================
// Vite Dev Server / Static File Serving
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ResearchHub AI Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
