import { Router } from 'express';
import { JobController } from '../controllers/jobController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', JobController.listJobs);
router.get('/:id', JobController.getJobById);
router.post('/', authenticate, authorize(['ADMIN', 'RECRUITER']), JobController.createJob);
router.put('/:id', authenticate, authorize(['ADMIN', 'RECRUITER']), JobController.updateJob);
router.delete('/:id', authenticate, authorize(['ADMIN', 'RECRUITER']), JobController.deleteJob);

export default router;
