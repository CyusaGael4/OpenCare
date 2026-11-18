import { z } from 'zod';
import { TIME_PATTERN } from '../utils/time.js';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date.');

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Please choose a doctor.'),
  appointmentDate: dateString,
  startTime: z.string().regex(TIME_PATTERN, 'Start time must use HH:mm format.'),
  reason: z.string().trim().min(5, 'Please give a little more detail (at least 5 characters).').max(500, 'Reason is too long.'),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().trim().max(300, 'Cancellation reason is too long.').optional().nullable(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled'], 'Choose a valid appointment status.'),
});

export const getAvailabilitySchema = z.object({
  date: dateString,
});
