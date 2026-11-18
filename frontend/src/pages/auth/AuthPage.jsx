import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, Stethoscope, UserRound } from 'lucide-react';
import BrandHeader from '../../components/BrandHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../services/api.js';
import { roleHome } from '../../utils/roleHome.js';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload =
        mode === 'register'
          ? {
              fullName: form.fullName,
              email: form.email,
              phone: form.phone,
              password: form.password,
            }
          : {
              email: form.email,
              password: form.password,
            };

      const user =
        mode === 'register'
          ? await register(payload)
          : await login(payload);

      navigate(roleHome(user?.role ?? 'patient'), { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-line bg-surface shadow-card lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-primary px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center justify-between">
            <BrandHeader compact />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-label-xs uppercase tracking-[0.14em] text-white/90">
              <Stethoscope aria-hidden="true" className="h-4 w-4" />
              Trusted care
            </div>
            <div>
              <h1 className="max-w-sm text-4xl font-extrabold leading-tight text-white">
                Healthcare that feels calm, clear and personal.
              </h1>
              <p className="mt-4 max-w-md text-base text-white/80">
                Book with the right clinician, manage your schedule, and stay on top of your care from one secure place.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-bold text-white">12k+</div>
              <div>appointments</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-bold text-white">40+</div>
              <div>specialists</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-bold text-white">4.9/5</div>
              <div>patient care</div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <BrandHeader compact />
            </div>
            <div className="ml-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary lg:hidden">
              <LockKeyhole aria-hidden="true" className="h-6 w-6" />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === tab ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <label className="block text-sm font-medium text-ink">
              <span className="mb-1.5 flex items-center gap-2 text-ink-muted">
                <UserRound aria-hidden="true" className="h-4 w-4" />
                Full name
              </span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={updateField}
                placeholder="Jane Doe"
                className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                required
              />
            </label>
          )}

          <label className="block text-sm font-medium text-ink">
            <span className="mb-1.5 flex items-center gap-2 text-ink-muted">
              <Mail aria-hidden="true" className="h-4 w-4" />
              Email
            </span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
              required
            />
          </label>

          {mode === 'register' && (
            <label className="block text-sm font-medium text-ink">
              <span className="mb-1.5 text-ink-muted">Phone (optional)</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="+250 788 000 000"
                className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
              />
            </label>
          )}

          <label className="block text-sm font-medium text-ink">
            <span className="mb-1.5 text-ink-muted">Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
              className="w-full rounded-2xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
              required
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
