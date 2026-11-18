import { Router } from 'express';
import {
  getDoctorById,
  getMyDoctorProfile,
  listPublicDoctors,
  updateMyDoctorProfile,
} from '../controllers/doctorController.js';
import { requireAuth, requireDoctor } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { doctorProfileSchema } from '../validators/doctorSchemas.js';

const router = Router();

router.get('/public', listPublicDoctors);
router.get('/me', requireAuth, requireDoctor, getMyDoctorProfile);
router.put('/me', requireAuth, requireDoctor, validateBody(doctorProfileSchema), updateMyDoctorProfile);
router.get('/:id', getDoctorById);

export default router;
