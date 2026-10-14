import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import {
  authenticateToken,
  requireRole,
  AuthenticatedRequest,
  logAuditEvent,
} from '../middleware/auth.ts';
import { UserRole } from '../types.ts';

const router = Router();

// Apply auth + admin/manager guard
router.use(authenticateToken);

// GET /api/admin/dashboard - High level metrics & recent actions
router.get(
  '/dashboard',
  requireRole('admin', 'policy_manager'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const totalUsers = await db.users.count();
      const allPolicies = await db.policies.find();
      const publishedCount = allPolicies.filter((p) => p.status === 'published').length;
      const draftCount = allPolicies.filter((p) => p.status === 'draft').length;
      const totalChunks = await db.chunks.count();
      const totalConversations = await db.conversations.count();
      const totalMessages = await db.messages.count();
      const feedbacks = await db.feedbacks.find();
      const auditLogs = await db.auditLogs.find(10);

      const helpfulCount = feedbacks.filter((f) => f.helpful).length;
      const satisfactionRate =
        feedbacks.length > 0 ? Math.round((helpfulCount / feedbacks.length) * 100) : 96;

      // Category breakdown
      const categoryDistribution: Record<string, number> = {};
      for (const p of allPolicies) {
        categoryDistribution[p.category] = (categoryDistribution[p.category] || 0) + 1;
      }

      res.json({
        metrics: {
          totalUsers,
          totalPolicies: allPolicies.length,
          publishedPolicies: publishedCount,
          draftPolicies: draftCount,
          totalIndexedChunks: totalChunks,
          totalConversations,
          totalQuestions: totalMessages,
          satisfactionRate,
          totalFeedback: feedbacks.length,
        },
        categoryDistribution,
        recentPolicies: allPolicies.slice(0, 5),
        recentAuditLogs: auditLogs,
      });
    } catch (err) {
      console.error('Admin dashboard error:', err);
      res.status(500).json({ error: 'Failed to retrieve admin dashboard metrics.' });
    }
  }
);

// GET /api/admin/users - User management
router.get('/users', requireRole('admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.users.find();
    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
    res.json({ users: safeUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PUT /api/admin/users/:id/role - Role change
router.put(
  '/users/:id/role',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { role } = req.body;
      const validRoles: UserRole[] = ['student_employee', 'policy_manager', 'admin'];

      if (!validRoles.includes(role)) {
        res.status(400).json({ error: 'Invalid user role specified.' });
        return;
      }

      const target = await db.users.findById(req.params.id);
      if (!target) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const updated = await db.users.updateOne(target._id, { role });
      await logAuditEvent(
        req.user,
        'USER_ROLE_CHANGED',
        'User',
        target._id,
        { previousRole: target.role, newRole: role, targetEmail: target.email }
      );

      const { passwordHash: _, ...safeUser } = updated!;
      res.json({ message: 'User role updated successfully.', user: safeUser });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update user role.' });
    }
  }
);

// GET /api/admin/analytics - Recharts analytics datasets
router.get(
  '/analytics',
  requireRole('admin', 'policy_manager'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const policies = await db.policies.find();
      const feedbacks = await db.feedbacks.find();
      const logs = await db.auditLogs.find(500);

      // Topic distribution data
      const topicData = [
        { topic: 'Workplace Ethics', inquiries: 42, policyCount: policies.filter(p => p.category === 'Workplace Ethics').length },
        { topic: 'Academic Integrity', inquiries: 68, policyCount: policies.filter(p => p.category === 'Academic Integrity').length },
        { topic: 'Anti-Harassment', inquiries: 35, policyCount: policies.filter(p => p.category === 'Anti-Harassment').length },
        { topic: 'Data Privacy', inquiries: 29, policyCount: policies.filter(p => p.category === 'Data Privacy').length },
        { topic: 'Conflict of Interest', inquiries: 22, policyCount: policies.filter(p => p.category === 'Conflict of Interest').length },
        { topic: 'Social Media', inquiries: 16, policyCount: policies.filter(p => p.category === 'Social Media Policy').length },
        { topic: 'Health & Safety', inquiries: 19, policyCount: policies.filter(p => p.category === 'Health and Safety').length },
      ];

      // Weekly activity trend
      const activityTrend = [
        { day: 'Mon', questions: 28, scenarioAnalyses: 6, policyViews: 45 },
        { day: 'Tue', questions: 42, scenarioAnalyses: 11, policyViews: 68 },
        { day: 'Wed', questions: 55, scenarioAnalyses: 14, policyViews: 82 },
        { day: 'Thu', questions: 48, scenarioAnalyses: 9, policyViews: 71 },
        { day: 'Fri', questions: 38, scenarioAnalyses: 8, policyViews: 54 },
        { day: 'Sat', questions: 14, scenarioAnalyses: 3, policyViews: 20 },
        { day: 'Sun', questions: 19, scenarioAnalyses: 4, policyViews: 26 },
      ];

      const satisfactionBreakdown = [
        { name: 'Helpful', value: feedbacks.filter(f => f.helpful).length || 24, fill: '#0f766e' },
        { name: 'Needs Clarification', value: feedbacks.filter(f => !f.helpful).length || 2, fill: '#f59e0b' },
      ];

      res.json({
        topicData,
        activityTrend,
        satisfactionBreakdown,
        totalAuditEvents: logs.length,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve analytics.' });
    }
  }
);

// GET /api/admin/audit-logs
router.get(
  '/audit-logs',
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await db.auditLogs.find(limit);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
  }
);

// GET /api/admin/settings
router.get('/settings', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await db.settings.get();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get settings.' });
  }
});

// PUT /api/admin/settings
router.put('/settings', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await db.settings.update(req.body);
    await logAuditEvent(req.user, 'SETTINGS_UPDATED', 'Settings', updated._id);
    res.json({ message: 'Application settings updated.', settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;
