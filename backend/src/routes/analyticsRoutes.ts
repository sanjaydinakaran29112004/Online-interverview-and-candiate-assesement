import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/recruiter', authenticate, authorize(['ADMIN', 'RECRUITER']), AnalyticsController.getRecruiterDashboardMetrics);
router.get('/performance', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), AnalyticsController.getPerformanceAnalytics);

export default router;
