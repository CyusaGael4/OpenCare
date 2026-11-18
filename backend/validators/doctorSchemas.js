import { z } from 'zod';
import { CONSULTATION_DURATIONS, SPECIALIZATIONS } from '../models/DoctorProfile.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const doctorHoursSchema = z.object({
  start: z.string().regex(TIME_PATTERN, 'Working hours must use HH:mm format.'),
  end: z.string().regex(TIME_PATTERN, 'Working hours must use HH:mm format.'),
});

export const doctorProfileSchema = z.object({
  specialization: z.enum(SPECIALIZATIONS).optional().nullable(),
  qualifications: z
    .array(z.string().trim().min(2).max(120))
    .max(6, 'Add at most 6 qualifications.')
    .default([]),
  experienceYears: z.number().int().min(0).max(60).default(0),
  biography: z.string().trim().max(1200).default(''),
  consultationDuration: z
    .number()
    .int()
    .refine((value) => CONSULTATION_DURATIONS.includes(value), {
      message: 'Consultation duration must be 15, 20, 30, 45 or 60 minutes.',
    })
    .default(30),
  workingDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Select at least one working day.')
    .default([1, 2, 3, 4, 5]),
  workingHours: doctorHoursSchema.default({ start: '09:00', end: '17:00' }),
  isAvailable: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});
