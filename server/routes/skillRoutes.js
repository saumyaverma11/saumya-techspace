import express from 'express';
import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill
} from '../controllers/skillController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSkill)
  .get(getSkills);

router.route('/:id')
  .get(getSkillById)
  .put(protect, updateSkill)
  .delete(protect, deleteSkill);

export default router;
