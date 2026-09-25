import express from 'express';
import {
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge
} from '../controllers/badgeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createBadge)
  .get(getBadges);

router.route('/:id')
  .get(getBadgeById)
  .put(protect, updateBadge)
  .delete(protect, deleteBadge);

export default router;
