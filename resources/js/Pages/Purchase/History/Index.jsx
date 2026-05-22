import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatPurchaseInvoiceDate, formatPurchaseReceivedAt } from '../Invoice/formatInvoiceDate';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

function Pagination({ links }) {
    if (!links?.length) return null;
    return (
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Pagination">
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={
                            'inline-flex min-w-[2.25rem] items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition ' +
                            (link.active
                                ? 'border-brand bg-brand text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
                        }
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}

function buildQuery(filters) {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
}

export default function Index({
    invoices,
    filters: filtersProp,
    summary,
    branches,
    suppliers,
    statusOptions,
}) {
    const { flash } = usePage().props;
    const filters = filtersProp ?? {};

    const [scope, setScope] = useState(filters.scope ?? 'received');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [receivedFrom, setReceivedFrom] = useState(filters.received_from ?? '');
    const [receivedTo, setReceivedTo] = useState(filters.received_to ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [supplierId, setSupplierId] = useState(filters.supplier_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [q, setQ] = useState(filters.q ?? '');

    const applyFilters = (e) => {
        e?.preventDefault?.();
        router.get(route('purchase-history.index'), buildQuery({
            scope,
            date_from: dateFrom,
            date_to: dateTo,
            received_from: receivedFrom,
            received_to: receivedTo,
            branch_id: branchId,
            supplier_id: supplierId,
            status,
            q: q.trim(),
        }), { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setScope('received');
        setDateFrom('');
        setDateTo('');
        setReceivedFrom('');
        setReceivedTo('');
        setBranchId('');
        setSupplierId('');
        setStatus('');
        setQ('');
        router.get(route('purchase-history.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const summaryLine = useMemo(() => {
        const n = summary?.document_count ?? 0;
        const t = summary?.total_amount ?? 0;
        return `${n} document${n === 1 ? '' : 's'} · total ${Number(t).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [summary]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase history</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Received stock and purchase documents — filter by date, supplier, and branch
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('purchase-invoices.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Purchase invoices
                        </Link>
                        <Link
                            href={route('purchase-invoices.create')}
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                        >
                            New invoice
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Purchase history" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Summary (current filters):</span> {summaryLine}
                </p>
            </div>

            <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <form onSubmit={applyFilters} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        <div>
                            <label className={labelClass}>Scope</label>
                            <select
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                className={inputClass}
                            >
                                <option value="received">Received only (into stock)</option>
                                <option value="all">All invoices</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Invoice date from</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Invoice date to</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Received from</label>
                            <input
                                type="date"
                                value={receivedFrom}
                                onChange={(e) => setReceivedFrom(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Received to</label>
                            <input
                                type="date"
                                value={receivedTo}
                                onChange={(e) => setReceivedTo(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">All branches</option>
                                {(branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Supplier</label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">All suppliers</option>
                                {(suppliers ?? []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={inputClass}
                            >
                                {(statusOptions ?? []).map((o) => (
                                    <option key={o.value || 'any'} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search invoice #</label>
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className={inputClass}
                                placeholder="Contains…"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                        >
                            Apply filters
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Received</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Invoice date</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Invoice #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Supplier</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Warehouse</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Lines</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {invoices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        No purchase records match these filters.
                                    </td>
                                </tr>
                            ) : (
                                invoices.data.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatPurchaseReceivedAt(inv.received_at)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatPurchaseInvoiceDate(inv.invoice_date)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                                        <td className="px-4 py-3 text-gray-700">{inv.supplier?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{inv.branch?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{inv.warehouse?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{inv.items_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{inv.total}</td>
                                        <td className="px-4 py-3 text-end">
                                            <Link
                                                href={route('purchase-invoices.show', inv.id)}
                                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={invoices.links} />
            </div>
        </AuthenticatedLayout>
    );
}
