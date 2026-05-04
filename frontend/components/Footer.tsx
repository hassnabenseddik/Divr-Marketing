import Link from 'next/link';
import Logo from './Logo';

const linkCls =
  'block text-[15px] text-cream/65 transition-colors hover:text-lime focus:text-lime';

const colHeading = 'mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-lime';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-navy-deep" data-testid="site-footer">
      <div className="container-x py-14 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label="Divr — home" className="inline-flex">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/55">
              The marketplace built for divers, operators, and independent guides.
            </p>
            <p className="mt-5 text-sm text-cream/55">
              <a
                href="mailto:hello@divrworld.com"
                className="text-cream/70 transition hover:text-lime"
              >
                hello@divrworld.com
              </a>
            </p>
          </div>

          <div>
            <h4 className={colHeading}>For Divers</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/waitlist" className={linkCls} data-testid="footer-waitlist">
                  Join the Waitlist
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={colHeading}>For Operators</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/for-operators"
                  className={linkCls}
                  data-testid="footer-for-operators"
                >
                  Apply as Founding Partner
                </Link>
              </li>
              <li>
                <Link href="/for-guides" className={linkCls} data-testid="footer-for-guides">
                  Independent Guides
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={colHeading}>Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className={linkCls} data-testid="footer-about">
                  About Divr
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkCls} data-testid="footer-blog">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className={linkCls} data-testid="footer-careers">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className={linkCls} data-testid="footer-press">
                  Press
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/[0.06] pt-8">
          <div className="flex flex-col gap-4 text-sm text-cream/50 sm:flex-row sm:items-start sm:justify-between">
            <p data-testid="footer-copyright">© 2026 Divr. All rights reserved.</p>
            <p
              className="max-w-xl text-left sm:text-right"
              data-testid="footer-disclaimer"
            >
              All diving operations and safety remain the responsibility of dive centers and
              operators.
            </p>
          </div>
          <p
            className="mt-6 text-center text-xs text-cream/45"
            data-testid="footer-trust-line"
          >
            Payments protected by Stripe. Divr is a registered marketplace platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
