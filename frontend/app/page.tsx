import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-200px)] items-center">
        <div className="container-x py-24 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-lime">
            Coming 2026
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.05] text-cream sm:text-6xl">
            The marketplace built for divers and operators.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-cream/70">
            Verified operators, curated packages, and a global community of divers heading to the
            same destinations.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/waitlist" className="btn-lime" data-testid="home-cta-waitlist">
              Join the Waitlist
            </Link>
            <Link
              href="/for-operators"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-cream transition hover:border-lime hover:text-lime"
              data-testid="home-cta-operators"
            >
              Apply as Founding Partner →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
