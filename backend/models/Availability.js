import mongoose from 'mongoose';
import { TIME_PATTERN, timeToMinutes, toUtcMidnight } from '../utils/time.js';

/**
 * A dated exception to a doctor's recurring schedule.
 *
 * The weekly pattern (working days, working hours, consultation duration) lives
 * on DoctorProfile and is the single source of truth. This collection only holds
 * overrides for specific dates:
 *
 *   isAvailable: false  → the doctor is away all day (leave, conference)
 *   isAvailable: true   → extra or shortened hours for that date
 *
 * Storing recurring hours here too would create two competing sources of truth,
 * so it deliberately does not.
 */
const availabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required.'],
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    /* Optional custom hours for this date. Omitted means "use working hours". */
    startTime: {
      type: String,
      default: null,
      match: [TIME_PATTERN, 'Start time must use HH:mm format.'],
    },
    endTime: {
      type: String,
      default: null,
      match: [TIME_PATTERN, 'End time must use HH:mm format.'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note is too long.'],
      default: null,
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

availabilitySchema.pre('validate', function normaliseDate(next) {
  if (this.date) this.date = toUtcMidnight(this.date);

  const start = timeToMinutes(this.startTime);
  const end = timeToMinutes(this.endTime);
  if (start !== null && end !== null && end <= start) {
    this.invalidate('endTime', 'End time must be after the start time.');
  }
  next();
});

// One override per doctor per date, enforced by the database.
availabilitySchema.index({ doctor: 1, date: 1 }, { unique: true, name: 'unique_doctor_date_override' });

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;
