import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/users', authenticate, authorize(['ADMIN']), AdminController.listUsers);
router.post('/users', authenticate, authorize(['ADMIN']), AdminController.createUser);
router.patch('/users/:id/status', authenticate, authorize(['ADMIN']), AdminController.updateUserStatus);
router.delete('/users/:id', authenticate, authorize(['ADMIN']), AdminController.deleteUser);
router.get('/stats', authenticate, authorize(['ADMIN']), AdminController.getPlatformStatistics);
router.get('/audit-logs', authenticate, authorize(['ADMIN']), AdminController.listAuditLogs);

export default router;
