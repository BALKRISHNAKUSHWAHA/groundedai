import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { chunkDocumentText } from '../src/utils/chunker.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  project_id: string;
  title: string;
  authors: string;
  publication_year: number;
  source_type: 'pdf' | 'url' | 'text' | 'bibtex';
  file_path?: string;
  raw_content: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
}

export interface SynthesisReport {
  id: string;
  project_id: string;
  title: string;
  synthesized_content: {
    theme: string;
    summary: string;
    comparison_matrix: Array<{
      source_title: string;
      research_objective: string;
      methodology: string;
      key_findings: string;
      limitations: string;
    }>;
    research_gaps: string[];
    future_directions: string[];
  };
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  sender: 'user' | 'ai';
  message: string;
  citations?: Array<{
    source_title: string;
    chunk_index: number;
    quote?: string;
  }>;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  projects: Project[];
  sources: Source[];
  document_chunks: DocumentChunk[];
  synthesis_reports: SynthesisReport[];
  chat_messages: ChatMessage[];
}

const DB_FILE = path.resolve(process.cwd(), '.data', 'researchhub_db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    projects: [],
    sources: [],
    document_chunks: [],
    synthesis_reports: [],
    chat_messages: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.persist();
      }
    } catch (e) {
      console.warn('Initializing fresh DB instance', e);
      this.seedInitialData();
      this.persist();
    }
  }

  private persist() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  private seedInitialData() {
    const demoSalt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('research123', demoSalt);

    const demoUserId = '00000000-0000-4000-8000-000000000001';
    const demoUser: User = {
      id: demoUserId,
      email: 'dr.sarah@researchhub.ai',
      password_hash: demoPasswordHash,
      full_name: 'Dr. Sarah Lin',
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
      updated_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    };

    const projectId = '10000000-0000-4000-8000-000000000001';
    const demoProject: Project = {
      id: projectId,
      user_id: demoUserId,
      title: 'Quantum Computing in Molecular Docking & Drug Discovery',
      description: 'Evaluating variational quantum eigensolver (VQE) and quantum annealing for macrocyclic ligand binding affinity prediction against SARS-CoV-2 protease.',
      domain: 'Biomedical & Life Sciences',
      created_at: new Date('2026-02-10T14:30:00Z').toISOString(),
      updated_at: new Date('2026-02-10T14:30:00Z').toISOString(),
    };

    const project2Id = '10000000-0000-4000-8000-000000000002';
    const demoProject2: Project = {
      id: project2Id,
      user_id: demoUserId,
      title: 'Vision Transformers vs CNNs for Histopathology Image Segmentation',
      description: 'Systematic benchmark of Swin-Transformer and ConvNeXt backbones on whole-slide cancer tissue biopsies under low-resource domain shift.',
      domain: 'Computer Science & AI',
      created_at: new Date('2026-02-18T11:15:00Z').toISOString(),
      updated_at: new Date('2026-02-18T11:15:00Z').toISOString(),
    };

    // Sources for Project 1
    const source1Id = '20000000-0000-4000-8000-000000000001';
    const source1Content = `Abstract: Variational quantum algorithms present an unprecedented avenue for simulating complex biomolecular interactions. In this study, we implement a modified Variational Quantum Eigensolver (VQE) with hardware-efficient ansatz on a 127-qubit superconducting quantum processor. We target the catalytic pocket of SARS-CoV-2 main protease (Mpro) complexed with candidate covalent inhibitors.
Methodology: Active space orbital selection is performed using complete active space self-consistent field (CASSCF) calculations, mapping 14 active electrons into 14 spatial orbitals (28 qubits). Zero-noise extrapolation (ZNE) and readout error mitigation are applied to suppress hardware decoherence.
Key Findings: The hybrid quantum-classical pipeline resolved ground-state binding energy within 1.4 kcal/mol of high-level CCSD(T) benchmarks, demonstrating chemical accuracy while reducing classical compute runtime by 64% compared to standard density functional theory (DFT) grids.
Limitations: Scalability remains constrained by two-qubit gate error rates (>0.5%) and shot noise, limiting current feasibility to small fragments rather than full peptide complexes.`;

    const source2Id = '20000000-0000-4000-8000-000000000002';
    const source2Content = `Abstract: Quantum annealing offers discrete optimization capabilities well-suited for combinatorial peptide conformational search. We map protein-ligand side-chain rotamer placement to a Quadratic Unconstrained Binary Optimization (QUBO) Hamiltonian and execute sampling on an Advantage 5000+ qubit annealer.
Methodology: The continuous conformational space is discretized into Dunbrack rotamer libraries. Energy terms including Lennard-Jones, electrostatic Coulomb, and desolvation are precalculated to generate the interaction matrix. Chain strength parameters were systematically calibrated between 1.5 and 4.0.
Key Findings: The quantum annealer identified low-energy native-like binding poses in under 22 milliseconds per candidate, outperforming standard simulated annealing and genetic algorithms (AutoDock Vina) by 3 orders of magnitude in search latency, with top-1 RMSD < 1.2 Å.
Limitations: Severe graph embedding bottlenecks due to Pegasus connectivity limit simultaneous modeling to at most 45 amino acid residues.`;

    const source3Id = '20000000-0000-4000-8000-000000000003';
    const source3Content = `Abstract: Classical molecular dynamics (MD) augmented with quantum-mechanical / molecular-mechanical (QM/MM) free energy perturbation represents the prevailing gold standard for drug discovery. Here we conduct a comparative baseline across 40 ligand complexes.
Methodology: Explicit solvent simulations using AMBER ff19SB and GAFF2 force fields over 500-nanosecond production trajectories, with binding free energies estimated via MM-GBSA and thermodynamic integration (TI).
Key Findings: MM-GBSA achieved an Pearson correlation coefficient of r = 0.79 with experimental pIC50 values, but required 18,000 GPU hours across high-performance computing clusters.
Limitations: High computational barrier precludes high-throughput screening of ultra-large virtual libraries (>10^9 compounds), necessitating hybrid quantum acceleration.`;

    const source1: Source = {
      id: source1Id,
      project_id: projectId,
      title: 'Variational Quantum Eigensolver for Catalytic Protease Binding Affinity',
      authors: 'K. Thorne, E. Vance, & M. Hayashi',
      publication_year: 2025,
      source_type: 'pdf',
      file_path: 'uploads/thorne2025_vqe.pdf',
      raw_content: source1Content,
      created_at: new Date('2026-02-11T10:00:00Z').toISOString(),
    };

    const source2: Source = {
      id: source2Id,
      project_id: projectId,
      title: 'QUBO Mapping of Rotamer Optimization on D-Wave Quantum Annealers',
      authors: 'A. Chen, D. Kowalski, & R. Gupta',
      publication_year: 2025,
      source_type: 'text',
      raw_content: source2Content,
      created_at: new Date('2026-02-12T15:20:00Z').toISOString(),
    };

    const source3: Source = {
      id: source3Id,
      project_id: projectId,
      title: 'Benchmark of Classical QM/MM Free Energy Perturbation in High-Throughput Screening',
      authors: 'L. Martinez & B. Dupont',
      publication_year: 2024,
      source_type: 'url',
      file_path: 'https://doi.org/10.1038/s41598-024-00123-x',
      raw_content: source3Content,
      created_at: new Date('2026-02-14T08:45:00Z').toISOString(),
    };

    // Chunks for sources
    const chunks: DocumentChunk[] = [];
    [source1, source2, source3].forEach((src) => {
      const generated = chunkDocumentText(src.raw_content, { maxChunkSizeTokens: 400, overlapTokens: 80 });
      generated.forEach((c) => {
        chunks.push({
          id: uuidv4(),
          source_id: src.id,
          chunk_index: c.chunkIndex,
          content: c.content,
          token_count: c.tokenCount,
        });
      });
    });

    // Synthesis report
    const synthesisId = '30000000-0000-4000-8000-000000000001';
    const demoSynthesis: SynthesisReport = {
      id: synthesisId,
      project_id: projectId,
      title: 'Comparative Literature Matrix: Quantum vs Classical Molecular Docking',
      synthesized_content: {
        theme: 'Quantum and Hybrid Algorithmic Approaches in Molecular Docking and Binding Affinity Estimation',
        summary: 'Synthesis across three benchmark investigations reveals a clear paradigm shift: while classical QM/MM free energy calculations provide high correlation (r = 0.79) to empirical assays, their extreme computational footprint (18,000 GPU hours) renders them non-viable for billion-molecule campaigns. Quantum annealers achieve massive 3-order-of-magnitude reductions in rotamer conformational search latency (<22ms), and gate-based VQE pipelines achieve chemical accuracy (<1.4 kcal/mol) for target active sites, though limited by graph embedding constraints and two-qubit fidelity.',
        comparison_matrix: [
          {
            source_title: 'Variational Quantum Eigensolver for Catalytic Protease Binding Affinity',
            research_objective: 'Simulate electronic ground-state binding energy in Mpro catalytic site using 127-qubit superconducting hardware.',
            methodology: 'CASSCF active space reduction (14e, 14o) mapped to 28 qubits with hardware-efficient ansatz and Zero-Noise Extrapolation (ZNE).',
            key_findings: 'Achieved chemical accuracy within 1.4 kcal/mol of CCSD(T) benchmark while cutting classical compute runtime by 64%.',
            limitations: 'Susceptible to two-qubit gate error rates (>0.5%) and shot noise, limiting active space size to 28 qubits.',
          },
          {
            source_title: 'QUBO Mapping of Rotamer Optimization on D-Wave Quantum Annealers',
            research_objective: 'Formulate side-chain rotamer conformation search as a discrete combinatorial QUBO optimization.',
            methodology: 'Discretized Dunbrack rotamer libraries embedded into Pegasus graph topology on Advantage 5000+ qubit processor.',
            key_findings: 'Convergence to low-energy binding poses in 22ms per candidate with top-1 RMSD < 1.2 Å, 1000x faster than AutoDock Vina.',
            limitations: 'Pegasus topology embedding limits current complex size to 45 residues without graph partitioning.',
          },
          {
            source_title: 'Benchmark of Classical QM/MM Free Energy Perturbation in High-Throughput Screening',
            research_objective: 'Establish rigorous accuracy and computational cost baseline for classical explicit-solvent MD and MM-GBSA.',
            methodology: '500-nanosecond production runs in AMBER ff19SB/GAFF2 across 40 complex systems.',
            key_findings: 'Strong correlation (r = 0.79) with experimental pIC50 values.',
            limitations: 'Prohibitive computational cost (18,000 GPU hours) prevents application to ultra-large combinatorial compound libraries.',
          },
        ],
        research_gaps: [
          'Absence of fault-tolerant error correction restricts full-scale protein-ligand simulation beyond small catalytic pockets.',
          'Lack of end-to-end automated pipelines that seamlessly bridge QUBO rotamer screening with downstream gate-based VQE refinement.',
          'Standardized experimental wet-lab validation datasets specifically tailored for quantum algorithmic benchmarking.',
        ],
        future_directions: [
          'Develop hybrid quantum-classical multi-scale workflows coupling quantum annealing for rapid pose filtering with VQE for exact free energy refinement.',
          'Incorporate tensor network state approximations (MPS/PEPS) as classical pre-conditioners to scale qubit active spaces.',
          'Explore error-mitigated quantum machine learning (QML) kernels to predict solvent reorganization energies without explicit QM solvent molecules.',
        ],
      },
      created_at: new Date('2026-02-15T16:00:00Z').toISOString(),
    };

    // Chat messages
    const demoMessages: ChatMessage[] = [
      {
        id: uuidv4(),
        project_id: projectId,
        sender: 'user',
        message: 'How does the Variational Quantum Eigensolver (VQE) method compare against classical QM/MM regarding accuracy and computational overhead?',
        created_at: new Date('2026-02-15T16:10:00Z').toISOString(),
      },
      {
        id: uuidv4(),
        project_id: projectId,
        sender: 'ai',
        message: 'Based on the ingested research corpus:\n\n1. **Chemical Accuracy**: The VQE implementation demonstrated binding energy resolution within **1.4 kcal/mol** of high-level CCSD(T) benchmarks when targeting the SARS-CoV-2 Mpro catalytic pocket [Variational Quantum Eigensolver for Catalytic Protease Binding Affinity]. Meanwhile, classical MM-GBSA achieves an experimental correlation of **r = 0.79** [Benchmark of Classical QM/MM Free Energy Perturbation in High-Throughput Screening].\n\n2. **Computational Runtime**: VQE reduced classical compute runtime by **64%** compared to standard DFT grids [Variational Quantum Eigensolver for Catalytic Protease Binding Affinity]. In contrast, the classical QM/MM free energy perturbation protocol consumed over **18,000 GPU hours**, presenting a severe bottleneck for screening libraries exceeding 10⁹ compounds.\n\n3. **Current Constraints**: VQE remains bound by two-qubit gate errors (>0.5%) and shot noise, limiting active space representation to 28 qubits, whereas classical MD handles thousands of explicit solvent atoms despite its high compute demands.',
        citations: [
          {
            source_title: 'Variational Quantum Eigensolver for Catalytic Protease Binding Affinity',
            chunk_index: 0,
            quote: 'The hybrid quantum-classical pipeline resolved ground-state binding energy within 1.4 kcal/mol of high-level CCSD(T) benchmarks, demonstrating chemical accuracy while reducing classical compute runtime by 64%',
          },
          {
            source_title: 'Benchmark of Classical QM/MM Free Energy Perturbation in High-Throughput Screening',
            chunk_index: 0,
            quote: 'MM-GBSA achieved an Pearson correlation coefficient of r = 0.79 with experimental pIC50 values, but required 18,000 GPU hours across high-performance computing clusters.',
          },
        ],
        created_at: new Date('2026-02-15T16:10:04Z').toISOString(),
      },
    ];

    this.data.users = [demoUser];
    this.data.projects = [demoProject, demoProject2];
    this.data.sources = [source1, source2, source3];
    this.data.document_chunks = chunks;
    this.data.synthesis_reports = [demoSynthesis];
    this.data.chat_messages = demoMessages;
  }

  // --- Users ---
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(userData: { email: string; password_hash: string; full_name: string }): User {
    const user: User = {
      id: uuidv4(),
      email: userData.email.toLowerCase(),
      password_hash: userData.password_hash,
      full_name: userData.full_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // --- Projects ---
  getProjectsByUser(userId: string): Array<Project & { sourcesCount: number; chunksCount: number; synthesisCount: number }> {
    const userProjects = this.data.projects.filter((p) => p.user_id === userId);
    return userProjects.map((p) => {
      const sources = this.data.sources.filter((s) => s.project_id === p.id);
      const sourceIds = new Set(sources.map((s) => s.id));
      const chunks = this.data.document_chunks.filter((c) => sourceIds.has(c.source_id));
      const synthesis = this.data.synthesis_reports.filter((sr) => sr.project_id === p.id);
      return {
        ...p,
        sourcesCount: sources.length,
        chunksCount: chunks.length,
        synthesisCount: synthesis.length,
      };
    });
  }

  getProjectById(projectId: string, userId: string): (Project & { sourcesCount: number; chunksCount: number }) | undefined {
    const p = this.data.projects.find((proj) => proj.id === projectId && proj.user_id === userId);
    if (!p) return undefined;
    const sources = this.data.sources.filter((s) => s.project_id === p.id);
    const sourceIds = new Set(sources.map((s) => s.id));
    const chunks = this.data.document_chunks.filter((c) => sourceIds.has(c.source_id));
    return {
      ...p,
      sourcesCount: sources.length,
      chunksCount: chunks.length,
    };
  }

  createProject(userId: string, data: { title: string; description?: string; domain: string }): Project {
    const project: Project = {
      id: uuidv4(),
      user_id: userId,
      title: data.title,
      description: data.description || '',
      domain: data.domain,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.projects.push(project);
    this.persist();
    return project;
  }

  deleteProject(projectId: string, userId: string): boolean {
    const pIndex = this.data.projects.findIndex((p) => p.id === projectId && p.user_id === userId);
    if (pIndex === -1) return false;

    // Cascade delete sources, chunks, synthesis_reports, chat_messages
    const sourcesToDelete = this.data.sources.filter((s) => s.project_id === projectId);
    const sourceIds = new Set(sourcesToDelete.map((s) => s.id));

    this.data.document_chunks = this.data.document_chunks.filter((c) => !sourceIds.has(c.source_id));
    this.data.sources = this.data.sources.filter((s) => s.project_id !== projectId);
    this.data.synthesis_reports = this.data.synthesis_reports.filter((sr) => sr.project_id !== projectId);
    this.data.chat_messages = this.data.chat_messages.filter((m) => m.project_id !== projectId);
    this.data.projects.splice(pIndex, 1);

    this.persist();
    return true;
  }

  // --- Sources & Chunks ---
  getSourcesByProject(projectId: string, userId: string): Array<Source & { chunkCount: number }> {
    // Verify ownership
    const project = this.getProjectById(projectId, userId);
    if (!project) return [];

    const sources = this.data.sources.filter((s) => s.project_id === projectId);
    return sources.map((s) => {
      const chunks = this.data.document_chunks.filter((c) => c.source_id === s.id);
      return {
        ...s,
        chunkCount: chunks.length,
      };
    });
  }

  getSourceById(sourceId: string, projectId: string, userId: string): Source | undefined {
    const project = this.getProjectById(projectId, userId);
    if (!project) return undefined;
    return this.data.sources.find((s) => s.id === sourceId && s.project_id === projectId);
  }

  createSourceWithChunks(
    projectId: string,
    userId: string,
    sourceData: {
      title: string;
      authors?: string;
      publicationYear?: number;
      source_type: 'pdf' | 'url' | 'text' | 'bibtex';
      file_path?: string;
      raw_content: string;
      maxChunkSizeTokens?: number;
      overlapTokens?: number;
    }
  ): { source: Source; chunks: DocumentChunk[] } | null {
    const project = this.getProjectById(projectId, userId);
    if (!project) return null;

    const source: Source = {
      id: uuidv4(),
      project_id: projectId,
      title: sourceData.title,
      authors: sourceData.authors || 'Unknown Researcher',
      publication_year: sourceData.publicationYear || new Date().getFullYear(),
      source_type: sourceData.source_type,
      file_path: sourceData.file_path,
      raw_content: sourceData.raw_content,
      created_at: new Date().toISOString(),
    };

    const chunkResults = chunkDocumentText(sourceData.raw_content, {
      maxChunkSizeTokens: sourceData.maxChunkSizeTokens ?? 800,
      overlapTokens: sourceData.overlapTokens ?? 160,
    });

    const chunks: DocumentChunk[] = chunkResults.map((c) => ({
      id: uuidv4(),
      source_id: source.id,
      chunk_index: c.chunkIndex,
      content: c.content,
      token_count: c.tokenCount,
    }));

    this.data.sources.push(source);
    this.data.document_chunks.push(...chunks);
    this.persist();

    return { source, chunks };
  }

  deleteSource(sourceId: string, projectId: string, userId: string): boolean {
    const project = this.getProjectById(projectId, userId);
    if (!project) return false;

    const sIndex = this.data.sources.findIndex((s) => s.id === sourceId && s.project_id === projectId);
    if (sIndex === -1) return false;

    this.data.sources.splice(sIndex, 1);
    this.data.document_chunks = this.data.document_chunks.filter((c) => c.source_id !== sourceId);
    this.persist();
    return true;
  }

  getChunksForProject(projectId: string, userId: string): Array<DocumentChunk & { sourceTitle: string; sourceAuthors: string }> {
    const project = this.getProjectById(projectId, userId);
    if (!project) return [];

    const sources = this.data.sources.filter((s) => s.project_id === projectId);
    const sourceMap = new Map(sources.map((s) => [s.id, s]));

    const projectChunks = this.data.document_chunks.filter((c) => sourceMap.has(c.source_id));
    return projectChunks.map((c) => {
      const src = sourceMap.get(c.source_id)!;
      return {
        ...c,
        sourceTitle: src.title,
        sourceAuthors: src.authors,
      };
    });
  }

  // --- Synthesis Reports ---
  getSynthesisReports(projectId: string, userId: string): SynthesisReport[] {
    const project = this.getProjectById(projectId, userId);
    if (!project) return [];
    return this.data.synthesis_reports.filter((sr) => sr.project_id === projectId);
  }

  saveSynthesisReport(
    projectId: string,
    userId: string,
    title: string,
    content: SynthesisReport['synthesized_content']
  ): SynthesisReport | null {
    const project = this.getProjectById(projectId, userId);
    if (!project) return null;

    const report: SynthesisReport = {
      id: uuidv4(),
      project_id: projectId,
      title,
      synthesized_content: content,
      created_at: new Date().toISOString(),
    };

    this.data.synthesis_reports.push(report);
    this.persist();
    return report;
  }

  // --- Chat Messages ---
  getChatMessages(projectId: string, userId: string): ChatMessage[] {
    const project = this.getProjectById(projectId, userId);
    if (!project) return [];
    return this.data.chat_messages.filter((m) => m.project_id === projectId);
  }

  addChatMessage(
    projectId: string,
    userId: string,
    sender: 'user' | 'ai',
    message: string,
    citations?: ChatMessage['citations']
  ): ChatMessage | null {
    const project = this.getProjectById(projectId, userId);
    if (!project) return null;

    const chatMsg: ChatMessage = {
      id: uuidv4(),
      project_id: projectId,
      sender,
      message,
      citations: citations || [],
      created_at: new Date().toISOString(),
    };

    this.data.chat_messages.push(chatMsg);
    this.persist();
    return chatMsg;
  }

  clearChatMessages(projectId: string, userId: string): boolean {
    const project = this.getProjectById(projectId, userId);
    if (!project) return false;

    this.data.chat_messages = this.data.chat_messages.filter((m) => m.project_id !== projectId);
    this.persist();
    return true;
  }
}

export const db = new DatabaseStore();
