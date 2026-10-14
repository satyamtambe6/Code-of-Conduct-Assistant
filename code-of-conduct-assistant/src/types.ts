export type UserRole = 'student_employee' | 'policy_manager' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
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
  content: string;
  version: string;
  status: PolicyStatus;
  publishedAt?: string;
  effectiveDate: string;
  department: string;
  authorId: string;
  authorName: string;
  tags: string[];
  chunksCount: number;
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

export interface IPolicyExplanation {
  summary: string;
  importantRules: string[];
  whatToDo: string[];
  whatToAvoid: string[];
  acceptableExamples: string[];
  unacceptableExamples: string[];
  relevantSections: string[];
  disclaimer: string;
}

export interface IScenarioAnalysis {
  issueSummary: string;
  relevantPolicies: {
    policyTitle: string;
    sectionTitle: string;
    guideline: string;
  }[];
  potentialRisks: string[];
  recommendedActions: string[];
  reportingOptions: string[];
  alternativeResolutions: string[];
  policyVsGeneralDistinction: string;
  disclaimer: string;
}

export interface IAdminDashboardMetrics {
  totalUsers: number;
  totalPolicies: number;
  publishedPolicies: number;
  draftPolicies: number;
  totalIndexedChunks: number;
  totalConversations: number;
  totalQuestions: number;
  satisfactionRate: number;
  totalFeedback: number;
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
