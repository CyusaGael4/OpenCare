import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, LogOut, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../../components/BrandHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import appointmentService from '../../services/appointmentService.js';
import doctorService from '../../services/doctorService.js';

const todayString = () => new Date().toISOString().slice(0, 10);

function formatDateLabel(dateStringValue) {
  if (!dateStringValue) return 'No date';
  const date = new Date(`${dateStringValue}T00:00:00Z`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((appointment) => appointment.status !== 'cancelled')
        .sort((left, right) => `${left.appointmentDate} ${left.startTime}`.localeCompare(`${right.appointmentDate} ${right.startTime}`)),
    [appointments],
  );

  const stats = useMemo(() => {
    const total = appointments.length;
    const upcoming = upcomingAppointments.length;
    const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled').length;
    const completed = appointments.filter((appointment) => appointment.status === 'completed').length;
    return { total, upcoming, cancelled, completed };
  }, [appointments, upcomingAppointments]);

  useEffect(() => {
    async function load() {
      try {
        const [publicDoctors, myAppointments] = await Promise.all([
          doctorService.listPublicDoctors(),
          appointmentService.listMyAppointments(),
        ]);
        setDoctors(publicDoctors ?? []);
        setAppointments(myAppointments ?? []);
        if ((publicDoctors ?? []).length) {
          setSelectedDoctorId(publicDoctors[0].id);
        }
      } catch (error) {
        setBookingError(getApiErrorMessage(error));
      } finally {
        setLoadingDoctors(false);
        setLoadingAppointments(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    async function loadAvailability() {
      try {
        const availability = await appointmentService.getAvailability(selectedDoctorId, selectedDate);
        setSlots(availability?.slots ?? []);
        setSelectedSlot(null);
      } catch (error) {
        setSlots([]);
        setSelectedSlot(null);
        setBookingError(getApiErrorMessage(error));
      }
    }

    loadAvailability();
  }, [selectedDoctorId, selectedDate]);

  async function handleBooking() {
    if (!selectedDoctorId || !selectedDate || !selectedSlot) {
      setBookingError('Choose a doctor and a time slot before booking.');
      return;
    }

    setBookingError('');
    setSuccessMessage('');

    try {
      const booking = await appointmentService.bookAppointment({
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        reason,
      });

      setSuccessMessage(`Appointment booked with ${booking?.doctor?.fullName ?? 'your doctor'} for ${selectedSlot.startTime}.`);
      setReason('');
      setSelectedSlot(null);
      const myAppointments = await appointmentService.listMyAppointments();
      setAppointments(myAppointments ?? []);
    } catch (error) {
      setBookingError(getApiErrorMessage(error));
    }
  }

  async function handleCancelAppointment(appointmentId) {
    setBookingError('');
    setSuccessMessage('');
    try {
      const cancelled = await appointmentService.cancelAppointment(appointmentId, 'Cancelled by patient from dashboard.');
      const refreshed = await appointmentService.listMyAppointments();
      setAppointments(refreshed ?? []);
      if (cancelled) {
        setSuccessMessage(`Appointment with ${cancelled.doctor?.fullName ?? 'your doctor'} was cancelled.`);
      }
    } catch (error) {
      setBookingError(getApiErrorMessage(error));
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/auth', { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <BrandHeader compact />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink transition hover:bg-primary-50"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </button>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <UserCircle2 aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Patient</p>
                <p className="text-xl font-semibold text-ink">{user?.fullName ?? 'Patient'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Upcoming</p>
                <p className="text-xl font-semibold text-ink">{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <Clock3 aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Total</p>
                <p className="text-xl font-semibold text-ink">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <Clock3 aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Completed</p>
                <p className="text-xl font-semibold text-ink">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Book a consultation</p>
                <h1 className="mt-2 text-2xl font-semibold text-primary">Find a doctor</h1>
              </div>
            </div>

            {loadingDoctors ? (
              <div className="rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-ink-muted">
                Loading doctors…
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap gap-2">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doctor.id)}
                      className={`rounded-pill border px-3 py-2 text-sm font-semibold transition ${
                        selectedDoctorId === doctor.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-line bg-canvas text-ink hover:border-primary hover:text-primary'
                      }`}
                    >
                      {doctor.fullName}
                    </button>
                  ))}
                </div>

                {selectedDoctor ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-line bg-canvas p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xl font-semibold text-ink">{selectedDoctor.fullName}</p>
                          <p className="text-sm text-primary">{selectedDoctor.specialization}</p>
                        </div>
                        <span className="rounded-pill bg-primary-50 px-2 py-1 text-xs font-semibold text-primary">
                          {selectedDoctor.isAvailable ? 'Open' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <label className="block text-sm font-medium text-ink">
                        <span className="mb-1.5 block text-ink-muted">Date</span>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                        />
                      </label>

                      <div>
                        <p className="mb-2 text-sm font-medium text-ink-muted">Available times</p>
                        <div className="flex flex-wrap gap-2">
                          {slots.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-line bg-canvas px-3 py-2 text-sm text-ink-muted">
                              No open slots for this doctor on the selected day.
                            </div>
                          ) : (
                            slots.map((slot) => (
                              <button
                                key={`${slot.startTime}-${slot.endTime}`}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-pill border px-3 py-2 text-sm font-semibold transition ${
                                  selectedSlot?.startTime === slot.startTime
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-line bg-canvas text-ink hover:border-primary hover:text-primary'
                                }`}
                              >
                                {slot.startTime}–{slot.endTime}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-ink">
                      <span className="mb-1.5 block text-ink-muted">Reason for visit</span>
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows="4"
                        placeholder="Tell the doctor what you need help with…"
                        className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                      />
                    </label>

                    {bookingError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {bookingError}
                      </div>
                    )}

                    {successMessage && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {successMessage}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleBooking}
                      disabled={!selectedSlot || !reason.trim()}
                      className="inline-flex items-center justify-center rounded-pill bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-200"
                    >
                      Book appointment
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-ink-muted">
                    No doctor profile is available right now.
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-line bg-surface p-5 shadow-card sm:p-6">
              <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Appointments</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">Your bookings</h2>

              {loadingAppointments ? (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-ink-muted">
                  Loading appointments…
                </div>
              ) : appointments.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-ink-muted">
                  You do not have any booked appointments yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-2xl border border-line bg-canvas p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{appointment.doctor?.fullName ?? 'Doctor'}</p>
                          <p className="text-sm text-primary">{appointment.status}</p>
                        </div>
                        <span className="rounded-pill bg-primary-50 px-2 py-1 text-xs font-semibold text-primary">
                          {formatDateLabel(appointment.appointmentDate)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">
                        {appointment.startTime}–{appointment.endTime}
                      </p>

                      {appointment.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="mt-3 inline-flex items-center rounded-pill border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
