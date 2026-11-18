import { Router } from 'express';
import { InterviewController } from '../controllers/interviewController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'RECRUITER']), InterviewController.scheduleInterview);
router.get('/', authenticate, InterviewController.listInterviews);
router.get('/room/:roomCode', authenticate, InterviewController.getInterviewByRoom);
router.patch('/:id/status', authenticate, InterviewController.updateStatus);
router.post('/:id/consent', authenticate, InterviewController.recordConsent);

export default router;
