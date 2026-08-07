export interface ConfidenceData {
  score: number; // 0 to 100
  level: "High" | "Medium" | "Low" | "Very Low";
  color: "green" | "yellow" | "orange" | "red";
  reason: string;
  factors: {
    knowledge: number;
    consistency: number;
    context: number;
    hallucinationRisk: number;
  };
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "completed" | "skipped";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedDuration: string;
  dependencies?: string[];
}

export interface ProjectPhase {
  id: string;
  title: string;
  description: string;
  tasks: ProjectTask[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  estimatedCompletionTime: string;
  progressPercentage: number;
  phases: ProjectPhase[];
  createdAt?: string;
}

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "Productivity" | "Development" | "Marketing" | "Lifestyle" | "Business";
  permissions: string[];
  rating: number;
  developer: string;
  version: string;
  isInstalled?: boolean;
  systemPrompt: string;
  initialPrompt?: string;
}

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
  confidenceData?: ConfidenceData;
  projectData?: Project;
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
  activeAppId?: string;
}

export interface ChatResponse {
  response: string;
  searched: boolean;
  sources: Source[];
  sessionId: string;
  messageId: string;
  confidenceData?: ConfidenceData;
  projectData?: Project;
}
