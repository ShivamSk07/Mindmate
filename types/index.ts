export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  searched?: boolean;
  sources?: Source[];
  reaction?: string | null;
  feedback?: number;
  isFlagged?: boolean;
  confidence?: string;
  createdAt: Date;
}

export interface Source {
  title: string;
  url: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  activePersonaId?: string | null;
  isPinned: boolean;
  folder: string;
  isPublic: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  persona_id?: string;
  folder?: string;
}

export interface ChatResponse {
  response: string;
  searched: boolean;
  sources: Source[];
  sessionId: string;
  messageId: string;
}
