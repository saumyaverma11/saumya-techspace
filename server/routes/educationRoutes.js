import express from 'express';
import {
  createEducation,
  getEducations,
  getEducationById,
  updateEducation,
  deleteEducation
} from '../controllers/educationController.js';

const router = express.Router();

router.route('/')
  .post(createEducation)
  .get(getEducations);

router.route('/:id')
  .get(getEducationById)
  .put(updateEducation)
  .delete(deleteEducation);

export default router;
