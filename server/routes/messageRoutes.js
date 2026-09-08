import express from 'express';
import {
  createMessage,
  getMessages,
  getMessageById,
  markMessageAsRead,
  deleteMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(createMessage)
  .get(protect, getMessages);

router.route('/:id')
  .get(protect, getMessageById)
  .delete(protect, deleteMessage);

router.put('/:id/read', protect, markMessageAsRead);

export default router;
