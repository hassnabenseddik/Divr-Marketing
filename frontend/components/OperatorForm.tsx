'use client';

import { useState } from 'react';
import SuccessMessage from './SuccessMessage';
import { apiUrl } from '@/lib/api';

const VOLUMES = ['Under 10', '10 to 30', '30 to 100', '100+'];

export default function OperatorForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    dive_center_name: '',
    country_destination: '',
    email: '',
    whatsapp: '',
    monthly_bookings: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/operators'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SuccessMessage
        message="Application received. We'll be in touch within 48 hours."
        testId="operator-success"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="operator-form" noValidate>
      <div>
        <label htmlFor="op_full_name" className="field-label">Full Name</label>
        <input id="op_full_name" name="full_name" type="text" required
          value={form.full_name} onChange={onChange} autoComplete="name"
          className="field-input" data-testid="operator-full-name" />
      </div>

      <div>
        <label htmlFor="op_dive_center" className="field-label">Dive Center Name</label>
        <input id="op_dive_center" name="dive_center_name" type="text" required
          value={form.dive_center_name} onChange={onChange}
          className="field-input" data-testid="operator-dive-center" />
      </div>

      <div>
        <label htmlFor="op_country_dest" className="field-label">Country and Destination</label>
        <input id="op_country_dest" name="country_destination" type="text" required
          placeholder="e.g. Egypt — Sharm El Sheikh"
          value={form.country_destination} onChange={onChange}
          className="field-input" data-testid="operator-country-destination" />
      </div>

      <div>
        <label htmlFor="op_email" className="field-label">Email</label>
        <input id="op_email" name="email" type="email" required
          value={form.email} onChange={onChange} autoComplete="email"
          className="field-input" data-testid="operator-email" />
      </div>

      <div>
        <label htmlFor="op_whatsapp" className="field-label">
          WhatsApp Number
          <span className="ml-2 font-normal text-cream/45">(international format, e.g. +20 100 123 4567)</span>
        </label>
        <input id="op_whatsapp" name="whatsapp" type="tel" required
          placeholder="+__ ___ ___ ____"
          value={form.whatsapp} onChange={onChange} autoComplete="tel"
          className="field-input" data-testid="operator-whatsapp" />
      </div>

      <div>
        <label htmlFor="op_monthly" className="field-label">Monthly Bookings</label>
        <select id="op_monthly" name="monthly_bookings" required
          value={form.monthly_bookings} onChange={onChange}
          className="field-select" data-testid="operator-monthly-bookings">
          <option value="" disabled>Select a range</option>
          {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-300" data-testid="operator-error" role="alert">{error}</p>
      )}

      <button type="submit" disabled={submitting}
        className="btn-lime w-full disabled:opacity-60"
        data-testid="operator-submit">
        {submitting ? 'Submitting…' : 'Apply Now'}
      </button>

      <p className="pt-2 text-center text-sm text-cream/45" data-testid="operator-helper">
        We onboard a limited number of founding partners. You&rsquo;ll hear from us within 48 hours.
      </p>
    </form>
  );
}
