import type { Metadata } from 'next';
import { Percent, ArrowUpRight, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Benefits from '@/components/Benefits';
import FormSection from '@/components/FormSection';
import OperatorForm from '@/components/OperatorForm';

export const metadata: Metadata = {
  title: 'Apply as a Founding Partner — Divr for Operators',
  description:
    'Reach divers who are ready to book. Zero commission for founding partners, full control over your listings, and a global diver community sent directly to you.',
};

const HERO_IMAGE =
  'https://customer-assets.emergentagent.com/job_divr-guides/artifacts/k5s8izg4_Instructor.jpeg';

const BLOCKS = [
  {
    icon: <Percent className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Zero Commission for 6 Months',
    description: 'Keep 100% of every booking during your first 10 bookings.',
  },
  {
    icon: <ArrowUpRight className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Priority Placement at Launch',
    description: 'Your listings appear first when divers search your destination.',
  },
  {
    icon: <Sparkles className="h-6 w-6" strokeWidth={2.2} />,
    title: 'Shape the Platform',
    description: 'Direct input on the features that matter most to operators.',
  },
];

export default function ForOperatorsPage() {
  return (
    <>
      <Header />
      <main data-testid="for-operators-page">
        <Hero
          imageUrl={HERO_IMAGE}
          imageAlt="Dive boat at anchor over a tropical reef"
          headline="Reach divers who are ready to book."
          subline="Divr is building the marketplace operators actually want. Zero commission for your first 10 bookings. Full control over your listings. Pre-qualified solo divers matched to your trip type."
        />
        <Benefits blocks={BLOCKS} />
        <FormSection headline="Apply as Founding Operator.">
          <OperatorForm />
        </FormSection>
      </main>
      <Footer />
    </>
  );
}
