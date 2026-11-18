/*
 * Importing this module registers every Mongoose model.
 *
 * This matters beyond convenience: Mongoose only builds a model's indexes once
 * the model is compiled. The appointment collection's partial unique indexes are
 * what prevent double-booking under concurrent requests, so they must exist even
 * while a particular route file has not been loaded yet.
 */
export { default as User, USER_ROLES } from './User.js';
export {
  default as DoctorProfile,
  SPECIALIZATIONS,
  CONSULTATION_DURATIONS,
  WEEKDAYS,
} from './DoctorProfile.js';
export {
  default as Appointment,
  APPOINTMENT_STATUSES,
  ACTIVE_APPOINTMENT_STATUSES,
} from './Appointment.js';
export { default as Availability } from './Availability.js';
