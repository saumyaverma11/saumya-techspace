import express from 'express';
import {
  createCertification,
  getCertifications,
  getCertificationById,
  updateCertification,
  deleteCertification
} from '../controllers/certificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createCertification)
  .get(getCertifications);

router.route('/:id')
  .get(getCertificationById)
  .put(protect, updateCertification)
  .delete(protect, deleteCertification);

export default router;
