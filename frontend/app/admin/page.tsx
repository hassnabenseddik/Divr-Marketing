'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Download, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { apiUrl } from '@/lib/api';
import { COUNTRIES } from '@/lib/countries';

type TabKey = 'waitlist' | 'operators' | 'guides';

type Summary = { waitlist_count: number; operator_count: number; guide_count: number };

type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select-country' | 'select';

type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  hideInTable?: boolean;
};

const REGIONS = ['Red Sea', 'Southeast Asia', 'Caribbean', 'Indian Ocean', 'Mediterranean', 'Other'];
const VOLUMES = ['Under 10', '10 to 30', '30 to 100', '100+'];
const SPECIALTIES = [
  'Freediving', 'Technical Diving', 'Underwater Photography',
  'Marine Biology', 'Night Diving', 'General Guiding', 'Other',
];

const SCHEMA: Record<TabKey, FieldDef[]> = {
  waitlist: [
    { key: 'first_name', label: 'First Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'country', label: 'Country', type: 'select-country' },
    { key: 'dive_region', label: 'Dive Region', type: 'select', options: REGIONS },
  ],
  operators: [
    { key: 'full_name', label: 'Full Name', type: 'text' },
    { key: 'dive_center_name', label: 'Dive Center', type: 'text' },
    { key: 'country', label: 'Country', type: 'select-country' },
    { key: 'destination', label: 'Destination', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel' },
    { key: 'monthly_bookings', label: 'Monthly Bookings', type: 'select', options: VOLUMES },
  ],
  guides: [
    { key: 'full_name', label: 'Full Name', type: 'text' },
    { key: 'specialty', label: 'Specialty', type: 'select', options: SPECIALTIES },
    { key: 'country', label: 'Country', type: 'select-country' },
    { key: 'base_location', label: 'Base Location', type: 'text' },
    { key: 'certifications', label: 'Certifications', type: 'textarea' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'tel' },
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
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function toCsv(rows: Record<string, unknown>[], cols: { key: string; label: string }[]): string {
  const header = cols.map((c) => c.label).join(',');
  const body = rows
    .map((row) => cols.map((c) => {
      const raw = String(row[c.key] ?? '');
      const escaped = raw.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

function downloadCsv(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('waitlist');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [deletingRow, setDeletingRow] = useState<Record<string, unknown> | null>(null);

  const checkAuth = useCallback(async () => {
    const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
    if (!res.ok) { router.replace('/admin/login'); return false; }
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
        router.replace('/admin/login'); return;
      }
      if (sumRes.ok) setSummary(await sumRes.json());
      if (rowsRes.ok) setRows(await rowsRes.json());
    } finally { setLoading(false); }
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

  const fields = SCHEMA[tab];
  const tableCols = [
    { key: 'created_at', label: 'Date' },
    ...fields.filter((f) => !f.hideInTable),
  ];

  const onExport = () => {
    const csv = toCsv(rows, tableCols);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`divr-${tab}-${stamp}.csv`, csv);
  };

  const onDelete = async () => {
    if (!deletingRow) return;
    const id = String(deletingRow.id);
    const res = await fetch(apiUrl(`/api/admin/${tab}/${id}`), {
      method: 'DELETE', credentials: 'include',
    });
    if (res.ok) {
      setDeletingRow(null);
      await loadAll(tab);
    }
  };

  const onSaveEdit = async (patch: Record<string, string>) => {
    if (!editingRow) return;
    const id = String(editingRow.id);
    const res = await fetch(apiUrl(`/api/admin/${tab}/${id}`), {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setEditingRow(null);
      await loadAll(tab);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(typeof data?.detail === 'string' ? data.detail : 'Update failed');
    }
  };

  return (
    <main className="min-h-screen bg-navy" data-testid="admin-dashboard">
      <header className="border-b border-white/[0.06] bg-navy-deep">
        <div className="container-x flex h-16 items-center justify-between sm:h-20">
          <div className="flex items-center gap-4">
            <Logo className="text-2xl" />
            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-cream/50 sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-cream/55 sm:inline" data-testid="admin-email-label">{adminEmail}</span>
            <button type="button" onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-cream transition hover:border-lime hover:text-lime"
              data-testid="admin-logout">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="container-x py-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Diver Waitlist" value={summary?.waitlist_count ?? '—'} />
          <SummaryCard label="Operator Applications" value={summary?.operator_count ?? '—'} />
          <SummaryCard label="Guide Applications" value={summary?.guide_count ?? '—'} />
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist">
            {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === k ? 'bg-lime text-navy'
                    : 'border border-white/10 text-cream/75 hover:border-lime/50 hover:text-lime'
                }`}
                data-testid={`admin-tab-${k}`}>
                {TAB_LABELS[k]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => loadAll(tab)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-cream/80 transition hover:border-lime hover:text-lime"
              data-testid="admin-refresh">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={onExport} disabled={!rows.length}
              className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-navy transition hover:bg-lime-bright disabled:opacity-40"
              data-testid="admin-export">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.06] bg-navy-soft/40">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                {tableCols.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs text-cream/55">
                    {c.label}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold uppercase tracking-wider text-xs text-cream/55">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr><td colSpan={tableCols.length + 1} className="px-4 py-12 text-center text-cream/55">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={tableCols.length + 1} className="px-4 py-12 text-center text-cream/55" data-testid="admin-empty">No submissions yet.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={String(r.id ?? i)} className="hover:bg-white/[0.02]" data-testid="admin-row">
                  {tableCols.map((c) => {
                    const value = r[c.key];
                    const display =
                      c.key === 'created_at' && typeof value === 'string' ? formatDate(value)
                      : c.key === 'email' && typeof value === 'string'
                        ? <a className="text-cream hover:text-lime" href={`mailto:${value}`}>{value}</a>
                      : c.key === 'whatsapp' && typeof value === 'string'
                        ? <a className="text-cream hover:text-lime" href={`https://wa.me/${value.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">{value}</a>
                      : String(value ?? '');
                    return <td key={c.key} className="whitespace-nowrap px-4 py-3 align-top text-cream/85">{display}</td>;
                  })}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => setEditingRow(r)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-cream/70 transition hover:border-lime hover:text-lime"
                        title="Edit"
                        data-testid="admin-edit-btn">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setDeletingRow(r)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-cream/70 transition hover:border-red-400 hover:text-red-400"
                        title="Delete"
                        data-testid="admin-delete-btn">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-cream/40">
          Showing the most recent {rows.length} {rows.length === 1 ? 'entry' : 'entries'}.
        </p>
      </section>

      {editingRow && (
        <EditModal
          tabLabel={TAB_LABELS[tab]}
          fields={fields}
          row={editingRow}
          onCancel={() => setEditingRow(null)}
          onSave={onSaveEdit}
        />
      )}

      {deletingRow && (
        <ConfirmModal
          title="Delete this entry?"
          body={`This will permanently delete the ${TAB_LABELS[tab].toLowerCase()} entry for "${
            String(deletingRow.email ?? deletingRow.full_name ?? deletingRow.first_name ?? deletingRow.id)
          }". This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDeletingRow(null)}
          onConfirm={onDelete}
        />
      )}
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

function EditModal({
  tabLabel, fields, row, onCancel, onSave,
}: {
  tabLabel: string;
  fields: FieldDef[];
  row: Record<string, unknown>;
  onCancel: () => void;
  onSave: (patch: Record<string, string>) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, String(row[f.key] ?? '')])),
  );
  const [saving, setSaving] = useState(false);

  const onChange = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // only send fields that changed
      const patch: Record<string, string> = {};
      fields.forEach((f) => {
        if (draft[f.key] !== String(row[f.key] ?? '')) patch[f.key] = draft[f.key];
      });
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Edit ${tabLabel.replace(/s$/, '')} entry`} onClose={onCancel}>
      <form onSubmit={onSubmit} className="space-y-5" data-testid="admin-edit-form">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="field-label" htmlFor={`edit_${f.key}`}>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea id={`edit_${f.key}`} rows={3}
                value={draft[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="field-input resize-none" />
            ) : f.type === 'select' && f.options ? (
              <select id={`edit_${f.key}`}
                value={draft[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="field-select">
                <option value="" disabled>Select…</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'select-country' ? (
              <select id={`edit_${f.key}`}
                value={draft[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="field-select">
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) =>
                  c.startsWith('─')
                    ? <option key={c} disabled>{c}</option>
                    : <option key={c} value={c}>{c}</option>,
                )}
              </select>
            ) : (
              <input id={`edit_${f.key}`}
                type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                value={draft[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="field-input" />
            )}
          </div>
        ))}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-cream transition hover:border-cream"
            data-testid="admin-edit-cancel">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-lime-bright disabled:opacity-60"
            data-testid="admin-edit-save">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmModal({
  title, body, confirmLabel, danger, onCancel, onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <ModalShell title={title} onClose={onCancel} small>
      <p className="text-[15px] leading-relaxed text-cream/75" data-testid="admin-confirm-body">{body}</p>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel}
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-cream transition hover:border-cream"
          data-testid="admin-confirm-cancel">
          Cancel
        </button>
        <button type="button" disabled={busy}
          onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
            danger
              ? 'bg-red-500 text-white hover:bg-red-400'
              : 'bg-lime text-navy hover:bg-lime-bright'
          }`}
          data-testid="admin-confirm-ok">
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title, onClose, small, children,
}: {
  title: string; onClose: () => void; small?: boolean; children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${small ? 'max-w-md' : 'max-w-lg'} rounded-t-2xl border border-white/[0.06] bg-navy-deep p-6 shadow-2xl shadow-black/40 sm:rounded-2xl sm:p-8`}
        data-testid="admin-modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-cream/60 transition hover:bg-white/[0.04] hover:text-cream"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-5 pr-10 text-xl font-bold tracking-tight text-cream">{title}</h3>
        {children}
      </div>
    </div>
  );
}
