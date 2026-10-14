export type UserRole = 'student_employee' | 'policy_manager' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organization?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

export type PolicyCategory =
  | 'Workplace Ethics'
  | 'Student Conduct'
  | 'Anti-Harassment'
  | 'Anti-Discrimination'
  | 'Academic Integrity'
  | 'Data Privacy'
  | 'Cybersecurity'
  | 'Conflict of Interest'
  | 'Social Media Policy'
  | 'Health and Safety'
  | 'Professional Behavior';

export type PolicyStatus = 'published' | 'draft' | 'archived';

export interface IPolicyDocument {
  _id: string;
  title: string;
  category: PolicyCategory;
  description: string;
  documentType: 'PDF' | 'TXT' | 'MARKDOWN';
  fileName: string;
  fileSize: number;
  content: string; // Extracted raw content
  version: string;
  status: PolicyStatus;
  publishedAt?: string;
  effectiveDate: string;
  department: string;
  authorId: string;
  authorName: string;
  tags: string[];
  chunksCount: number;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPolicyChunk {
  _id: string;
  policyId: string;
  policyTitle: string;
  category: PolicyCategory;
  sectionTitle: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  embedding?: number[];
  createdAt: string;
}

export interface IChatMessage {
  _id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  citations?: {
    policyId: string;
    policyTitle: string;
    sectionTitle: string;
    snippet: string;
    pageNumber?: number;
  }[];
  isOfficialPolicy: boolean;
  followUpQuestions?: string[];
  feedback?: {
    helpful: boolean;
    comment?: string;
    createdAt: string;
  };
  createdAt: string;
}

export interface IChatConversation {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
}

export interface IFeedback {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'chat_response' | 'scenario_analysis' | 'general';
  targetId?: string;
  helpful: boolean;
  rating?: number;
  comment?: string;
  category?: string;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface IApplicationSettings {
  _id: string;
  organizationName: string;
  supportEmail: string;
  hotlinePhone: string;
  externalReportingPortalUrl: string;
  aiSafetyDisclaimer: string;
  allowPublicPolicyViewing: boolean;
  updatedAt: string;
}
