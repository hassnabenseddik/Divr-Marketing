import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import FormSection from '@/components/FormSection';
import WaitlistForm from '@/components/WaitlistForm';

export const metadata: Metadata = {
  title: 'Join the Waitlist — Divr',
  description:
    'Be first in when Divr launches. Verified operators, curated packages, and a global community of divers heading to the same destinations.',
};

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1682687982360-3fbab65f9d50?auto=format&fit=crop&w=1920&q=70';

export default function WaitlistPage() {
  return (
    <>
      <Header />
      <main data-testid="waitlist-page">
        <Hero
          imageUrl={HERO_IMAGE}
          imageAlt="Diver swimming through a sunlit reef"
          headline="Your next dive crew is waiting."
          subline="Divr connects you with verified operators, curated packages, and divers heading to the same destinations. Be first in when we launch."
        />
        <FormSection headline="Join the Waitlist.">
          <WaitlistForm />
        </FormSection>
      </main>
      <Footer />
    </>
  );
}
