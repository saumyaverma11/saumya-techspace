import express from 'express';
import {
  createEducation,
  getEducations,
  getEducationById,
  updateEducation,
  deleteEducation
} from '../controllers/educationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createEducation)
  .get(getEducations);

router.route('/:id')
  .get(getEducationById)
  .put(protect, updateEducation)
  .delete(protect, deleteEducation);

export default router;
