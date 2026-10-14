import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import {
  optionalAuth,
  authenticateToken,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth.ts';
import { IFeedback } from '../types.ts';

const router = Router();

// POST /api/feedback - Submit feedback on an answer or system
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { helpful, comment, type = 'general', targetId, rating, category } = req.body;

    const feedbackDoc: IFeedback = {
      _id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user?._id || 'guest',
      userEmail: req.user?.email || 'anonymous@visitor.org',
      userName: req.user?.name || 'Anonymous User',
      type: type || 'general',
      targetId,
      helpful: Boolean(helpful),
      rating: typeof rating === 'number' ? rating : undefined,
      comment: comment ? String(comment).slice(0, 800) : undefined,
      category,
      createdAt: new Date().toISOString(),
    };

    await db.feedbacks.insertOne(feedbackDoc);
    res.status(201).json({ message: 'Thank you for your valuable feedback!', feedback: feedbackDoc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

// GET /api/feedback - List all feedbacks (Admin & Policy Manager)
router.get(
  '/',
  authenticateToken,
  requireRole('admin', 'policy_manager'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const feedbacks = await db.feedbacks.find();
      res.json({ feedbacks });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve feedback list.' });
    }
  }
);

export default router;
