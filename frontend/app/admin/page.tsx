'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Download, RefreshCw } from 'lucide-react';
import Logo from '@/components/Logo';
import { apiUrl } from '@/lib/api';

type TabKey = 'waitlist' | 'operators' | 'guides';

type Summary = { waitlist_count: number; operator_count: number; guide_count: number };

const COLUMN_DEFS: Record<TabKey, { key: string; label: string }[]> = {
  waitlist: [
    { key: 'created_at', label: 'Date' },
    { key: 'first_name', label: 'First Name' },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country' },
    { key: 'dive_region', label: 'Dive Region' },
  ],
  operators: [
    { key: 'created_at', label: 'Date' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'dive_center_name', label: 'Dive Center' },
    { key: 'country', label: 'Country' },
    { key: 'destination', label: 'Destination' },
    { key: 'email', label: 'Email' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'monthly_bookings', label: 'Monthly Bookings' },
  ],
  guides: [
    { key: 'created_at', label: 'Date' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'country', label: 'Country' },
    { key: 'base_location', label: 'Base Location' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'email', label: 'Email' },
    { key: 'whatsapp', label: 'WhatsApp' },
  ],
};

const TAB_LABELS: Record<TabKey, string> = {
  waitlist: 'Diver Waitlist',
  operators: 'Operator Applications',
  guides: 'Guide Applications',
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => c.label).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = String(row[c.key] ?? '');
          const escaped = raw.replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(','),
    )
    .join('\n');
  return `${header}\n${body}`;
}

function downloadCsv(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('waitlist');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>('');

  const checkAuth = useCallback(async () => {
    const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
    if (!res.ok) {
      router.replace('/admin/login');
      return false;
    }
    const me = await res.json();
    setAdminEmail(me.email);
    return true;
  }, [router]);

  const loadAll = useCallback(async (which: TabKey) => {
    setLoading(true);
    try {
      const [sumRes, rowsRes] = await Promise.all([
        fetch(apiUrl('/api/admin/summary'), { credentials: 'include' }),
        fetch(apiUrl(`/api/admin/${which}`), { credentials: 'include' }),
      ]);
      if (sumRes.status === 401 || rowsRes.status === 401) {
        router.replace('/admin/login');
        return;
      }
      if (sumRes.ok) setSummary(await sumRes.json());
      if (rowsRes.ok) setRows(await rowsRes.json());
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await checkAuth();
      if (mounted && ok) await loadAll(tab);
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAll(tab); }, [tab, loadAll]);

  const onLogout = async () => {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    router.replace('/admin/login');
  };

  const onExport = () => {
    const cols = COLUMN_DEFS[tab];
    const csv = toCsv(rows, cols);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`divr-${tab}-${stamp}.csv`, csv);
  };

  const cols = COLUMN_DEFS[tab];

  return (
    <main className="min-h-screen bg-navy" data-testid="admin-dashboard">
      <header className="border-b border-white/[0.06] bg-navy-deep">
        <div className="container-x flex h-16 items-center justify-between sm:h-20">
          <div className="flex items-center gap-4">
            <Logo className="text-2xl" />
            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-cream/50 sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-cream/55 sm:inline" data-testid="admin-email-label">
              {adminEmail}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-cream transition hover:border-lime hover:text-lime"
              data-testid="admin-logout"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="container-x py-8 sm:py-10">
        {/* summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Diver Waitlist" value={summary?.waitlist_count ?? '—'} />
          <SummaryCard label="Operator Applications" value={summary?.operator_count ?? '—'} />
          <SummaryCard label="Guide Applications" value={summary?.guide_count ?? '—'} />
        </div>

        {/* tabs + actions */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist">
            {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === k
                    ? 'bg-lime text-navy'
                    : 'border border-white/10 text-cream/75 hover:border-lime/50 hover:text-lime'
                }`}
                data-testid={`admin-tab-${k}`}
              >
                {TAB_LABELS[k]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAll(tab)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-cream/80 transition hover:border-lime hover:text-lime"
              data-testid="admin-refresh"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={!rows.length}
              className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-navy transition hover:bg-lime-bright disabled:opacity-40"
              data-testid="admin-export"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.06] bg-navy-soft/40">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="whitespace-nowrap px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-cream/55"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-cream/55">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="px-4 py-12 text-center text-cream/55" data-testid="admin-empty">
                    No submissions yet.
                  </td>
                </tr>
              ) : rows.map((r, i) => (
                <tr key={String(r.id ?? i)} className="hover:bg-white/[0.02]" data-testid="admin-row">
                  {cols.map((c) => {
                    const value = r[c.key];
                    const display =
                      c.key === 'created_at' && typeof value === 'string'
                        ? formatDate(value)
                        : c.key === 'email' && typeof value === 'string'
                        ? <a className="text-cream hover:text-lime" href={`mailto:${value}`}>{value}</a>
                        : c.key === 'whatsapp' && typeof value === 'string'
                        ? <a className="text-cream hover:text-lime" href={`https://wa.me/${value.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">{value}</a>
                        : String(value ?? '');
                    return (
                      <td key={c.key} className="whitespace-nowrap px-4 py-3 align-top text-cream/85">
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-cream/40">
          Showing the most recent {rows.length} {rows.length === 1 ? 'entry' : 'entries'}.
        </p>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-navy-soft/40 p-6"
      data-testid={`admin-summary-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">{label}</p>
      <p className="mt-2 text-4xl font-extrabold text-cream">{value}</p>
    </div>
  );
}
