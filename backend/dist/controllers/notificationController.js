"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const prisma_1 = require("../utils/prisma");
class NotificationController {
    static async listUserNotifications(req, res) {
        try {
            const notifications = await prisma_1.prisma.notification.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                take: 30
            });
            const unreadCount = await prisma_1.prisma.notification.count({
                where: { userId: req.user.id, isRead: false }
            });
            res.json({ success: true, notifications, unreadCount });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            await prisma_1.prisma.notification.updateMany({
                where: { id, userId: req.user.id },
                data: { isRead: true }
            });
            res.json({ success: true, message: 'Notification marked as read.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            await prisma_1.prisma.notification.updateMany({
                where: { userId: req.user.id, isRead: false },
                data: { isRead: true }
            });
            res.json({ success: true, message: 'All notifications marked as read.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.NotificationController = NotificationController;
