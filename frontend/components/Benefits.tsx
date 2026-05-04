import type { ReactNode } from 'react';

type BenefitsBlock = { icon: ReactNode; title: string; description: string };

export default function Benefits({ blocks }: { blocks: BenefitsBlock[] }) {
  return (
    <section className="bg-navy" data-testid="benefits-section">
      <div className="container-x grid gap-6 py-16 sm:py-20 md:grid-cols-3 md:gap-8">
        {blocks.map((b, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-navy-soft/40 p-7 transition hover:border-lime/40 hover:bg-navy-soft/70"
            data-testid={`benefit-${i + 1}`}
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/30">
              {b.icon}
            </div>
            <h3 className="text-xl font-bold text-cream">{b.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-cream/60">{b.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
