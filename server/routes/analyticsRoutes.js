import express from 'express';
import {
  recordVisit,
  getAnalytics,
  getAnalyticsSummary
} from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/visit', recordVisit);
router.get('/', getAnalytics);
router.get('/summary', getAnalyticsSummary);

export default router;
