import Link from 'next/link';
import Image from 'next/image';
import { UserCircle2, SlidersHorizontal, ShieldCheck, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1646947009718-1cb77aaa2a6d?auto=format&fit=crop&w=1920&q=70';

const STEPS = [
  {
    icon: <UserCircle2 className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Set Your Profile',
    body: 'Add your certification, dive count, and interests. Find trips with divers at your level.',
  },
  {
    icon: <SlidersHorizontal className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Filter Trips and Crew',
    body: 'Browse trips and filter by experience level, certification required, and dive focus. See who\u2019s already joined.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Book When Group Fills',
    body: 'Reserve your spot. Your booking is confirmed once the group reaches minimum size. Payment held in escrow until then.',
  },
];

const OP_BULLETS = [
  'Zero commission on your first 10 bookings',
  'Featured placement when we launch',
  'Direct input on platform features',
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main data-testid="home-page">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src={HERO_IMAGE}
              alt="Diver swimming through a sunlit reef"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 hero-overlay" />
          </div>

          <div className="container-x py-24 sm:py-32 lg:py-40">
            <div className="max-w-3xl">
              <h1
                className="text-4xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-6xl"
                data-testid="hero-headline"
              >
                Find trips with divers who match your level.
              </h1>
              <p
                className="mt-6 max-w-2xl text-lg leading-relaxed text-cream/85 sm:text-xl"
                data-testid="hero-subline"
              >
                Filter by certification, experience, and dive interests. See who&rsquo;s already
                joined. Your booking is confirmed once your group reaches minimum size.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/waitlist" className="btn-lime" data-testid="home-cta-primary">
                  Get Early Access
                </Link>
                <Link
                  href="/for-operators"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-cream backdrop-blur-sm transition hover:border-lime hover:text-lime"
                  data-testid="home-cta-secondary"
                >
                  List Your Trips First
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW MATCHING WORKS */}
        <section
          id="how-it-works"
          className="bg-navy scroll-mt-24"
          data-testid="how-matching-works"
        >
          <div className="container-x py-20 sm:py-24">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
                How matching works
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-cream sm:text-4xl">
                Three steps to your next dive crew.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="rounded-2xl border border-white/[0.06] bg-navy-soft/40 p-7 transition hover:border-lime/40 hover:bg-navy-soft/70"
                  data-testid={`how-step-${i + 1}`}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/30">
                    {s.icon}
                  </div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-lime/80">
                    STEP {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-xl font-bold text-cream">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/65">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OPERATOR SECTION */}
        <section className="bg-navy-deep" data-testid="home-operator-section">
          <div className="container-x py-20 sm:py-28">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
                  For Operators
                </p>
                <h2
                  className="text-3xl font-extrabold tracking-tight text-cream sm:text-4xl lg:text-5xl"
                  data-testid="operator-headline"
                >
                  Get divers who match your trips.
                </h2>
                <p
                  className="mt-5 max-w-xl text-lg leading-relaxed text-cream/70"
                  data-testid="operator-subline"
                >
                  Divers on Divr filter by certification, experience, and interests. The ones
                  who book are already qualified for your trip type.
                </p>

                <Link
                  href="/for-operators"
                  className="btn-lime mt-8"
                  data-testid="operator-cta"
                >
                  List Your Trips First
                </Link>
              </div>

              <div className="lg:col-span-5">
                <ul className="space-y-4 rounded-2xl border border-white/[0.06] bg-navy-soft/40 p-6 sm:p-8">
                  {OP_BULLETS.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-3 text-cream"
                      data-testid="operator-bullet"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/30">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-cream/85">{b}</span>
                    </li>
                  ))}
                </ul>
                <p
                  className="mt-4 px-2 text-sm leading-relaxed text-cream/55"
                  data-testid="operator-commission-note"
                >
                  10% commission after your first 10 bookings.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
