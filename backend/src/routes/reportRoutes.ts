import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:id', authenticate, ReportController.getReportById);
router.get('/:id/download', authenticate, ReportController.downloadReportPDF);

export default router;
