import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, ApplicationController.apply);
router.get('/', authenticate, ApplicationController.listApplications);
router.get('/:id', authenticate, ApplicationController.getApplicationById);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'RECRUITER']), ApplicationController.updateStatus);

export default router;
