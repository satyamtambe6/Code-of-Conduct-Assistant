import {
  IUser,
  IPolicyDocument,
  IPolicyChunk,
  IChatConversation,
  IChatMessage,
  IPolicyExplanation,
  IScenarioAnalysis,
  IAdminDashboardMetrics,
  IAuditLog,
  IApplicationSettings,
  UserRole,
} from '../types.ts';

const TOKEN_KEY = 'conduct_assistant_jwt';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Auth endpoints
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    department?: string;
    organization?: string;
  }): Promise<{ user: IUser; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const result = await res.json();
    this.setToken(result.token);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<{ user: IUser; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const result = await res.json();
    this.setToken(result.token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      this.clearToken();
    }
  },

  async getMe(): Promise<IUser | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        this.clearToken();
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async switchDemoRole(role: UserRole): Promise<{ user: IUser; token: string }> {
    const res = await fetch('/api/auth/demo-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Demo switch failed');
    }
    const result = await res.json();
    this.setToken(result.token);
    return result;
  },

  // Policy endpoints
  async getPolicies(params?: {
    category?: string;
    status?: string;
    search?: string;
    sort?: string;
  }): Promise<IPolicyDocument[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`/api/policies?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load policies');
    const data = await res.json();
    return data.policies || [];
  },

  async getPolicyById(id: string): Promise<{ policy: IPolicyDocument; chunks: IPolicyChunk[] }> {
    const res = await fetch(`/api/policies/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Policy not found');
    return res.json();
  },

  async createPolicy(formData: FormData): Promise<{ policy: IPolicyDocument; message: string }> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/policies', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create policy');
    }
    return res.json();
  },

  async updatePolicy(
    id: string,
    data: Partial<IPolicyDocument>
  ): Promise<{ policy: IPolicyDocument; message: string }> {
    const res = await fetch(`/api/policies/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update policy');
    }
    return res.json();
  },

  async deletePolicy(id: string): Promise<void> {
    const res = await fetch(`/api/policies/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete policy');
    }
  },

  async explainPolicy(
    policyId: string,
    language = 'en'
  ): Promise<{ explanation: IPolicyExplanation; policyTitle: string }> {
    const res = await fetch(`/api/policies/${policyId}/explain`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ language }),
    });
    if (!res.ok) throw new Error('Failed to generate policy explanation');
    return res.json();
  },

  // Chatbot RAG endpoints
  async sendChatMessage(
    message: string,
    conversationId?: string,
    language = 'en'
  ): Promise<{
    conversationId: string;
    answer: string;
    citations: IChatMessage['citations'];
    isOfficialPolicy: boolean;
    followUpQuestions: string[];
    messageId: string;
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message, conversationId, language }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Chat processing failed');
    }
    return res.json();
  },

  async getChatHistory(): Promise<IChatConversation[]> {
    const res = await fetch('/api/chat/history', {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations || [];
  },

  async getConversationMessages(
    conversationId: string
  ): Promise<{ conversation: IChatConversation; messages: IChatMessage[] }> {
    const res = await fetch(`/api/chat/${conversationId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversation messages');
    return res.json();
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await fetch(`/api/chat/${conversationId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  },

  async rateMessage(
    messageId: string,
    helpful: boolean,
    comment?: string
  ): Promise<{ message: string }> {
    const res = await fetch(`/api/chat/message/${messageId}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ helpful, comment }),
    });
    return res.json();
  },

  // Scenario Analysis
  async analyzeScenario(
    scenarioDescription: string,
    language = 'en'
  ): Promise<{ analysis: IScenarioAnalysis }> {
    const res = await fetch('/api/scenarios/analyze', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ scenarioDescription, language }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Scenario analysis failed');
    }
    return res.json();
  },

  // Feedback
  async submitFeedback(data: {
    helpful: boolean;
    comment?: string;
    type?: string;
    targetId?: string;
    rating?: number;
    category?: string;
  }): Promise<void> {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin endpoints
  async getAdminDashboard(): Promise<{
    metrics: IAdminDashboardMetrics;
    categoryDistribution: Record<string, number>;
    recentPolicies: IPolicyDocument[];
    recentAuditLogs: IAuditLog[];
  }> {
    const res = await fetch('/api/admin/dashboard', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    return res.json();
  },

  async getAdminUsers(): Promise<IUser[]> {
    const res = await fetch('/api/admin/users', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load users');
    const data = await res.json();
    return data.users || [];
  },

  async updateUserRole(userId: string, role: UserRole): Promise<IUser> {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    const data = await res.json();
    return data.user;
  },

  async getAdminAnalytics(): Promise<{
    topicData: Array<{ topic: string; inquiries: number; policyCount: number }>;
    activityTrend: Array<{
      day: string;
      questions: number;
      scenarioAnalyses: number;
      policyViews: number;
    }>;
    satisfactionBreakdown: Array<{ name: string; value: number; fill: string }>;
    totalAuditEvents: number;
  }> {
    const res = await fetch('/api/admin/analytics', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async getAdminAuditLogs(limit = 100): Promise<IAuditLog[]> {
    const res = await fetch(`/api/admin/audit-logs?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load audit logs');
    const data = await res.json();
    return data.logs || [];
  },

  async getSettings(): Promise<IApplicationSettings> {
    const res = await fetch('/api/admin/settings', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load settings');
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: Partial<IApplicationSettings>): Promise<IApplicationSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const data = await res.json();
    return data.settings;
  },
};
