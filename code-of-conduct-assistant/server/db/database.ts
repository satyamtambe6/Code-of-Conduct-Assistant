import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';
import {
  IUser,
  IPolicyDocument,
  IPolicyChunk,
  IChatConversation,
  IChatMessage,
  IFeedback,
  IAuditLog,
  IApplicationSettings,
} from '../types.ts';

interface DatabaseCollections {
  users: IUser[];
  policies: IPolicyDocument[];
  chunks: IPolicyChunk[];
  conversations: IChatConversation[];
  messages: IChatMessage[];
  feedbacks: IFeedback[];
  auditLogs: IAuditLog[];
  settings: IApplicationSettings[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseEngine {
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private isMongo = false;
  private memoryStore: DatabaseCollections = {
    users: [],
    policies: [],
    chunks: [],
    conversations: [],
    messages: [],
    feedbacks: [],
    auditLogs: [],
    settings: [],
  };
  private isLoaded = false;

  async init(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim().length > 0) {
      try {
        console.log('[Database] Connecting to MongoDB instance...');
        this.mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 4000 });
        await this.mongoClient.connect();
        this.mongoDb = this.mongoClient.db();
        this.isMongo = true;
        console.log('[Database] Connected successfully to MongoDB:', this.mongoDb.databaseName);
        return;
      } catch (err) {
        console.warn('[Database] MongoDB connection failed, falling back to embedded persistent storage:', (err as Error).message);
        this.isMongo = false;
      }
    }

