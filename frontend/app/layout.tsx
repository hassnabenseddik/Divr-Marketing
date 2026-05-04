import type { Metadata } from 'next';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Divr — The marketplace for divers and operators',
  description:
    'Divr connects divers with verified operators, curated packages, and independent guides. Join the waitlist or apply as a founding partner.',
  metadataBase: new URL('https://divr.world'),
  openGraph: {
    title: 'Divr — The marketplace for divers and operators',
    description:
      'Verified operators, curated packages, and divers heading to the same destinations. Be first in when we launch.',
    type: 'website',
    url: 'https://divr.world',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-navy text-cream antialiased">{children}</body>
    </html>
  );
}
