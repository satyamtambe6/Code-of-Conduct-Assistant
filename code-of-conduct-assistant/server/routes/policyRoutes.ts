import { Router, Response } from 'express';
import multer from 'multer';
import { db } from '../db/database.ts';
import {
  authenticateToken,
  optionalAuth,
  requireRole,
  AuthenticatedRequest,
  logAuditEvent,
} from '../middleware/auth.ts';
import { parseDocumentContent, chunkTextIntoSections } from '../services/documentParser.ts';
import { explainPolicy } from '../services/gemini.ts';
import { IPolicyDocument, IPolicyChunk, PolicyCategory, PolicyStatus } from '../types.ts';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith('.pdf') ||
      file.originalname.endsWith('.txt') ||
      file.originalname.endsWith('.md')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a PDF or TXT document.'));
    }
  },
});

// GET /api/policies - List policies with filtering
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, status, search, sort = 'newest' } = req.query as Record<string, string>;

    const filter: { category?: string; status?: string; search?: string } = {};
    if (category && category !== 'All') filter.category = category;

    // Normal users and guests only see published policies
    const isAdminOrManager =
      req.user && (req.user.role === 'admin' || req.user.role === 'policy_manager');

    if (!isAdminOrManager) {
      filter.status = 'published';
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) filter.search = search;

    let policies = await db.policies.find(filter);

    if (sort === 'alphabetical') {
      policies.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      policies.sort(
        (a, b) => new Date(b.effectiveDate || b.createdAt).getTime() - new Date(a.effectiveDate || a.createdAt).getTime()
      );
    }

    res.json({ policies, total: policies.length });
  } catch (err) {
    console.error('Error fetching policies:', err);
    res.status(500).json({ error: 'Failed to retrieve policy documents.' });
  }
});

// GET /api/policies/:id - Get single policy with chunk sections
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const policy = await db.policies.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ error: 'Policy document not found.' });
      return;
    }

    const isAdminOrManager =
      req.user && (req.user.role === 'admin' || req.user.role === 'policy_manager');

    if (policy.status !== 'published' && !isAdminOrManager) {
      res.status(403).json({ error: 'This policy is currently in draft mode and not published.' });
      return;
    }

    const chunks = await db.chunks.findByPolicyId(policy._id);
    res.json({ policy, chunks });
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving policy.' });
  }
});

// GET /api/policies/:id/download - Download policy document
router.get('/:id/download', async (req, res) => {
  try {
    const policy = await db.policies.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found.' });
      return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${policy.title.replace(/[^a-z0-9]/gi, '_')}.txt"`
    );
    res.send(policy.content);
  } catch (err) {
    res.status(500).json({ error: 'Download failed.' });
  }
});

// POST /api/policies - Create or upload a policy document
router.post(
  '/',
  authenticateToken,
  requireRole('admin', 'policy_manager'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        title,
        category,
        description,
        version = '1.0',
        status = 'published',
        department = 'Compliance & Governance',
        effectiveDate = new Date().toISOString().split('T')[0],
        tags = '',
        manualContent,
      } = req.body;

      if (!title || !category) {
        res.status(400).json({ error: 'Title and category are required.' });
        return;
      }

      let content = '';
      let documentType: 'PDF' | 'TXT' = 'TXT';
      let fileName = 'policy_document.txt';
      let fileSize = 0;

      if (req.file) {
        fileName = req.file.originalname;
        fileSize = req.file.size;
        documentType =
          req.file.mimetype === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
            ? 'PDF'
            : 'TXT';

        const parsed = await parseDocumentContent(req.file.buffer, req.file.mimetype, fileName);
        content = parsed.fullText;
      } else if (manualContent && manualContent.trim().length > 0) {
        content = manualContent.trim();
        fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.txt`;
        fileSize = Buffer.byteLength(content, 'utf8');
      } else {
        res.status(400).json({ error: 'Please provide either a document file or policy text.' });
        return;
      }

      const parsedChunks = chunkTextIntoSections(content);
      const policyId = `pol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const tagArray = typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : Array.isArray(tags) ? tags : [];

      const newPolicy: IPolicyDocument = {
        _id: policyId,
        title: title.trim(),
        category: category as PolicyCategory,
        description: description?.trim() || `${title} guidelines and compliance requirements.`,
        documentType,
        fileName,
        fileSize,
        content,
        version,
        status: status as PolicyStatus,
        publishedAt: status === 'published' ? new Date().toISOString() : undefined,
        effectiveDate,
        department: department.trim(),
        authorId: req.user!._id,
        authorName: req.user!.name,
        tags: tagArray,
        chunksCount: parsedChunks.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.policies.insertOne(newPolicy);

      // Create chunks
      const chunksToInsert: IPolicyChunk[] = parsedChunks.map((c) => ({
        _id: `chk_${policyId}_${c.chunkIndex}`,
        policyId,
        policyTitle: newPolicy.title,
        category: newPolicy.category,
        sectionTitle: c.sectionTitle,
        content: c.content,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        createdAt: new Date().toISOString(),
      }));

      await db.chunks.insertMany(chunksToInsert);

      await logAuditEvent(
        req.user,
        'POLICY_CREATED',
        'PolicyDocument',
        policyId,
        { title: newPolicy.title, chunks: chunksToInsert.length, status: newPolicy.status }
      );

      res.status(201).json({
        message: 'Policy created and indexed successfully.',
        policy: newPolicy,
        chunksIndexed: chunksToInsert.length,
      });
    } catch (err) {
      console.error('Error creating policy:', err);
      res.status(500).json({ error: (err as Error).message || 'Failed to upload and process policy document.' });
    }
  }
);

