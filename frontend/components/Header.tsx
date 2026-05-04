import Link from 'next/link';
import Logo from './Logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-navy/85 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between sm:h-20">
        <Link href="/" aria-label="Divr — home" className="flex items-center" data-testid="header-logo">
          <Logo className="h-7 w-auto sm:h-8" />
        </Link>
        <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-cream/50 sm:inline">
          The dive marketplace
        </span>
      </div>
    </header>
  );
}