    // Local embedded file-backed storage
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.memoryStore = JSON.parse(raw);
        console.log('[Database] Loaded persistent data store from:', DB_FILE);
      } catch (e) {
        console.error('[Database] Failed parsing existing db.json, initializing fresh store', e);
      }
    }

    this.isLoaded = true;
    this.persist();
  }

  private persist() {
    if (this.isMongo) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error persisting data store:', err);
    }
  }

  // --- Generic collection operations ---

  // Users
  get users() {
    return {
      find: async (query?: Partial<IUser>): Promise<IUser[]> => {
        if (this.isMongo && this.mongoDb) {
          return (await this.mongoDb.collection('users').find((query as any) || {}).toArray()) as unknown as IUser[];
        }
        if (!query || Object.keys(query).length === 0) return [...this.memoryStore.users];
        return this.memoryStore.users.filter((item) =>
          Object.entries(query).every(([k, v]) => (item as unknown as Record<string, unknown>)[k] === v)
        );
      },
      findOne: async (query: Partial<IUser>): Promise<IUser | null> => {
        if (this.isMongo && this.mongoDb) {
          const res = await this.mongoDb.collection('users').findOne(query as any);
          return res as unknown as IUser | null;
        }
        return (
          this.memoryStore.users.find((item) =>
            Object.entries(query).every(([k, v]) => (item as unknown as Record<string, unknown>)[k] === v)
          ) || null
        );
      },
      findById: async (id: string): Promise<IUser | null> => {
        return this.users.findOne({ _id: id });
      },
      insertOne: async (doc: IUser): Promise<IUser> => {
        if (this.isMongo && this.mongoDb) {
          await this.mongoDb.collection('users').insertOne(doc as any);
        } else {
          this.memoryStore.users.push(doc);
          this.persist();
        }
        return doc;
      },
      updateOne: async (id: string, update: Partial<IUser>): Promise<IUser | null> => {
        if (this.isMongo && this.mongoDb) {
          await this.mongoDb.collection('users').updateOne({ _id: id as any }, { $set: update });
          return this.users.findById(id);
        }
        const idx = this.memoryStore.users.findIndex((u) => u._id === id);
        if (idx === -1) return null;
        this.memoryStore.users[idx] = { ...this.memoryStore.users[idx], ...update, updatedAt: new Date().toISOString() };
        this.persist();
        return this.memoryStore.users[idx];
      },
      deleteOne: async (id: string): Promise<boolean> => {
        if (this.isMongo && this.mongoDb) {
          const res = await this.mongoDb.collection('users').deleteOne({ _id: id as any });
          return (res.deletedCount ?? 0) > 0;
        }
        const initial = this.memoryStore.users.length;
        this.memoryStore.users = this.memoryStore.users.filter((u) => u._id !== id);
        this.persist();
        return this.memoryStore.users.length < initial;
      },
      count: async (): Promise<number> => {
        if (this.isMongo && this.mongoDb) return this.mongoDb.collection('users').countDocuments();
        return this.memoryStore.users.length;
      },
    };
  }

  // Policies
  get policies() {
    return {
      find: async (filter?: { category?: string; status?: string; search?: string }): Promise<IPolicyDocument[]> => {
        let list = [...this.memoryStore.policies];
        if (filter?.status) {
          list = list.filter((p) => p.status === filter.status);
        }
        if (filter?.category && filter.category !== 'All') {
          list = list.filter((p) => p.category === filter.category);
        }
        if (filter?.search) {
          const s = filter.search.toLowerCase();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(s) ||
              p.description.toLowerCase().includes(s) ||
              p.content.toLowerCase().includes(s) ||
              p.tags.some((t) => t.toLowerCase().includes(s))
          );
        }
        return list;
      },
      findById: async (id: string): Promise<IPolicyDocument | null> => {
        return this.memoryStore.policies.find((p) => p._id === id) || null;
      },
      insertOne: async (doc: IPolicyDocument): Promise<IPolicyDocument> => {
        this.memoryStore.policies.push(doc);
        this.persist();
        return doc;
      },
      updateOne: async (id: string, update: Partial<IPolicyDocument>): Promise<IPolicyDocument | null> => {
        const idx = this.memoryStore.policies.findIndex((p) => p._id === id);
        if (idx === -1) return null;
        this.memoryStore.policies[idx] = {
          ...this.memoryStore.policies[idx],
          ...update,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.memoryStore.policies[idx];
      },
      deleteOne: async (id: string): Promise<boolean> => {
        const initial = this.memoryStore.policies.length;
        this.memoryStore.policies = this.memoryStore.policies.filter((p) => p._id !== id);
        // Also remove associated chunks
        this.memoryStore.chunks = this.memoryStore.chunks.filter((c) => c.policyId !== id);
        this.persist();
        return this.memoryStore.policies.length < initial;
      },
      count: async (): Promise<number> => {
        return this.memoryStore.policies.length;
      },
    };
  }

  // Policy Chunks
  get chunks() {
    return {
      findByPolicyId: async (policyId: string): Promise<IPolicyChunk[]> => {
        return this.memoryStore.chunks.filter((c) => c.policyId === policyId);
      },
      getAllPublished: async (): Promise<IPolicyChunk[]> => {
        const publishedPolicyIds = new Set(
          this.memoryStore.policies.filter((p) => p.status === 'published').map((p) => p._id)
        );
        return this.memoryStore.chunks.filter((c) => publishedPolicyIds.has(c.policyId));
      },
      insertMany: async (chunks: IPolicyChunk[]): Promise<void> => {
        this.memoryStore.chunks.push(...chunks);
        this.persist();
      },
      deleteByPolicyId: async (policyId: string): Promise<void> => {
        this.memoryStore.chunks = this.memoryStore.chunks.filter((c) => c.policyId !== policyId);
        this.persist();
      },
      count: async (): Promise<number> => {
        return this.memoryStore.chunks.length;
      },
    };
  }

  // Conversations & Chat
  get conversations() {
    return {
      findByUserId: async (userId: string): Promise<IChatConversation[]> => {
        return this.memoryStore.conversations
          .filter((c) => c.userId === userId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },
      findById: async (id: string): Promise<IChatConversation | null> => {
        return this.memoryStore.conversations.find((c) => c._id === id) || null;
      },
      insertOne: async (doc: IChatConversation): Promise<IChatConversation> => {
        this.memoryStore.conversations.push(doc);
        this.persist();
        return doc;
      },
      updateOne: async (id: string, update: Partial<IChatConversation>): Promise<IChatConversation | null> => {
        const idx = this.memoryStore.conversations.findIndex((c) => c._id === id);
        if (idx === -1) return null;
        this.memoryStore.conversations[idx] = { ...this.memoryStore.conversations[idx], ...update };
        this.persist();
        return this.memoryStore.conversations[idx];
      },
      deleteOne: async (id: string): Promise<boolean> => {
        const initial = this.memoryStore.conversations.length;
        this.memoryStore.conversations = this.memoryStore.conversations.filter((c) => c._id !== id);
        this.memoryStore.messages = this.memoryStore.messages.filter((m) => m.conversationId !== id);
        this.persist();
        return this.memoryStore.conversations.length < initial;
      },
      count: async (): Promise<number> => {
        return this.memoryStore.conversations.length;
      },
    };
  }

  get messages() {
    return {
      findByConversationId: async (convId: string): Promise<IChatMessage[]> => {
        return this.memoryStore.messages
          .filter((m) => m.conversationId === convId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
      findById: async (id: string): Promise<IChatMessage | null> => {
        return this.memoryStore.messages.find((m) => m._id === id) || null;
      },
      insertOne: async (msg: IChatMessage): Promise<IChatMessage> => {
        this.memoryStore.messages.push(msg);
        this.persist();
        return msg;
      },
      updateOne: async (id: string, update: Partial<IChatMessage>): Promise<IChatMessage | null> => {
        const idx = this.memoryStore.messages.findIndex((m) => m._id === id);
        if (idx === -1) return null;
        this.memoryStore.messages[idx] = { ...this.memoryStore.messages[idx], ...update };
        this.persist();
        return this.memoryStore.messages[idx];
      },
      count: async (): Promise<number> => {
        return this.memoryStore.messages.length;
      },
    };
  }

  // Feedback
  get feedbacks() {
    return {
      find: async (): Promise<IFeedback[]> => {
        return [...this.memoryStore.feedbacks].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      insertOne: async (fb: IFeedback): Promise<IFeedback> => {
        this.memoryStore.feedbacks.push(fb);
        this.persist();
        return fb;
      },
      count: async (): Promise<number> => {
        return this.memoryStore.feedbacks.length;
      },
    };
  }

  // Audit Logs
  get auditLogs() {
    return {
      find: async (limit = 100): Promise<IAuditLog[]> => {
        return [...this.memoryStore.auditLogs]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },
      insertOne: async (log: IAuditLog): Promise<IAuditLog> => {
        this.memoryStore.auditLogs.push(log);
        this.persist();
        return log;
      },
      count: async (): Promise<number> => {
        return this.memoryStore.auditLogs.length;
      },
    };
  }

  // Settings
  get settings() {
    return {
      get: async (): Promise<IApplicationSettings> => {
        if (this.memoryStore.settings.length > 0) {
          return this.memoryStore.settings[0];
        }
        const defaultSettings: IApplicationSettings = {
          _id: 'default_settings',
          organizationName: 'Meridian Global Institute & Enterprise',
          supportEmail: 'conduct-ethics@meridian.org',
          hotlinePhone: '+1 (800) 555-ETHIC',
          externalReportingPortalUrl: 'https://secure-ethics-reporting.example.org',
          aiSafetyDisclaimer:
            'This assistant provides answers strictly grounded in official organizational policies. It does not provide legal advice or take disciplinary action.',
          allowPublicPolicyViewing: true,
          updatedAt: new Date().toISOString(),
        };
        this.memoryStore.settings = [defaultSettings];
        this.persist();
        return defaultSettings;
      },
      update: async (update: Partial<IApplicationSettings>): Promise<IApplicationSettings> => {
        const current = await this.settings.get();
        const updated = { ...current, ...update, updatedAt: new Date().toISOString() };
        this.memoryStore.settings[0] = updated;
        this.persist();
        return updated;
      },
    };
  }
}

export const db = new DatabaseEngine();
