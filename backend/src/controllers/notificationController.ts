import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class NotificationController {
  static async listUserNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 30
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user!.id, isRead: false }
      });

      res.json({ success: true, notifications, unreadCount });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.notification.updateMany({
        where: { id, userId: req.user!.id },
        data: { isRead: true }
      });

      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true }
      });

      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
