import { Router } from 'express';
import { AssessmentController } from '../controllers/assessmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/evaluate-answer', authenticate, AssessmentController.submitAndEvaluateAnswer);
router.post('/override/:answerId', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), AssessmentController.overrideScore);
router.post('/finalize', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), AssessmentController.finalizeAssessment);
router.get('/:id', authenticate, AssessmentController.getAssessmentById);

export default router;
