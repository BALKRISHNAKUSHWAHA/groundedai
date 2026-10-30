/**
 * API client for ResearchHub AI with JWT authentication
 */

const TOKEN_KEY = 'researchhub_jwt_token';
const USER_KEY = 'researchhub_user';

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  created_at: string;
  updated_at: string;
  sourcesCount?: number;
  chunksCount?: number;
  synthesisCount?: number;
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
  chunkCount?: number;
}

export interface ChatCitation {
  source_title: string;
  chunk_index: number;
  quote?: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  sender: 'user' | 'ai';
  message: string;
  citations?: ChatCitation[];
  created_at: string;
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

export interface ConceptGraphData {
  nodes: Array<{ id: string; label: string; type: 'project' | 'source' | 'author' | 'theme'; size: number }>;
  edges: Array<{ source: string; target: string; relationship: string }>;
  projectDomain: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  } as Record<string, string>;

  // Don't set Content-Type if sending FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      errorMsg = `Server error (${res.status} ${res.statusText})`;
    }
    throw new Error(errorMsg);
  }

  // Handle text responses (e.g. for bibtex or markdown downloads)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/')) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}

export const api = {
  // Auth
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  saveSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  async register(data: { email: string; password: string; full_name: string }) {
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.saveSession(res.token, res.user);
    return res;
  },
  async login(data: { email: string; password: string }) {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.saveSession(res.token, res.user);
    return res;
  },
  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  // Projects
  async getProjects() {
    return request<Project[]>('/api/projects');
  },
  async getProject(id: string) {
    return request<Project>(`/api/projects/${id}`);
  },
  async createProject(data: { title: string; description?: string; domain: string }) {
    return request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deleteProject(id: string) {
    return request<{ success: boolean; message: string }>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // Sources
  async getSources(projectId: string) {
    return request<Source[]>(`/api/projects/${projectId}/sources`);
  },
  async uploadSource(projectId: string, formData: FormData) {
    return request<{ source: Source; chunkCount: number; message: string }>(
      `/api/projects/${projectId}/sources`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },
  async deleteSource(projectId: string, sourceId: string) {
    return request<{ success: boolean; message: string }>(
      `/api/projects/${projectId}/sources/${sourceId}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Chat
  async getChat(projectId: string) {
    return request<ChatMessage[]>(`/api/projects/${projectId}/chat`);
  },
  async sendChatMessage(projectId: string, message: string) {
    return request<ChatMessage>(`/api/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  async clearChat(projectId: string) {
    return request<{ success: boolean; message: string }>(`/api/projects/${projectId}/chat`, {
      method: 'DELETE',
    });
  },

  // Synthesis
  async getSynthesisReports(projectId: string) {
    return request<SynthesisReport[]>(`/api/projects/${projectId}/synthesize`);
  },
  async runSynthesis(projectId: string, title?: string) {
    return request<SynthesisReport>(`/api/projects/${projectId}/synthesize`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  // Export & Graph
  async getConceptGraph(projectId: string) {
    return request<ConceptGraphData>(`/api/projects/${projectId}/concept-graph`);
  },
  async exportProject(projectId: string, format: 'markdown' | 'bibtex' | 'json') {
    return request<any>(`/api/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  },
};
