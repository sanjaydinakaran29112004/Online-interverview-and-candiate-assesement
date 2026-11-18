import { Router } from 'express';
import { ResumeController } from '../controllers/resumeController';
import { authenticate } from '../middleware/auth';
import { uploadResume } from '../middleware/upload';

const router = Router();

router.post('/analyze', authenticate, uploadResume.single('resume'), ResumeController.uploadAndAnalyze);
router.get('/:id', authenticate, ResumeController.getAnalysisByResumeId);

export default router;
