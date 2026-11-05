import { Router, Response } from 'express';
import {
  getDemandForecast,
  getStockRiskAlerts,
  getReorderSuggestions,
  getSlowMovingProducts,
  getSupplierDelayAnalysis,
  askAiAssistant,
} from '../services/gemini.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/ai/demand-forecast
router.get('/demand-forecast', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getDemandForecast();
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error generating demand forecast' });
  }
});

// GET /api/ai/stock-risk
router.get('/stock-risk', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await getStockRiskAlerts();
    res.json({ success: true, count: alerts.length, alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error calculating stock risk' });
  }
});

// GET /api/ai/reorder-suggestions
router.get('/reorder-suggestions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suggestions = await getReorderSuggestions();
    res.json({ success: true, count: suggestions.length, suggestions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error generating reorder suggestions' });
  }
});

// GET /api/ai/slow-moving-products
router.get('/slow-moving-products', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const slowMoving = await getSlowMovingProducts();
    res.json({ success: true, count: slowMoving.length, slowMoving });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error identifying slow moving products' });
  }
});

// GET & POST /api/ai/supplier-analysis
router.all('/supplier-analysis', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analysis = await getSupplierDelayAnalysis();
    res.json({ success: true, ...analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error analyzing supplier delays' });
  }
});

// POST /api/ai/chat
router.post('/chat', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'Query is required.' });
      return;
    }

    const answer = await askAiAssistant(query);
    res.json({ success: true, answer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error processing AI query' });
  }
});

export default router;
