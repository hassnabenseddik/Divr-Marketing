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
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=70';

const BLOCKS = [
  {
    icon: <Percent className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Zero Commission for 6 Months',
    description: 'Every booking goes directly to you during your founding period.',
  },
  {
    icon: <UserCircle2 className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Your Own Guide Profile',
    description: 'Showcase your specialty, experience, and availability in one place.',
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
          headline="List your expertise. Fill your calendar."
          subline="Whether you freelance, lead specialty dives, or offer private instruction, Divr connects you directly with divers looking for exactly what you offer. Zero commission for founding guides."
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
