import express from 'express';
import {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience
} from '../controllers/experienceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createExperience)
  .get(getExperiences);

router.route('/:id')
  .get(getExperienceById)
  .put(protect, updateExperience)
  .delete(protect, deleteExperience);

export default router;
