import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatSaleDateTime } from '../formatSaleDate';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';
const comboboxWrapClass = 'relative mt-2 rounded-md border border-gray-300 bg-white';
const comboboxInputClass =
    'block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500';

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
    sales,
    filters: filtersProp,
    summary,
    branches,
    warehouses,
    customers,
    statusOptions,
    paymentStatusOptions,
}) {
    const { flash } = usePage().props;
    const filters = filtersProp ?? {};

    const [scope, setScope] = useState(filters.scope ?? 'completed');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id ?? '');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? '');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerFieldFocused, setCustomerFieldFocused] = useState(false);
    const [status, setStatus] = useState(filters.status ?? '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status ?? '');
    const [q, setQ] = useState(filters.q ?? '');

    const whByBranch = useMemo(() => {
        const m = new Map();
        (warehouses ?? []).forEach((w) => {
            const bid = String(w.branch_id ?? '');
            if (!m.has(bid)) m.set(bid, []);
            m.get(bid).push(w);
        });
        return m;
    }, [warehouses]);

    const availableWarehouses = whByBranch.get(String(branchId ?? '')) ?? warehouses ?? [];

    const selectedCustomerId = String(customerId ?? '');
    const selectedCustomerRow = useMemo(
        () => (customers ?? []).find((c) => String(c.id) === selectedCustomerId) ?? null,
        [customers, selectedCustomerId],
    );

    const filteredCustomers = useMemo(() => {
        const q = String(customerSearchQuery ?? '').trim().toLowerCase();
        const list = customers ?? [];
        if (!q) return list;
        return list.filter((c) => String(c?.name ?? '').toLowerCase().includes(q));
    }, [customers, customerSearchQuery]);

    const clearCustomerFilter = () => {
        setCustomerId('');
        setCustomerSearchQuery('');
        setCustomerFieldFocused(false);
    };

    const onCustomerInputChange = (next) => {
        setCustomerSearchQuery(next);
        const typed = String(next ?? '').trim();
        if (typed === '') {
            setCustomerId('');
            return;
        }
        if (selectedCustomerRow && typed !== String(selectedCustomerRow.name ?? '').trim()) {
            setCustomerId('');
        }
    };

    const applyFilters = (e) => {
        e?.preventDefault?.();
        router.get(route('sale-history.index'), buildQuery({
            scope,
            date_from: dateFrom,
            date_to: dateTo,
            branch_id: branchId,
            warehouse_id: warehouseId,
            customer_id: customerId,
            status,
            payment_status: paymentStatus,
            q: q.trim(),
        }), { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setScope('completed');
        setDateFrom('');
        setDateTo('');
        setBranchId('');
        setWarehouseId('');
        setCustomerId('');
        setStatus('');
        setPaymentStatus('');
        setQ('');
        router.get(route('sale-history.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const summaryLine = useMemo(() => {
        const n = summary?.document_count ?? 0;
        const t = summary?.total_amount ?? 0;
        return `${n} sale${n === 1 ? '' : 's'} · total ${Number(t).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [summary]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sale history</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Completed sales and full ledger — filter by date, branch, warehouse, and customer
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('sales.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Sales list
                        </Link>
                        <Link
                            href={route('sales.create')}
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                        >
                            New sale
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Sale history" />

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

            <div className="mb-6 overflow-visible rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <form onSubmit={applyFilters} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        <div>
                            <label className={labelClass}>Scope</label>
                            <select
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                className={inputClass}
                            >
                                <option value="completed">Completed sales</option>
                                <option value="all">All statuses</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Sale date from</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Sale date to</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={branchId}
                                onChange={(e) => {
                                    setBranchId(e.target.value);
                                    setWarehouseId('');
                                }}
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
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">All warehouses</option>
                                {availableWarehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="sale_history_customer_search">
                                Customer
                            </label>

                            <div className={comboboxWrapClass}>
                                <div className="flex items-stretch">
                                    <input
                                        id="sale_history_customer_search"
                                        type="text"
                                        autoComplete="off"
                                        className={comboboxInputClass}
                                        placeholder="Search customer..."
                                        value={
                                            String(customerSearchQuery ?? '').trim() !== ''
                                                ? customerSearchQuery
                                                : selectedCustomerRow?.name ?? ''
                                        }
                                        onChange={(e) => onCustomerInputChange(e.target.value)}
                                        onFocus={() => setCustomerFieldFocused(true)}
                                    />

                                    {(selectedCustomerId || String(customerSearchQuery ?? '').trim() !== '') && (
                                        <button
                                            type="button"
                                            title="Clear"
                                            onClick={clearCustomerFilter}
                                            className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                                            aria-label="Clear customer"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                {String(customerSearchQuery ?? '').trim() !== '' && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                        {filteredCustomers.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-gray-400">
                                                No customer found
                                            </div>
                                        ) : (
                                            filteredCustomers.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setCustomerId(String(c.id));
                                                        setCustomerSearchQuery('');
                                                        setCustomerFieldFocused(false);
                                                    }}
                                                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <span className="font-medium">{c.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
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
                        <div>
                            <label className={labelClass}>Payment</label>
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className={inputClass}
                            >
                                {(paymentStatusOptions ?? []).map((o) => (
                                    <option key={o.value || 'any'} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search sale #</label>
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
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Date / time</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Sale #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Customer</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Warehouse</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Lines</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Payment</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {sales.data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                                        No sales match these filters.
                                    </td>
                                </tr>
                            ) : (
                                sales.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatSaleDateTime(row.sale_date)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{row.sale_number}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.customer?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.branch?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.warehouse?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.items_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                                {row.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{row.total}</td>
                                        <td className="px-4 py-3 text-end">
                                            <Link
                                                href={route('sales.show', row.id)}
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
                <Pagination links={sales.links} />
            </div>
        </AuthenticatedLayout>
    );
}
