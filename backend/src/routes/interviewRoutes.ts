import { Router } from 'express';
import { InterviewController } from '../controllers/interviewController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'RECRUITER']), InterviewController.scheduleInterview);
router.get('/', authenticate, InterviewController.listInterviews);
router.get('/interviewers', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), InterviewController.listAvailableInterviewers);
router.get('/room/:roomCode', authenticate, InterviewController.getInterviewByRoom);
router.patch('/:id/reassign', authenticate, authorize(['ADMIN', 'RECRUITER']), InterviewController.reassignInterviewer);
router.patch('/:id/status', authenticate, InterviewController.updateStatus);
router.post('/:id/consent', authenticate, InterviewController.recordConsent);

export default router;
