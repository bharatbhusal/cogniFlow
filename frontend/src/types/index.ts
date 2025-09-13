// User Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthJWTToken {
  id: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  data: { access_token: string; user: User };
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  documents_count?: number;
  messages_count?: number;
  documents?: Document[];
  messages?: Message[];
  workflow?: string;
  llm_node?: {
    openai_api_key?: string;
    llm_model_name?: string;
  };
  web_search_node?: {
    serpapi_api_key?: string;
  };
  knowledge_base_node?: {
    openai_api_key?: string;
    embedding_model_name?: string;
  };
}

export interface ProjectConfig {
  workflow?: string;
  llm_node?: {
    openai_api_key?: string;
    llm_model_name?: string;
  };
  web_search_node?: {
    serpapi_api_key?: string;
  };
  knowledge_base_node?: {
    openai_api_key?: string;
    embedding_model_name?: string;
  };
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  file_size: number;
  content_preview?: string;
  upload_date: string;
  chunk_count?: number;
  chromadb_document_ids?: string[];
  file_url?: string;
}

export interface Message {
  id?: string;
  project_id?: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  pdf_files?: File[];
  delete_documents?: string[];
  project_config?: ProjectConfig;
}

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  response: {
    content: string;
    id: string;
    role: "user" | "assistant";
    created_at: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error_code?: string;
  details?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total_count: number;
}

// Loading and Error States
export interface AsyncState {
  loading: boolean;
}

export interface AuthState extends AsyncState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ProjectState extends AsyncState {
  projects: Project[];
  currentProject: Project | null;
  totalCount: number;
}

export interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
}
