'use client';

import { useState } from 'react';
import SuccessMessage from './SuccessMessage';
import { apiUrl } from '@/lib/api';
import { COUNTRIES } from '@/lib/countries';

const SPECIALTIES = [
  'Freediving',
  'Technical Diving',
  'Underwater Photography',
  'Marine Biology',
  'Night Diving',
  'General Guiding',
  'Other',
];

export default function GuideForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    specialty: '',
    country: '',
    base_location: '',
    certifications: '',
    email: '',
    whatsapp: '',
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/guides'), {
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
        message="Application received. We'll review your profile and be in touch within 48 hours."
        testId="guide-success"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="guide-form" noValidate>
      <div>
        <label htmlFor="g_full_name" className="field-label">Full Name</label>
        <input id="g_full_name" name="full_name" type="text" required
          value={form.full_name} onChange={onChange} autoComplete="name"
          className="field-input" data-testid="guide-full-name" />
      </div>

      <div>
        <label htmlFor="g_specialty" className="field-label">Specialty</label>
        <select id="g_specialty" name="specialty" required
          value={form.specialty} onChange={onChange}
          className="field-select" data-testid="guide-specialty">
          <option value="" disabled>Select a specialty</option>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="g_country" className="field-label">Country</label>
        <select id="g_country" name="country" required
          value={form.country} onChange={onChange}
          className="field-select" data-testid="guide-country">
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
        <label htmlFor="g_base_location" className="field-label">Base Location</label>
        <input id="g_base_location" name="base_location" type="text" required
          placeholder="e.g. Bali"
          value={form.base_location} onChange={onChange}
          className="field-input" data-testid="guide-base-location" />
      </div>

      <div>
        <label htmlFor="g_certs" className="field-label">Certifications held</label>
        <textarea id="g_certs" name="certifications" required rows={3}
          placeholder="e.g. PADI Divemaster, SSI Tec 50, EFR Instructor"
          value={form.certifications} onChange={onChange}
          className="field-input resize-none" data-testid="guide-certifications" />
      </div>

      <div>
        <label htmlFor="g_email" className="field-label">Email</label>
        <input id="g_email" name="email" type="email" required
          value={form.email} onChange={onChange} autoComplete="email"
          className="field-input" data-testid="guide-email" />
      </div>

      <div>
        <label htmlFor="g_whatsapp" className="field-label">
          WhatsApp Number
          <span className="ml-2 font-normal text-cream/45">(international format, e.g. +62 812 345 6789)</span>
        </label>
        <input id="g_whatsapp" name="whatsapp" type="tel" required
          placeholder="+__ ___ ___ ____"
          value={form.whatsapp} onChange={onChange} autoComplete="tel"
          className="field-input" data-testid="guide-whatsapp" />
      </div>

      {error && <p className="text-sm text-red-300" data-testid="guide-error" role="alert">{error}</p>}

      <button type="submit" disabled={submitting}
        className="btn-lime w-full disabled:opacity-60" data-testid="guide-submit">
        {submitting ? 'Submitting…' : 'Apply as a Guide'}
      </button>

      <p className="pt-2 text-center text-sm text-cream/45" data-testid="guide-helper">
        We&rsquo;ll review your application and be in touch within 48 hours.
      </p>
    </form>
  );
}
