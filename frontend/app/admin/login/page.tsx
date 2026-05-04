'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { apiUrl } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid email or password.');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center">
          <Logo className="text-3xl" />
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-cream/50">Admin sign in</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-white/[0.06] bg-navy-soft/50 p-7 sm:p-9"
          data-testid="admin-login-form"
          noValidate
        >
          <div>
            <label htmlFor="admin_email" className="field-label">Email</label>
            <input
              id="admin_email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              data-testid="admin-email"
            />
          </div>

          <div>
            <label htmlFor="admin_password" className="field-label">Password</label>
            <input
              id="admin_password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              data-testid="admin-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300" role="alert" data-testid="admin-login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-lime w-full disabled:opacity-60"
            data-testid="admin-login-submit"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
