import Appointment, { ACTIVE_APPOINTMENT_STATUSES } from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import Availability from '../models/Availability.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/HttpError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { minutesToTime, timeToMinutes, toUtcMidnight } from '../utils/time.js';

function toDateKey(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

function mapAppointment(appointment) {
  return {
    id: appointment._id.toString(),
    doctor: appointment.doctor
      ? {
          id: appointment.doctor._id?.toString?.() ?? appointment.doctor.toString(),
          fullName: appointment.doctor.fullName ?? 'Doctor',
          email: appointment.doctor.email ?? null,
          role: appointment.doctor.role ?? 'doctor',
          profileImage: appointment.doctor.profileImage ?? null,
        }
      : null,
    patient: appointment.patient
      ? {
          id: appointment.patient._id?.toString?.() ?? appointment.patient.toString(),
          fullName: appointment.patient.fullName ?? 'Patient',
          email: appointment.patient.email ?? null,
          role: appointment.patient.role ?? 'patient',
          profileImage: appointment.patient.profileImage ?? null,
        }
      : null,
    appointmentDate: appointment.appointmentDate ? toDateKey(appointment.appointmentDate) : null,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    reason: appointment.reason,
    status: appointment.status,
    cancellationReason: appointment.cancellationReason ?? null,
    cancelledAt: appointment.cancelledAt ?? null,
    createdAt: appointment.createdAt,
  };
}

export const getDoctorAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.params.doctorId || req.query.doctorId;
  if (!doctorId) {
    throw HttpError.badRequest('A doctor is required.');
  }

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    throw HttpError.notFound('Doctor not found.');
  }

  const profile = await DoctorProfile.findOne({ user: doctorId });
  if (!profile) {
    throw HttpError.notFound('Doctor profile not found.');
  }

  const requestedDate = toUtcMidnight(req.query.date ?? req.body?.date ?? req.params.date);
  if (!(requestedDate instanceof Date) || Number.isNaN(requestedDate.getTime())) {
    throw HttpError.badRequest('Appointment date is required.');
  }

  const dateKey = toDateKey(requestedDate);
  const dateObject = new Date(`${dateKey}T00:00:00Z`);
  const dayIndex = dateObject.getUTCDay();
  const override = await Availability.findOne({ doctor: doctor._id, date: requestedDate });

  if (!profile.isAvailable || !profile.isPublished || !profile.workingDays.includes(dayIndex)) {
    return sendSuccess(res, {
      doctor: { id: doctor._id.toString(), fullName: doctor.fullName, specialization: profile.specialization },
      date: dateKey,
      slots: [],
    });
  }

  let startTime = profile.workingHours?.start ?? '09:00';
  let endTime = profile.workingHours?.end ?? '17:00';

  if (override) {
    if (override.isAvailable === false) {
      return sendSuccess(res, {
        doctor: { id: doctor._id.toString(), fullName: doctor.fullName, specialization: profile.specialization },
        date: dateKey,
        slots: [],
      });
    }
    if (override.startTime) startTime = override.startTime;
    if (override.endTime) endTime = override.endTime;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = profile.consultationDuration ?? 30;

  const bookedAppointments = await Appointment.find({
    doctor: doctor._id,
    appointmentDate: requestedDate,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  }).select('startTime endTime');

  const slots = [];
  for (let cursor = startMinutes; cursor + durationMinutes <= endMinutes; cursor += durationMinutes) {
    const slotStart = minutesToTime(cursor);
    const slotEnd = minutesToTime(cursor + durationMinutes);
    const overlaps = bookedAppointments.some((appointment) => {
      const appointmentStart = timeToMinutes(appointment.startTime);
      const appointmentEnd = timeToMinutes(appointment.endTime);
      return cursor < appointmentEnd && cursor + durationMinutes > appointmentStart;
    });

    if (!overlaps) {
      slots.push({ startTime: slotStart, endTime: slotEnd });
    }
  }

  return sendSuccess(res, {
    doctor: { id: doctor._id.toString(), fullName: doctor.fullName, specialization: profile.specialization },
    date: dateKey,
    slots,
  });
});

