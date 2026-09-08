import express from 'express';
import {
  createCertification,
  getCertifications,
  getCertificationById,
  updateCertification,
  deleteCertification
} from '../controllers/certificationController.js';

const router = express.Router();

router.route('/')
  .post(createCertification)
  .get(getCertifications);

router.route('/:id')
  .get(getCertificationById)
  .put(updateCertification)
  .delete(deleteCertification);

export default router;
