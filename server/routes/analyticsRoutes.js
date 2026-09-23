import express from 'express';
import {
  recordVisit,
  getAnalytics,
  getAnalyticsSummary,
  createAnalyticsEvent,
  getDashboardSummary,
  getActivityTrends,
  getEngagementAnalytics,
  getProjectAnalytics,
  getCertificationAnalytics,
  getResumeFunnelAnalytics,
  getContactAnalytics,
  getTrafficAndDeviceAnalytics,
  getRecentEvents
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lightweight in-memory rate limiter for public analytics events
// Enforces max 120 events per 60-second window per IP or sessionId
const eventRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_EVENTS_PER_WINDOW = 120;

// Periodic cleanup of stale rate-limit entries every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of eventRateLimitMap.entries()) {
    if (now > record.resetTime) {
      eventRateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

const analyticsRateLimiter = (req, res, next) => {
  const identifier = req.body?.sessionId || req.ip || 'anonymous';
  const now = Date.now();

  const record = eventRateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    eventRateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return next();
  }

  if (record.count >= MAX_EVENTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Too many analytics events. Please slow down.'
    });
  }

  record.count += 1;
  next();
};

// Existing basic analytics
router.post('/visit', recordVisit);

// Phase 27: Public event tracking endpoint
router.post('/events', analyticsRateLimiter, createAnalyticsEvent);

// Phase 28: Advanced Admin Analytics Aggregation Endpoints (All Admin Protected)
router.get('/dashboard-summary', protect, getDashboardSummary);
router.get('/trends', protect, getActivityTrends);
router.get('/engagement', protect, getEngagementAnalytics);
router.get('/projects', protect, getProjectAnalytics);
router.get('/certifications', protect, getCertificationAnalytics);
router.get('/resume', protect, getResumeFunnelAnalytics);
router.get('/contact', protect, getContactAnalytics);
router.get('/traffic-devices', protect, getTrafficAndDeviceAnalytics);
router.get('/events-list', protect, getRecentEvents);

// Protected admin analytics (Existing endpoints preserved)
router.get('/', protect, getAnalytics);
router.get('/summary', protect, getAnalyticsSummary);

export default router;
