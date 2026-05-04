'use client';

import { useState } from 'react';
import SuccessMessage from './SuccessMessage';
import { apiUrl } from '@/lib/api';
import { COUNTRIES } from '@/lib/countries';

const REGIONS = [
  'Red Sea',
  'Southeast Asia',
  'Caribbean',
  'Indian Ocean',
  'Mediterranean',
  'Other',
];

export default function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    country: '',
    dive_region: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/waitlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessMessage
        message="You're on the list. We'll be in touch soon."
        testId="waitlist-success"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="waitlist-form" noValidate>
      <div>
        <label htmlFor="first_name" className="field-label">First Name</label>
        <input id="first_name" name="first_name" type="text" required
          value={form.first_name} onChange={onChange} autoComplete="given-name"
          className="field-input" data-testid="waitlist-first-name" />
      </div>

      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" required
          value={form.email} onChange={onChange} autoComplete="email"
          className="field-input" data-testid="waitlist-email" />
      </div>

      <div>
        <label htmlFor="country" className="field-label">Country</label>
        <select id="country" name="country" required
          value={form.country} onChange={onChange}
          className="field-select" data-testid="waitlist-country">
          <option value="" disabled>Select your country</option>
          {COUNTRIES.map((c) =>
            c.startsWith('─') ? (
              <option key={c} disabled>{c}</option>
            ) : (
              <option key={c} value={c}>{c}</option>
            ),
          )}
        </select>
      </div>

      <div>
        <label htmlFor="dive_region" className="field-label">Where do you dive most</label>
        <select id="dive_region" name="dive_region" required
          value={form.dive_region} onChange={onChange}
          className="field-select" data-testid="waitlist-region">
          <option value="" disabled>Select a region</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-300" data-testid="waitlist-error" role="alert">{error}</p>}

      <button type="submit" disabled={submitting}
        className="btn-lime w-full disabled:opacity-60" data-testid="waitlist-submit">
        {submitting ? 'Joining…' : 'Get Early Access'}
      </button>

      <p className="pt-2 text-center text-sm text-cream/45" data-testid="waitlist-helper">
        No spam. Just early access and updates that matter.
      </p>
    </form>
  );
}
