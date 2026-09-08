import express from 'express';
import {
  recordVisit,
  getAnalytics,
  getAnalyticsSummary
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/visit', recordVisit);
router.get('/', protect, getAnalytics);
router.get('/summary', protect, getAnalyticsSummary);

export default router;
