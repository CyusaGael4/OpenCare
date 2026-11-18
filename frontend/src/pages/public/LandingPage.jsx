import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, MapPin, ShieldCheck, Star, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandHeader from '../../components/BrandHeader.jsx';

const highlights = [
  {
    icon: CalendarCheck2,
    title: 'Easy booking',
    copy: 'Find the right clinician and reserve a time that fits your day without back-and-forth calls.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted care',
    copy: 'Secure patient records, role-based access and a calm interface designed around clinic workflows.',
  },
  {
    icon: Clock3,
    title: 'Fewer delays',
    copy: 'Live availability and clear scheduling reduce missed visits and wasted waiting time.',
  },
];

const doctors = [
  {
    name: 'Dr. Amina Ndayisenga',
    specialty: 'General Medicine',
    rating: '4.9',
    nextSlot: 'Today · 3:30 PM',
  },
  {
    name: 'Dr. Eric Mukiza',
    specialty: 'Cardiology',
    rating: '4.8',
    nextSlot: 'Tomorrow · 9:15 AM',
  },
  {
    name: 'Dr. Claire Uwimana',
    specialty: 'Pediatrics',
    rating: '5.0',
    nextSlot: 'Thu · 1:00 PM',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="page-shell pt-6">
        <nav className="flex items-center justify-between gap-4 rounded-full border border-line bg-surface/90 px-4 py-3 shadow-card backdrop-blur-sm">
          <BrandHeader compact />

          <div className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
            <a href="#services" className="transition hover:text-primary">Services</a>
            <a href="#doctors" className="transition hover:text-primary">Doctors</a>
            <a href="#about" className="transition hover:text-primary">About</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Book now
            </Link>
          </div>
        </nav>
      </header>

      <main className="page-shell pb-16 pt-10 sm:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill border border-primary/10 bg-primary-50 px-3 py-1 text-label-xs uppercase tracking-[0.14em] text-primary">
              <Stethoscope aria-hidden="true" className="h-4 w-4" />
              Trusted local care
            </div>

            <h1 className="mt-5 max-w-xl text-4xl font-extrabold tracking-[-0.04em] text-primary sm:text-5xl lg:text-6xl">
              Better healthcare starts with a calmer booking experience.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
              OpenCare brings appointments, doctor availability and patient support into one clear, secure platform for modern clinics.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Book an appointment
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" />
                Same-day availability
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" />
                Secure patient access
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-primary-100 via-white to-accent-100 blur-3xl" />
            <div className="overflow-hidden rounded-[32px] border border-line bg-surface p-5 shadow-lift">
              <div className="rounded-[24px] bg-primary p-5 text-white">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>Clinic schedule</span>
                  <span className="rounded-pill bg-white/10 px-2 py-1">Today</span>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    { time: '09:00', title: 'General consultation', doctor: 'Dr. Ndayisenga' },
                    { time: '11:30', title: 'Heart review', doctor: 'Dr. Mukiza' },
                    { time: '15:00', title: 'Paediatric check-up', doctor: 'Dr. Uwimana' },
                  ].map((slot) => (
                    <div key={slot.time} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-white/70">{slot.time}</div>
                        <div className="mt-1 font-semibold">{slot.title}</div>
                      </div>
                      <div className="text-right text-xs text-white/80">{slot.doctor}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-canvas px-4 py-3">
                <div>
                  <div className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Next available</div>
                  <div className="mt-1 font-semibold text-ink">Dr. Claire Uwimana</div>
                </div>
                <div className="rounded-pill bg-accent-100 px-3 py-1 text-sm font-semibold text-primary">3:45 PM</div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mt-20">
          <div className="mb-8 max-w-xl">
            <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Why patients choose us</p>
            <h2 className="mt-2 text-section-title text-primary">Everything your clinic needs to feel more human.</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-[28px] border border-line bg-surface p-6 shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="doctors" className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-label-xs uppercase tracking-[0.14em] text-ink-muted">Featured specialists</p>
              <h2 className="mt-2 text-section-title text-primary">Meet the care team.</h2>
            </div>
            <Link to="/auth" className="hidden text-sm font-semibold text-primary md:inline-flex">
              View all doctors →
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {doctors.map((doctor) => (
              <article key={doctor.name} className="rounded-[28px] border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl font-bold text-primary">
                    {doctor.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex items-center gap-1 rounded-pill bg-accent-100 px-2 py-1 text-xs font-semibold text-primary">
                    <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                    {doctor.rating}
                  </div>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-ink">{doctor.name}</h3>
                <p className="mt-1 text-sm text-primary">{doctor.specialty}</p>

                <div className="mt-4 space-y-2 text-sm text-ink-muted">
                  <div className="flex items-center gap-2">
                    <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                    Kigali Clinic
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-primary" />
                    {doctor.nextSlot}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-5 w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
                >
                  View profile
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="mt-20 rounded-[32px] border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-[28px] bg-primary p-6 text-white">
              <p className="text-label-xs uppercase tracking-[0.14em] text-white/80">Our promise</p>
              <h3 className="mt-2 text-3xl font-bold">Healthcare access without the friction.</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Transparent appointment availability',
                'Secure role-based patient access',
                'Fewer missed bookings and follow-up delays',
                'A calmer experience for your clinic team',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-canvas p-4 text-sm font-medium text-ink">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
