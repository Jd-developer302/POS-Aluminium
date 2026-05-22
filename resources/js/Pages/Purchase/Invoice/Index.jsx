import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatPurchaseInvoiceDate } from './formatInvoiceDate';

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

function canModifyInvoice(inv) {
    return inv.status === 'draft' && !inv.received_at;
}

export default function Index({ invoices }) {
    const { flash } = usePage().props;

    const confirmDelete = (inv) => {
        if (!canModifyInvoice(inv)) return;
        if (!window.confirm(`Delete purchase invoice ${inv.invoice_number}? This cannot be undone.`)) {
            return;
        }
        router.delete(route('purchase-invoices.destroy', inv.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase Invoices</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Create an invoice, then receive it to increase stock
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('purchase-orders.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Purchase orders
                        </Link>
                        <Link
                            href={route('purchase-history.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Purchase history
                        </Link>
                        <Link
                            href={route('purchase-invoices.create')}
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            New invoice
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Purchase Invoices" />

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

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Date</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Invoice #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {invoices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No purchase invoices yet.
                                    </td>
                                </tr>
                            ) : (
                                invoices.data.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatPurchaseInvoiceDate(inv.invoice_date)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{inv.total}</td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <Link
                                                    href={route('purchase-invoices.show', inv.id)}
                                                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                                >
                                                    View
                                                </Link>
                                                {canModifyInvoice(inv) ? (
                                                    <>
                                                        <Link
                                                            href={route('purchase-invoices.edit', inv.id)}
                                                            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmDelete(inv)}
                                                            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
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
