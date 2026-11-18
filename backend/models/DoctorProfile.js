import mongoose from 'mongoose';
import { TIME_PATTERN, timeToMinutes } from '../utils/time.js';

/**
 * Specialisations are a fixed list so the public directory filter, the doctor
 * editor and the seed data cannot drift apart.
 */
export const SPECIALIZATIONS = Object.freeze([
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Ophthalmology',
  'Otolaryngology (ENT)',
  'Endocrinology',
  'Dentistry',
]);

export const CONSULTATION_DURATIONS = Object.freeze([15, 20, 30, 45, 60]);

export const WEEKDAYS = Object.freeze({
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
});

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required.'],
      enum: {
        values: SPECIALIZATIONS,
        message: 'Choose one of the supported specializations.',
      },
    },
    qualifications: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
      validate: {
        validator: (values) => values.length <= 6,
        message: 'Add at most 6 qualifications.',
      },
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative.'],
      max: [60, 'Experience cannot exceed 60 years.'],
      default: 0,
    },
    biography: {
      type: String,
      trim: true,
      maxlength: [1200, 'Biography is too long.'],
      default: '',
    },
    /* Slot length in minutes. Appointment starts are aligned to this grid, which
     * is what makes database-level double-booking prevention possible. */
    consultationDuration: {
      type: Number,
      enum: {
        values: CONSULTATION_DURATIONS,
        message: 'Consultation duration must be 15, 20, 30, 45 or 60 minutes.',
      },
      default: 30,
    },
    /* 0 = Sunday … 6 = Saturday */
    workingDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [1, 2, 3, 4, 5],
      validate: {
        validator: (days) => Array.isArray(days) && days.length > 0,
        message: 'Select at least one working day.',
      },
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00',
        match: [TIME_PATTERN, 'Working hours must use HH:mm format.'],
      },
      end: {
        type: String,
        default: '17:00',
        match: [TIME_PATTERN, 'Working hours must use HH:mm format.'],
      },
    },
    /* Whether the doctor is currently accepting new bookings. */
    isAvailable: {
      type: Boolean,
      default: true,
    },
    /* Whether the profile appears in the public directory. */
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_document, result) {
        delete result._id;
        return result;
      },
    },
  },
);

doctorProfileSchema.pre('validate', function validateHours(next) {
  const start = timeToMinutes(this.workingHours?.start);
  const end = timeToMinutes(this.workingHours?.end);
  if (start !== null && end !== null && end <= start) {
    this.invalidate('workingHours.end', 'Working hours must end after they start.');
  }
  next();
});

/** Public listing filter: published profile on an active account. */
doctorProfileSchema.statics.publicFilter = function publicFilter() {
  return { isPublished: true };
};

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;
