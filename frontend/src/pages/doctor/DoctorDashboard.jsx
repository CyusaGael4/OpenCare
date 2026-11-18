import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, Clock3, LogOut, Save, Stethoscope, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../../components/BrandHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import appointmentService from '../../services/appointmentService.js';
import doctorService from '../../services/doctorService.js';

const emptyProfile = {
  specialization: 'General Medicine',
  qualifications: ['MBBS', 'MSc Family Medicine'],
  experienceYears: 8,
  biography: '',
  consultationDuration: 30,
  workingDays: [1, 2, 3, 4, 5],
  workingHours: { start: '09:00', end: '17:00' },
  isAvailable: true,
  isPublished: true,
};

const specialties = [
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
];

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [publicDoctors, setPublicDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [myProfile, publicList, myAppointments] = await Promise.all([
          doctorService.getMyProfile(),
          doctorService.listPublicDoctors(),
          appointmentService.listMyAppointments(),
        ]);
        setProfile({ ...emptyProfile, ...(myProfile ?? emptyProfile) });
        setPublicDoctors(publicList ?? []);
        setAppointments(myAppointments ?? []);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      }
    }

    load();
  }, []);

  const workflowStats = useMemo(() => {
    const pending = appointments.filter((item) => item.status === 'pending').length;
    const confirmed = appointments.filter((item) => item.status === 'confirmed').length;
    const completed = appointments.filter((item) => item.status === 'completed').length;
    const cancelled = appointments.filter((item) => item.status === 'cancelled').length;
    return { pending, confirmed, completed, cancelled };
  }, [appointments]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const updateWorkingHours = (field, value) => {
    setProfile((current) => ({
      ...current,
      workingHours: { ...current.workingHours, [field]: value },
    }));
  };

  const toggleWeekday = (dayIndex) => {
    setProfile((current) => {
      const next = current.workingDays.includes(dayIndex)
        ? current.workingDays.filter((day) => day !== dayIndex)
        : [...current.workingDays, dayIndex].sort((a, b) => a - b);

      return { ...current, workingDays: next };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('saving');
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...profile,
        qualifications: Array.isArray(profile.qualifications)
          ? profile.qualifications
          : String(profile.qualifications)
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
        consultationDuration: Number(profile.consultationDuration),
        experienceYears: Number(profile.experienceYears),
      };
      const saved = await doctorService.saveProfile(payload);
      setProfile({ ...emptyProfile, ...(saved ?? emptyProfile) });
      setStatus('saved');
      setSuccess('Your doctor profile was updated successfully.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setStatus('error');
    }
  };

  const handleStatusUpdate = async (appointmentId, nextStatus) => {
    setError('');
    setSuccess('');
    try {
      const updatedAppointment = await appointmentService.updateAppointmentStatus(appointmentId, nextStatus);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: updatedAppointment?.status ?? appointment.status } : appointment,
        ),
      );
      setSuccess(`Appointment marked as ${nextStatus}.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  async function handleLogout() {
    await logout();
    navigate('/auth', { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
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
                <Stethoscope aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Doctor</p>
                <p className="text-xl font-semibold text-ink">{user?.fullName ?? 'Clinician'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <CalendarCheck2 aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Availability</p>
                <p className="text-xl font-semibold text-ink">{profile.isAvailable ? 'Accepting patients' : 'Paused'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <Clock3 aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Pending</p>
                <p className="text-xl font-semibold text-ink">{workflowStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Confirmed</p>
                <p className="text-xl font-semibold text-ink">{workflowStats.confirmed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="rounded-[32px] border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Profile management</p>
                <h1 className="mt-2 text-2xl font-semibold text-primary">Doctor details</h1>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                {status === 'saving' ? 'Saving…' : 'Save profile'}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-ink md:col-span-2">
                <span className="mb-1.5 block text-ink-muted">Specialization</span>
                <select
                  name="specialization"
                  value={profile.specialization}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                >
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink md:col-span-2">
                <span className="mb-1.5 block text-ink-muted">Qualifications</span>
                <input
                  type="text"
                  name="qualifications"
                  value={Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') : ''}
                  onChange={(event) => setProfile((current) => ({ ...current, qualifications: event.target.value }))}
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block text-ink-muted">Experience (years)</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  name="experienceYears"
                  value={profile.experienceYears}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block text-ink-muted">Consultation duration</span>
                <select
                  name="consultationDuration"
                  value={profile.consultationDuration}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                >
                  {[15, 20, 30, 45, 60].map((minutes) => (
                    <option key={minutes} value={minutes}>{minutes} mins</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block text-ink-muted">Start time</span>
                <input
                  type="time"
                  value={profile.workingHours.start}
                  onChange={(event) => updateWorkingHours('start', event.target.value)}
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                <span className="mb-1.5 block text-ink-muted">End time</span>
                <input
                  type="time"
                  value={profile.workingHours.end}
                  onChange={(event) => updateWorkingHours('end', event.target.value)}
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                />
              </label>

              <fieldset className="md:col-span-2">
                <legend className="mb-2 block text-sm font-medium text-ink-muted">Working days</legend>
                <div className="flex flex-wrap gap-2">
                  {weekdayLabels.map((label, index) => {
                    const active = profile.workingDays.includes(index);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleWeekday(index)}
                        className={`rounded-pill border px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-primary bg-primary text-white'
                            : 'border-line bg-canvas text-ink hover:border-primary hover:text-primary'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex items-center justify-between rounded-2xl border border-line bg-canvas px-4 py-3 text-sm font-medium text-ink md:col-span-2">
                <span>Currently accepting patients</span>
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={Boolean(profile.isAvailable)}
                  onChange={updateField}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-line bg-canvas px-4 py-3 text-sm font-medium text-ink md:col-span-2">
                <span>Publish profile in the public directory</span>
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={Boolean(profile.isPublished)}
                  onChange={updateField}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                />
              </label>

              <label className="block text-sm font-medium text-ink md:col-span-2">
                <span className="mb-1.5 block text-ink-muted">Biography</span>
                <textarea
                  name="biography"
                  value={profile.biography}
                  onChange={updateField}
                  rows="5"
                  className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                />
              </label>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-line bg-surface p-5 shadow-card sm:p-6">
              <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Public directory</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">Your clinic profile</h2>

              <div className="mt-4 space-y-3">
                {publicDoctors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-ink-muted">
                    No public profiles are currently published.
                  </div>
                ) : (
                  publicDoctors.slice(0, 3).map((doctor) => (
                    <div key={doctor.id} className="rounded-2xl border border-line bg-canvas p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{doctor.fullName}</p>
                          <p className="text-sm text-primary">{doctor.specialization}</p>
                        </div>
                        <span className="rounded-pill bg-primary-50 px-2 py-1 text-xs font-semibold text-primary">
                          {doctor.isAvailable ? 'Open' : 'Busy'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">{doctor.biography || 'No biography yet.'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-line bg-surface p-5 shadow-card sm:p-6">
              <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Appointments</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">Schedule</h2>

              {appointments.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-ink-muted">
                  No appointments yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-2xl border border-line bg-canvas p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{appointment.patient?.fullName ?? 'Patient'}</p>
                          <p className="text-sm text-primary">{appointment.status}</p>
                        </div>
                        <span className="rounded-pill bg-primary-50 px-2 py-1 text-xs font-semibold text-primary">
                          {appointment.appointmentDate}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">
                        {appointment.startTime}–{appointment.endTime}
                      </p>

                      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {appointment.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                              className="rounded-pill border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                            className="rounded-pill border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-100"
                          >
                            Complete
                          </button>
                        </div>
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
