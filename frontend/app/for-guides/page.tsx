import type { Metadata } from 'next';
import { Percent, UserCircle2, Compass } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Benefits from '@/components/Benefits';
import FormSection from '@/components/FormSection';
import GuideForm from '@/components/GuideForm';

export const metadata: Metadata = {
  title: 'Join as a Founding Guide — Divr for Independent Guides',
  description:
    'List your expertise. Fill your calendar. Divr connects independent guides directly with divers looking for exactly what they offer. Zero commission for founding guides.',
};

const HERO_IMAGE =
  'https://customer-assets.emergentagent.com/job_divr-guides/artifacts/u2e5gdmy_Guides.jpeg';

const BLOCKS = [
  {
    icon: <Percent className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Zero Commission for 6 Months',
    description: 'Every booking goes directly to you during your founding period.',
  },
  {
    icon: <UserCircle2 className="h-6 w-6" strokeWidth={2.2} />,
    title: 'List Your Own Packages',
    description: 'Create and manage your dive packages, workshops, and guided experiences in one place.',
  },
  {
    icon: <Compass className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Solo Divers Ready to Book',
    description: 'Connect with international divers actively looking for guided experiences.',
  },
];

export default function ForGuidesPage() {
  return (
    <>
      <Header />
      <main data-testid="for-guides-page">
        <Hero
          imageUrl={HERO_IMAGE}
          imageAlt="Dive guide leading divers through a clear blue passage"
          headline="List your packages. Fill your calendar."
          subline="Whether you freelance, lead specialty dives, or offer private instruction, Divr connects you directly with divers looking for exactly what you offer. Zero commission for your first 10 bookings."
        />
        <Benefits blocks={BLOCKS} />
        <FormSection headline="Join as a Founding Guide.">
          <GuideForm />
        </FormSection>
      </main>
      <Footer />
    </>
  );
}