// PUT /api/policies/:id - Update policy metadata, content, or publication status
router.put(
  '/:id',
  authenticateToken,
  requireRole('admin', 'policy_manager'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const existing = await db.policies.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Policy not found.' });
        return;
      }

      const { title, category, description, status, version, department, effectiveDate, content, tags } =
        req.body;

      const updateData: Partial<IPolicyDocument> = {};
      if (title) updateData.title = title.trim();
      if (category) updateData.category = category;
      if (description) updateData.description = description;
      if (status) {
        updateData.status = status;
        if (status === 'published' && !existing.publishedAt) {
          updateData.publishedAt = new Date().toISOString();
        }
      }
      if (version) updateData.version = version;
      if (department) updateData.department = department;
      if (effectiveDate) updateData.effectiveDate = effectiveDate;
      if (tags) {
        updateData.tags = Array.isArray(tags)
          ? tags
          : tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      }

      if (content && content.trim() !== existing.content) {
        updateData.content = content.trim();
        updateData.fileSize = Buffer.byteLength(content, 'utf8');

        // Re-index chunks
        await db.chunks.deleteByPolicyId(existing._id);
        const parsedChunks = chunkTextIntoSections(content.trim());
        updateData.chunksCount = parsedChunks.length;

        const newChunks: IPolicyChunk[] = parsedChunks.map((c) => ({
          _id: `chk_${existing._id}_${c.chunkIndex}_${Date.now()}`,
          policyId: existing._id,
          policyTitle: updateData.title || existing.title,
          category: updateData.category || existing.category,
          sectionTitle: c.sectionTitle,
          content: c.content,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          createdAt: new Date().toISOString(),
        }));
        await db.chunks.insertMany(newChunks);
      }

      const updated = await db.policies.updateOne(req.params.id, updateData);

      await logAuditEvent(req.user, 'POLICY_UPDATED', 'PolicyDocument', req.params.id, {
        title: updated?.title,
        status: updated?.status,
      });

      res.json({ message: 'Policy updated successfully.', policy: updated });
    } catch (err) {
      console.error('Update policy error:', err);
      res.status(500).json({ error: 'Failed to update policy.' });
    }
  }
);

// DELETE /api/policies/:id - Delete policy
router.delete(
  '/:id',
  authenticateToken,
  requireRole('admin', 'policy_manager'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const existing = await db.policies.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Policy not found.' });
        return;
      }

      await db.policies.deleteOne(req.params.id);
      await logAuditEvent(req.user, 'POLICY_DELETED', 'PolicyDocument', req.params.id, {
        title: existing.title,
      });

      res.json({ message: 'Policy and associated index chunks deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete policy.' });
    }
  }
);

// POST /api/policies/:id/explain - AI Policy Explanation
router.post('/:id/explain', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const policy = await db.policies.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found.' });
      return;
    }

    const language = (req.body.language as string) || 'en';
    const explanation = await explainPolicy(policy, language);

    res.json({ policyId: policy._id, policyTitle: policy.title, explanation });
  } catch (err) {
    console.error('Error in policy explanation:', err);
    res.status(500).json({ error: 'Failed to generate AI policy explanation.' });
  }
});

export default router;
