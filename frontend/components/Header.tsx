'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Logo from './Logo';

const navLink =
  'text-[15px] font-medium text-cream/80 transition-colors hover:text-lime focus:text-lime';

export default function Header() {
  const [openOps, setOpenOps] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const opsRef = useRef<HTMLDivElement>(null);

  // close the operators dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (opsRef.current && !opsRef.current.contains(e.target as Node)) setOpenOps(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-navy/85 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between sm:h-20">
        <Link href="/" aria-label="Divr — home" className="flex items-center" data-testid="header-logo">
          <Logo className="text-2xl sm:text-3xl" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <div ref={opsRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenOps((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[15px] font-medium text-cream transition hover:border-lime hover:text-lime"
              data-testid="header-for-operators"
              aria-expanded={openOps}
              aria-haspopup="menu"
            >
              For Operators
              <ChevronDown className={`h-4 w-4 transition-transform ${openOps ? 'rotate-180' : ''}`} />
            </button>
            {openOps && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-navy-soft shadow-2xl shadow-black/40"
                data-testid="header-operators-dropdown"
              >
                <Link
                  href="/for-operators"
                  className="block px-4 py-3 text-[15px] text-cream transition hover:bg-white/[0.04] hover:text-lime"
                  onClick={() => setOpenOps(false)}
                >
                  Apply as Founding Partner
                </Link>
                <Link
                  href="/for-guides"
                  className="block border-t border-white/[0.06] px-4 py-3 text-[15px] text-cream transition hover:bg-white/[0.04] hover:text-lime"
                  onClick={() => setOpenOps(false)}
                >
                  Independent Guides
                </Link>
              </div>
            )}
          </div>

          <Link href="/#how-it-works" className={`${navLink} px-3 py-2`} data-testid="header-how-it-works">
            How It Works
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          aria-expanded={openMobile}
          aria-label="Toggle navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-cream md:hidden"
          data-testid="header-mobile-toggle"
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-5 bg-cream transition ${openMobile ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-cream transition ${openMobile ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-cream transition ${openMobile ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile drawer */}
      {openMobile && (
        <div className="border-t border-white/[0.06] bg-navy md:hidden" data-testid="header-mobile-menu">
          <nav className="container-x flex flex-col gap-1 py-4">
            <p className="px-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
              For Operators
            </p>
            <Link href="/for-operators" onClick={() => setOpenMobile(false)} className="rounded-lg px-2 py-3 text-base text-cream hover:bg-white/[0.04]">
              Apply as Founding Partner
            </Link>
            <Link href="/for-guides" onClick={() => setOpenMobile(false)} className="rounded-lg px-2 py-3 text-base text-cream hover:bg-white/[0.04]">
              Independent Guides
            </Link>
            <div className="my-2 border-t border-white/[0.06]" />
            <Link href="/#how-it-works" onClick={() => setOpenMobile(false)} className="rounded-lg px-2 py-3 text-base text-cream hover:bg-white/[0.04]">
              How It Works
            </Link>
            <Link href="#" onClick={() => setOpenMobile(false)} className="rounded-lg px-2 py-3 text-base text-cream hover:bg-white/[0.04]">
              Sign In
            </Link>
            <Link
              href="#"
              onClick={() => setOpenMobile(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-lime px-5 py-3 text-base font-semibold text-navy"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
