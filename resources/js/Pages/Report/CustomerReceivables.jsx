import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CustomerFilterCombobox from '@/Components/CustomerFilterCombobox';

const REPORT_TYPE = 'customer-receivables';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-600';

function money(n) {
    const x = parseFloat(String(n ?? '0'));
    return Number.isFinite(x)
        ? x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';
}

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

function asStringList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value.map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    if (typeof value === 'object') {
        return Object.values(value).map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    return [];
}

function buildQuery(obj) {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
}

function buildExportUrl(format, filters, selectedIds) {
    const qs = new URLSearchParams();
    Object.entries(buildQuery({ ...filters, format })).forEach(([k, v]) => qs.set(k, String(v)));
    selectedIds.forEach((id) => qs.append('ids[]', String(id)));
    return `${route('reports.export', { type: REPORT_TYPE })}?${qs.toString()}`;
}

export default function CustomerReceivables({
    title,
    grandTotals,
    customers,
    filters: filtersProp,
    filterOptions = {},
}) {
    const { flash, auth } = usePage().props;
    const perms = asStringList(auth?.user?.permissions);
    const canDeleteSale = !perms.length || perms.includes('sales.delete');
    const filters = filtersProp ?? {};
    const [local, setLocal] = useState(() => ({ ...filters }));
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    useEffect(() => {
        setSelectedIds(new Set());
    }, [customers?.current_page]);

    const apply = (e) => {
        e?.preventDefault?.();
        router.get(route('reports.show', { type: REPORT_TYPE }), buildQuery(local), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const rows = customers?.data ?? [];

    const pageSaleIds = useMemo(
        () => rows.flatMap((c) => (c.sales ?? []).map((s) => s.id)),
        [rows],
    );
    const allPageSelected =
        pageSaleIds.length > 0 && pageSaleIds.every((id) => selectedIds.has(id));

    const toggleAllPage = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageSaleIds.forEach((id) => next.delete(id));
            } else {
                pageSaleIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const toggleSale = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const openExport = (format) => {
        window.location.href = buildExportUrl(format, local, Array.from(selectedIds));
    };

    const opts = filterOptions;

    const deleteSale = (sale) => {
        if (
            !window.confirm(
                `Delete invoice ${sale.sale_number}? If it was completed, stock will be restored to the warehouse.`,
            )
        ) {
            return;
        }
        router.delete(route('sales.destroy', sale.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Completed invoices with assigned customers — balance and every payment row with date.
                            Grand totals reflect all invoices matching filters, not only this page.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => openExport('csv')}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                        >
                            Download CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => openExport('pdf')}
                            className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                        >
                            Download PDF
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={title} />

            <div className="mx-auto max-w-[1600px] space-y-6">
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Invoices</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{grandTotals?.invoice_count ?? 0}</p>
                        <p className="mt-1 text-xs text-gray-500">All matching filters</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total invoiced
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{money(grandTotals?.total_invoiced)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total received
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-700">{money(grandTotals?.total_paid)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Outstanding (due)
                        </p>
                        <p className="mt-1 text-2xl font-bold text-amber-700">{money(grandTotals?.total_due)}</p>
                    </div>
                </div>

                <div className="overflow-visible rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <form onSubmit={apply} className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className={labelClass}>From (invoice)</label>
                            <input
                                type="date"
                                value={local.date_from ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, date_from: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>To (invoice)</label>
                            <input
                                type="date"
                                value={local.date_to ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, date_to: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="receivables_report_customer_search">
                                Customer
                            </label>
                            <CustomerFilterCombobox
                                id="receivables_report_customer_search"
                                customers={opts.customers ?? []}
                                value={local.customer_id ?? ''}
                                onChange={(customerId) =>
                                    setLocal((s) => ({ ...s, customer_id: customerId }))
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Customer search</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                                placeholder="Name / code / phone"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Invoice #</label>
                            <input
                                value={local.q_sale ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q_sale: e.target.value }))}
                                className={inputClass}
                                placeholder="Sale / invoice contains…"
                            />
                        </div>
                        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                            <button
                                type="submit"
                                className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLocal({});
                                    router.get(
                                        route('reports.show', { type: REPORT_TYPE }),
                                        {},
                                        { preserveState: true, preserveScroll: true },
                                    );
                                }}
                                className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                            <Link
                                href={route('reports.index')}
                                className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                All reports
                            </Link>
                        </div>
                    </form>
                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <p className="max-w-xl text-xs text-gray-500">
                            Exports use the same filters as above. Tick invoice rows to export only those
                            (up to 500). If none are ticked, all matching invoices export (up to 5,000
                            rows in the file).
                        </p>
                    </div>
                </div>

                {rows.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                checked={allPageSelected}
                                disabled={pageSaleIds.length === 0}
                                onChange={toggleAllPage}
                            />
                            <span className="font-medium">Select all invoices on this page</span>
                        </label>
                        {selectedIds.size > 0 ? (
                            <span className="text-sm text-gray-500">
                                {selectedIds.size} invoice{selectedIds.size === 1 ? '' : 's'} selected
                            </span>
                        ) : null}
                    </div>
                ) : null}

                {rows.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-sm">
                        No customers matched these filters.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {rows.map((c) => (
                            <section key={c.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                                <header className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">{c.name}</h2>
                                            <p className="text-xs text-gray-600">
                                                {c.code ? `Code: ${c.code}` : ''}
                                                {c.code && c.phone ? ' · ' : ''}
                                                {c.phone ?? ''}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Invoices:</span>{' '}
                                                <span className="font-semibold text-gray-900">{c.invoice_count}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Invoiced:</span>{' '}
                                                <span className="font-semibold">{money(c.total_invoiced)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Paid:</span>{' '}
                                                <span className="font-semibold text-emerald-700">{money(c.total_paid)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Due:</span>{' '}
                                                <span className="font-semibold text-amber-700">{money(c.total_due)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </header>

                                <div className="overflow-x-auto px-4 py-4">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="w-10 px-2 py-2 text-start">
                                                    <span className="sr-only">Select</span>
                                                </th>
                                                <th className="px-3 py-2 text-start text-xs font-semibold text-gray-700">
                                                    Invoice #
                                                </th>
                                                <th className="px-3 py-2 text-start text-xs font-semibold text-gray-700">
                                                    Date
                                                </th>
                                                <th className="px-3 py-2 text-start text-xs font-semibold text-gray-700">
                                                    Branch
                                                </th>
                                                <th className="px-3 py-2 text-end text-xs font-semibold text-gray-700">
                                                    Total
                                                </th>
                                                <th className="px-3 py-2 text-end text-xs font-semibold text-gray-700">
                                                    Paid
                                                </th>
                                                <th className="px-3 py-2 text-end text-xs font-semibold text-gray-700">
                                                    Due
                                                </th>
                                                <th className="px-3 py-2 text-end text-xs font-semibold text-gray-700">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(c.sales ?? []).flatMap((s) => {
                                                const pays = (s.payments ?? []).slice();
                                                return [
                                                    <tr key={s.id + '-hdr'} className="bg-white">
                                                        <td className="px-2 py-2 align-top">
                                                            <input
                                                                type="checkbox"
                                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                                                checked={selectedIds.has(s.id)}
                                                                onChange={() => toggleSale(s.id)}
                                                                aria-label={`Select invoice ${s.sale_number}`}
                                                            />
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                                                            {s.sale_number}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                                                            {s.sale_date}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700">{s.branch}</td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums text-gray-800">
                                                            {money(s.total)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums text-emerald-700">
                                                            {money(s.paid_amount)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-end tabular-nums text-amber-700">
                                                            {money(s.due_amount)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-end">
                                                            <div className="inline-flex items-center gap-2">
                                                                <Link
                                                                    href={route('sales.show', s.id)}
                                                                    className="text-sm font-semibold text-brand hover:underline"
                                                                >
                                                                    Open
                                                                </Link>
                                                                {canDeleteSale ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteSale(s)}
                                                                        className="text-sm font-semibold text-red-600 hover:underline"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>,
                                                    <tr key={s.id + '-pay'} className="bg-gray-50">
                                                        <td colSpan={8} className="px-3 pb-3 pt-0">
                                                            <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                Payments ({pays.length})
                                                            </p>
                                                            {pays.length === 0 ? (
                                                                <p className="text-xs text-gray-500">No payments posted yet.</p>
                                                            ) : (
                                                                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                                                    <table className="min-w-full text-xs">
                                                                        <thead>
                                                                            <tr className="bg-gray-50 text-start text-gray-600">
                                                                                <th className="px-2 py-1.5">Date paid</th>
                                                                                <th className="px-2 py-1.5">Amount</th>
                                                                                <th className="px-2 py-1.5">Method</th>
                                                                                <th className="px-2 py-1.5">Ref #</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {pays.map((p, idx) => (
                                                                                <tr
                                                                                    key={`${p.payment_number}-${idx}`}
                                                                                    className="border-t border-gray-100"
                                                                                >
                                                                                    <td className="whitespace-nowrap px-2 py-1.5">
                                                                                        {p.payment_date}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap px-2 py-1.5 tabular-nums font-medium">
                                                                                        {money(p.amount)}
                                                                                    </td>
                                                                                    <td className="px-2 py-1.5 capitalize">
                                                                                        {(p.payment_method ?? '').replace(
                                                                                            '_',
                                                                                            ' ',
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 py-1.5 text-gray-700">
                                                                                        {p.reference_number ?? '—'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>,
                                                ];
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <div className="flex justify-end">
                    <Pagination links={customers?.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
