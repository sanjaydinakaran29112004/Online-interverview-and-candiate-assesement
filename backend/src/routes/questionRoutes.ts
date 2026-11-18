import { Router } from 'express';
import { QuestionController } from '../controllers/questionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/generate', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), QuestionController.generateQuestions);
router.get('/sets', authenticate, QuestionController.listQuestionSets);
router.post('/custom', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), QuestionController.createCustomQuestion);

export default router;
