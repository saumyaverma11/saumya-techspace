import express from 'express';
import {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience
} from '../controllers/experienceController.js';

const router = express.Router();

router.route('/')
  .post(createExperience)
  .get(getExperiences);

router.route('/:id')
  .get(getExperienceById)
  .put(updateExperience)
  .delete(deleteExperience);

export default router;
