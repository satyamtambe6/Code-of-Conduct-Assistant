import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { optionalAuth, AuthenticatedRequest, logAuditEvent } from '../middleware/auth.ts';
import { analyzeScenario } from '../services/gemini.ts';

const router = Router();

// POST /api/scenarios/analyze - Analyze an ethical dilemma or workplace scenario
router.post('/analyze', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scenarioDescription, language = 'en' } = req.body;

    if (!scenarioDescription || scenarioDescription.trim().length < 15) {
      res.status(400).json({
        error: 'Please provide a detailed situation description (at least 15 characters).',
      });
      return;
    }

    const publishedChunks = await db.chunks.getAllPublished();
    const analysis = await analyzeScenario(scenarioDescription.trim(), publishedChunks, language);

    if (req.user) {
      await logAuditEvent(req.user, 'SCENARIO_ANALYZED', 'ScenarioAnalyzer', undefined, {
        length: scenarioDescription.length,
        matchedPolicies: analysis.relevantPolicies.length,
      });
    }

    res.json({ analysis });
  } catch (err) {
    console.error('Error analyzing scenario:', err);
    res.status(500).json({ error: 'Failed to complete scenario analysis.' });
  }
});

export default router;
