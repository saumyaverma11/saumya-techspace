import express from 'express';
import {
  createMessage,
  getMessages,
  getMessageById,
  markMessageAsRead,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

router.route('/')
  .post(createMessage)
  .get(getMessages);

router.route('/:id')
  .get(getMessageById)
  .delete(deleteMessage);

router.put('/:id/read', markMessageAsRead);

export default router;
