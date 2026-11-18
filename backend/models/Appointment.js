import mongoose from 'mongoose';
import { TIME_PATTERN, durationMinutes, timeToMinutes, toUtcMidnight } from '../utils/time.js';

export const APPOINTMENT_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]);

/** Statuses that still occupy the doctor's time. Cancelled slots are free again. */
export const ACTIVE_APPOINTMENT_STATUSES = Object.freeze(['pending', 'confirmed', 'completed']);

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /*
     * The appointment's calendar day, stored as UTC midnight, plus wall-clock
     * times in the clinic's timezone. Splitting the day from the time means a
     * booking cannot drift to another date because of a server/browser offset.
     */
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required.'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required.'],
      match: [TIME_PATTERN, 'Start time must use HH:mm format.'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required.'],
      match: [TIME_PATTERN, 'End time must use HH:mm format.'],
    },
    /* Derived from the times above; enables cheap overlap queries and sorting. */
    startMinutes: { type: Number, min: 0, max: 1439 },
    endMinutes: { type: Number, min: 1, max: 1440 },

    reason: {
      type: String,
      required: [true, 'Please describe the reason for the visit.'],
      trim: true,
      minlength: [5, 'Please give a little more detail (at least 5 characters).'],
      maxlength: [500, 'Reason is too long.'],
    },
    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: 'Unknown appointment status.',
      },
      default: 'pending',
      required: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Cancellation reason is too long.'],
      default: null,
    },
    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: { type: Date, default: null },
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

appointmentSchema.pre('validate', function normaliseTimes(next) {
  if (this.appointmentDate) this.appointmentDate = toUtcMidnight(this.appointmentDate);

  this.startMinutes = timeToMinutes(this.startTime);
  this.endMinutes = timeToMinutes(this.endTime);

  if (this.startMinutes !== null && this.endMinutes !== null && this.endMinutes <= this.startMinutes) {
    this.invalidate('endTime', 'End time must be after the start time.');
  }

  if (
    this.startMinutes !== null &&
    this.endMinutes !== null &&
    this.endMinutes > this.startMinutes &&
    this.endMinutes - this.startMinutes > 240
  ) {
    this.invalidate('endTime', 'An appointment cannot be longer than 4 hours.');
  }

  next();
});

appointmentSchema.virtual('durationMinutes').get(function duration() {
  return durationMinutes(this.startTime, this.endTime);
});

/*
 * Concurrency-safe double-booking prevention.
 *
 * Starts snap to the doctor's consultation-duration grid, so any two bookings
 * that could overlap share a start time. These partial unique indexes turn a
 * race between two simultaneous requests into a duplicate-key error for one of
 * them, instead of both slipping past an application-level check.
 *
 * Cancelled appointments are excluded, so cancelling frees the slot.
 */
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    name: 'unique_active_doctor_slot',
    partialFilterExpression: { status: { $in: ACTIVE_APPOINTMENT_STATUSES } },
  },
);

// A patient also cannot hold two active appointments at the same moment.
appointmentSchema.index(
  { patient: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    name: 'unique_active_patient_slot',
    partialFilterExpression: { status: { $in: ACTIVE_APPOINTMENT_STATUSES } },
  },
);

// Supports daily/weekly schedule queries.
appointmentSchema.index({ doctor: 1, appointmentDate: 1, startMinutes: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
