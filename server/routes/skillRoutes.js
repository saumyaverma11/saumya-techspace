import express from 'express';
import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill
} from '../controllers/skillController.js';

const router = express.Router();

router.route('/')
  .post(createSkill)
  .get(getSkills);

router.route('/:id')
  .get(getSkillById)
  .put(updateSkill)
  .delete(deleteSkill);

export default router;
