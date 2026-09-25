import express from 'express';
import {
  createAchievement,
  getAchievements,
  getAchievementById,
  updateAchievement,
  deleteAchievement
} from '../controllers/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createAchievement)
  .get(getAchievements);

router.route('/:id')
  .get(getAchievementById)
  .put(protect, updateAchievement)
  .delete(protect, deleteAchievement);

export default router;
