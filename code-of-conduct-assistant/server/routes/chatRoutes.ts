import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import {
  authenticateToken,
  optionalAuth,
  AuthenticatedRequest,
  logAuditEvent,
} from '../middleware/auth.ts';
import { askPolicyRAG } from '../services/gemini.ts';
import { IChatConversation, IChatMessage } from '../types.ts';

const router = Router();

// POST /api/chat - Main conversational RAG policy assistant
router.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversationId, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const userId = req.user ? req.user._id : 'guest_session';
    let currentConvId = conversationId;

    // Retrieve or create conversation if authenticated
    let history: { role: 'user' | 'assistant'; text: string }[] = [];

    if (currentConvId) {
      const existingConv = await db.conversations.findById(currentConvId);
      if (existingConv && (existingConv.userId === userId || userId === 'guest_session')) {
        const pastMessages = await db.messages.findByConversationId(currentConvId);
        history = pastMessages.slice(-6).map((m) => ({
          role: m.sender,
          text: m.content,
        }));
      } else {
        currentConvId = undefined;
      }
    }

    if (!currentConvId && req.user) {
      const newConv: IChatConversation = {
        _id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: req.user._id,
        title: message.length > 45 ? `${message.slice(0, 42)}...` : message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messagesCount: 0,
      };
      await db.conversations.insertOne(newConv);
      currentConvId = newConv._id;
    }

    // Load all published policy chunks for grounding
    const publishedChunks = await db.chunks.getAllPublished();

    // Perform RAG with Gemini
    const ragResponse = await askPolicyRAG(message.trim(), publishedChunks, history, language);

    // Save messages if inside a valid conversation
    let userMsgId = `msg_${Date.now()}_u`;
    let assistantMsgId = `msg_${Date.now()}_a`;

    if (currentConvId) {
      const userMessage: IChatMessage = {
        _id: userMsgId,
        conversationId: currentConvId,
        sender: 'user',
        content: message.trim(),
        isOfficialPolicy: false,
        createdAt: new Date().toISOString(),
      };
      await db.messages.insertOne(userMessage);

      const assistantMessage: IChatMessage = {
        _id: assistantMsgId,
        conversationId: currentConvId,
        sender: 'assistant',
        content: ragResponse.answer,
        citations: ragResponse.citations,
        isOfficialPolicy: ragResponse.isOfficialPolicy,
        followUpQuestions: ragResponse.followUpQuestions,
        createdAt: new Date().toISOString(),
      };
      await db.messages.insertOne(assistantMessage);

      await db.conversations.updateOne(currentConvId, {
        updatedAt: new Date().toISOString(),
      });
    }

    if (req.user) {
      await logAuditEvent(req.user, 'CHAT_QUERY', 'Chat', currentConvId, {
        queryLength: message.length,
        citationsCount: ragResponse.citations.length,
        isOfficial: ragResponse.isOfficialPolicy,
      });
    }

    res.json({
      conversationId: currentConvId,
      answer: ragResponse.answer,
      citations: ragResponse.citations,
      isOfficialPolicy: ragResponse.isOfficialPolicy,
      followUpQuestions: ragResponse.followUpQuestions,
      messageId: assistantMsgId,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process AI question.' });
  }
});

// GET /api/chat/history - Get list of conversations for logged-in user
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversations = await db.conversations.findByUserId(req.user!._id);
    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve conversation history.' });
  }
});

// GET /api/chat/:conversationId - Get messages in a conversation
router.get('/:conversationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conv = await db.conversations.findById(req.params.conversationId);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    if (conv.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const messages = await db.messages.findByConversationId(conv._id);
    res.json({ conversation: conv, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// DELETE /api/chat/:conversationId - Delete a conversation
router.delete('/:conversationId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conv = await db.conversations.findById(req.params.conversationId);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    if (conv.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    await db.conversations.deleteOne(req.params.conversationId);
    res.json({ message: 'Conversation deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

// POST /api/chat/message/:messageId/feedback - Rate a specific message
router.post('/message/:messageId/feedback', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { helpful, comment } = req.body;
    const msg = await db.messages.findById(req.params.messageId);

    if (msg) {
      await db.messages.updateOne(msg._id, {
        feedback: {
          helpful: Boolean(helpful),
          comment: comment ? String(comment).slice(0, 500) : undefined,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Also record in central feedback
    await db.feedbacks.insertOne({
      _id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user?._id || 'guest',
      userEmail: req.user?.email || 'anonymous@visitor.org',
      userName: req.user?.name || 'Anonymous User',
      type: 'chat_response',
      targetId: req.params.messageId,
      helpful: Boolean(helpful),
      comment: comment ? String(comment).slice(0, 500) : undefined,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'Feedback recorded. Thank you for helping improve policy accuracy.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

export default router;
