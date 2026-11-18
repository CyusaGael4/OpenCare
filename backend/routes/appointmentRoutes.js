import { Router } from 'express';
import {
  cancelAppointment,
  createAppointment,
  getDoctorAvailability,
  listMyAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';
import { requireAuth, requireDoctor, requirePatient } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  getAvailabilitySchema,
  updateAppointmentStatusSchema,
} from '../validators/appointmentSchemas.js';

const router = Router();

router.get('/me', requireAuth, listMyAppointments);
router.get('/doctor/:doctorId/availability', requireAuth, validateQuery(getAvailabilitySchema), getDoctorAvailability);
router.post('/book', requireAuth, requirePatient, validateBody(createAppointmentSchema), createAppointment);
router.patch('/:id/cancel', requireAuth, validateBody(cancelAppointmentSchema), cancelAppointment);
router.patch('/:id/status', requireAuth, requireDoctor, validateBody(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