export const createAppointment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'patient') {
    throw HttpError.forbidden('Only patients can book appointments.');
  }

  const { doctorId, appointmentDate, startTime, reason } = req.body;
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    throw HttpError.notFound('Doctor not found.');
  }

  const profile = await DoctorProfile.findOne({ user: doctor._id });
  if (!profile) {
    throw HttpError.notFound('Doctor profile not found.');
  }

  const dateValue = toUtcMidnight(appointmentDate);
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    throw HttpError.badRequest('Appointment date is required.');
  }

  const dateKey = toDateKey(dateValue);
  const dayIndex = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  if (!profile.isAvailable || !profile.isPublished || !profile.workingDays.includes(dayIndex)) {
    throw HttpError.badRequest('This doctor is not accepting appointments on that day.');
  }

  const override = await Availability.findOne({ doctor: doctor._id, date: dateValue });
  let startHour = profile.workingHours?.start ?? '09:00';
  let endHour = profile.workingHours?.end ?? '17:00';
  if (override) {
    if (override.isAvailable === false) {
      throw HttpError.badRequest('This doctor is unavailable on the selected date.');
    }
    if (override.startTime) startHour = override.startTime;
    if (override.endTime) endHour = override.endTime;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endHour);
  const slotDuration = profile.consultationDuration ?? 30;

  if (startMinutes === null || startMinutes < timeToMinutes(startHour) || startMinutes + slotDuration > endMinutes) {
    throw HttpError.badRequest('The chosen time falls outside the doctor’s availability window.');
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctor._id,
    appointmentDate: dateValue,
    startTime,
    endTime: minutesToTime(startMinutes + slotDuration),
    reason,
  });

  await appointment.populate('doctor', 'fullName email role profileImage');
  await appointment.populate('patient', 'fullName email role profileImage');

  return sendSuccess(res, { appointment: mapAppointment(appointment) }, 201);
});

export const listMyAppointments = asyncHandler(async (req, res) => {
  const query = req.user.role === 'patient' ? { patient: req.user._id } : { doctor: req.user._id };
  const appointments = await Appointment.find(query)
    .sort({ appointmentDate: 1, startMinutes: 1 })
    .populate('patient', 'fullName email role profileImage')
    .populate('doctor', 'fullName email role profileImage');

  return sendSuccess(res, {
    appointments: appointments.map(mapAppointment),
  });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw HttpError.notFound('Appointment not found.');
  }

  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.toString() === req.user._id.toString();
  if (!isPatient && !isDoctor) {
    throw HttpError.forbidden('You can only cancel your own appointment.');
  }

  if (appointment.status === 'cancelled') {
    throw HttpError.badRequest('This appointment is already cancelled.');
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body?.cancellationReason ?? 'Cancelled by the patient.';
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = req.user._id;
  await appointment.save();

  await appointment.populate('doctor', 'fullName email role profileImage');
  await appointment.populate('patient', 'fullName email role profileImage');

  return sendSuccess(res, { appointment: mapAppointment(appointment) });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw HttpError.notFound('Appointment not found.');
  }

  if (appointment.doctor.toString() !== req.user._id.toString()) {
    throw HttpError.forbidden('Only the assigned doctor can update this appointment.');
  }

  const { status } = req.body;
  if (appointment.status === 'cancelled' && status !== 'cancelled') {
    throw HttpError.badRequest('A cancelled appointment cannot be reactivated.');
  }

  appointment.status = status;
  if (status === 'completed') {
    appointment.completedAt = new Date();
  }
  await appointment.save();

  await appointment.populate('doctor', 'fullName email role profileImage');
  await appointment.populate('patient', 'fullName email role profileImage');

  return sendSuccess(res, { appointment: mapAppointment(appointment) });
});
