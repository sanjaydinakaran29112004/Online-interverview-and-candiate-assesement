import { Router } from 'express';
import { RankingController } from '../controllers/rankingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/job/:jobId', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), RankingController.rankCandidatesForJob);
router.get('/compare', authenticate, authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']), RankingController.compareCandidates);

export default router;
