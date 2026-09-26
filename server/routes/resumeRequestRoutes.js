import express from 'express';
import {
  createRequest,
  getRequestStatus,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  downloadResume,
  emailActionApprove,
  emailActionApproveConfirm,
  emailActionReject,
  emailActionRejectConfirm
} from '../controllers/resumeRequestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: submit a resume download request
router.post('/', createRequest);

// Public: check resume request status via tracking token
router.get('/status/:token?', getRequestStatus);

// Public: validate download token and get resume URL (token validated server-side)
router.get('/download/:token', downloadResume);

// Public: 1-Click secure email actions (GET renders safe confirmation; POST executes action)
router.get('/email-action/approve', emailActionApprove);
router.post('/email-action/approve', emailActionApproveConfirm);
router.get('/email-action/reject', emailActionReject);
router.post('/email-action/reject', emailActionRejectConfirm);

// Admin protected: manage requests
router.get('/', protect, getRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id/approve', protect, approveRequest);
router.put('/:id/reject', protect, rejectRequest);

export default router;
