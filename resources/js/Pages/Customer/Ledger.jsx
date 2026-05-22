import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CustomerFilterCombobox from '@/Components/CustomerFilterCombobox';
import InvoiceLogoHeader from '@/Components/InvoiceLogoHeader';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-600';

function buildQuery(obj) {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
}

export default function Ledger({ statement = null, filters: filtersProp, filterOptions = {} }) {
    const { flash, errors: pageErrors } = usePage().props;
    const filters = filtersProp ?? {};
    const [local, setLocal] = useState(() => ({
        customer_id:
            filters.customer_id != null && filters.customer_id !== ''
                ? String(filters.customer_id)
                : '',
        branch_id:
            filters.branch_id != null && filters.branch_id !== ''
                ? String(filters.branch_id)
                : '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    }));

    useEffect(() => {
        setLocal({
            customer_id:
                filters.customer_id != null && filters.customer_id !== ''
                    ? String(filters.customer_id)
                    : '',
            branch_id:
                filters.branch_id != null && filters.branch_id !== ''
                    ? String(filters.branch_id)
                    : '',
            date_from: filters.date_from ?? '',
            date_to: filters.date_to ?? '',
        });
    }, [filters.customer_id, filters.branch_id, filters.date_from, filters.date_to]);

    const pdfQuery = useMemo(() => {
        const customerId = statement?.customer?.id ?? local.customer_id;
        if (!customerId) return null;
        return buildQuery({
            customer_id: customerId,
            branch_id: local.branch_id || filters.branch_id,
            date_from: local.date_from || filters.date_from,
            date_to: local.date_to || filters.date_to,
        });
    }, [statement, local, filters]);

    const pdfHref = useMemo(() => {
        if (!pdfQuery?.customer_id) return null;
        const qs = new URLSearchParams(pdfQuery);
        return `${route('customer-receivables.ledger.pdf')}?${qs.toString()}`;
    }, [pdfQuery]);

    const apply = (e) => {
        e?.preventDefault?.();
        if (!local.customer_id) return;
        router.get(route('customer-receivables.ledger'), buildQuery(local), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const printStatement = () => {
        window.print();
    };

    const resetFilters = () => {
        setLocal({
            customer_id: '',
            branch_id: '',
            date_from: '',
            date_to: '',
        });
        router.get(route('customer-receivables.ledger'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasStatement = statement?.customer?.id != null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Customer account statement</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Ledger with running balance (Credit / Debit / Balance)
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {hasStatement && pdfHref ? (
                            <a
                                href={pdfHref}
                                className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                            >
                                Download PDF
                            </a>
                        ) : null}
                        <Link
                            href={route('customer-receivables.index', buildQuery({
                                branch_id: local.branch_id,
                                customer_id: local.customer_id,
                            }))}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Customer balances
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Customer ledger" />

            <div className="mx-auto max-w-7xl space-y-6">
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
                {pageErrors?.customer_id && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {pageErrors.customer_id}
                    </div>
                )}

                <div className="overflow-visible rounded-xl border border-gray-100 bg-white p-4 shadow-sm print:hidden">
                    <form onSubmit={apply} className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                            <label className={labelClass} htmlFor="ledger_customer_search">
                                Customer *
                            </label>
                            <CustomerFilterCombobox
                                id="ledger_customer_search"
                                customers={filterOptions.customers ?? []}
                                value={local.customer_id}
                                onChange={(customerId) =>
                                    setLocal((s) => ({ ...s, customer_id: customerId }))
                                }
                                allLabel="Select customer"
                                labelVariant="parens"
                                placeholder="Search customer..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All branches</option>
                                {(filterOptions.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>From</label>
                            <input
                                type="date"
                                value={local.date_from}
                                onChange={(e) => setLocal((s) => ({ ...s, date_from: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>To</label>
                            <input
                                type="date"
                                value={local.date_to}
                                onChange={(e) => setLocal((s) => ({ ...s, date_to: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                            <button
                                type="submit"
                                disabled={!local.customer_id}
                                className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                            >
                                Show statement
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                            {hasStatement && pdfHref ? (
                                <a
                                    href={pdfHref}
                                    className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                                >
                                    Download PDF
                                </a>
                            ) : null}
                            {hasStatement ? (
                                <button
                                    type="button"
                                    onClick={printStatement}
                                    className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                >
                                    Print
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>

                {hasStatement ? (
                    <div className="invoice-print-doc overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:border-none print:shadow-none">
                        <InvoiceLogoHeader />
                        <div className="border-b border-gray-200 px-6 py-4 print:px-2 print:py-2">
                            <div className="flex flex-wrap items-start justify-between gap-4 text-sm">
                                <p>
                                    <span className="font-semibold text-gray-900">To:-</span>{' '}
                                    {statement.customer.name}
                                    {statement.customer.code ? (
                                        <span className="text-gray-600"> ({statement.customer.code})</span>
                                    ) : null}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Dated:-</span> {statement.generated_at}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto px-4 print:px-1">
                            <table className="w-full min-w-[640px] border-collapse text-sm">
                                <tbody>
                                    <tr>
                                        <td colSpan={3} className="py-2 font-semibold text-gray-900">
                                            Balance Before:-
                                        </td>
                                        <td className="py-2 text-end tabular-nums text-gray-800">
                                            {statement.balance_before_formatted.credit}
                                        </td>
                                        <td className="py-2 text-end tabular-nums text-gray-800">
                                            {statement.balance_before_formatted.debit}
                                        </td>
                                        <td className="py-2 text-end font-semibold tabular-nums text-gray-900">
                                            {statement.balance_before_formatted.balance}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="overflow-x-auto px-4 pb-6 print:overflow-visible print:px-1 print:pb-2">
                            <table className="w-full min-w-[640px] border-collapse text-sm text-gray-900">
                                <thead>
                                    <tr className="border border-gray-300 bg-gray-50">
                                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                                            Date
                                        </th>
                                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                                            Voucher
                                        </th>
                                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">
                                            Particulars
                                        </th>
                                        <th className="border border-gray-300 px-2 py-2 text-end font-semibold">
                                            Credit
                                        </th>
                                        <th className="border border-gray-300 px-2 py-2 text-end font-semibold">
                                            Debit
                                        </th>
                                        <th className="border border-gray-300 px-2 py-2 text-end font-semibold">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statement.lines.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="border border-gray-200 px-3 py-6 text-center text-gray-500"
                                            >
                                                No transactions in this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        statement.lines.map((line) => (
                                            <tr key={line.sort_key} className="print:break-inside-avoid">
                                                <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">
                                                    {line.date_display}
                                                </td>
                                                <td className="border border-gray-200 px-2 py-1.5">
                                                    {line.voucher}
                                                </td>
                                                <td className="border border-gray-200 px-2 py-1.5">
                                                    {line.particulars}
                                                </td>
                                                <td className="border border-gray-200 px-2 py-1.5 text-end tabular-nums">
                                                    {line.credit_formatted}
                                                </td>
                                                <td className="border border-gray-200 px-2 py-1.5 text-end tabular-nums">
                                                    {line.debit_formatted}
                                                </td>
                                                <td className="border border-gray-200 px-2 py-1.5 text-end font-medium tabular-nums">
                                                    {line.balance_formatted}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    <tr className="bg-gray-50 font-semibold print:break-inside-avoid">
                                        <td colSpan={3} className="border border-gray-300 px-2 py-2">
                                            Closing Balance
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-end tabular-nums">
                                            {statement.closing_formatted.credit}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-end tabular-nums">
                                            {statement.closing_formatted.debit}
                                        </td>
                                        <td className="border border-gray-300 px-2 py-2 text-end tabular-nums">
                                            {statement.closing_formatted.balance}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center text-sm text-gray-600 print:hidden">
                        <p>
                            Select a <span className="font-semibold">customer</span>, then click{' '}
                            <span className="font-semibold">Show statement</span> to load the ledger.
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Optional: branch and date range narrow the transactions shown.
                        </p>
                    </div>
                )}
            </div>

            <Head>
                <style type="text/css">
                    {`
                        @media print {
                            @page { size: A4 portrait; margin: 8mm; }
                        }
                    `}
                </style>
            </Head>
        </AuthenticatedLayout>
    );
}
