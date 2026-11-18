import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, NotificationController.listUserNotifications);
router.patch('/:id/read', authenticate, NotificationController.markAsRead);
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);

export default router;
