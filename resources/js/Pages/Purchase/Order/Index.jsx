import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatPurchaseInvoiceDate } from '../Invoice/formatInvoiceDate';

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

function formatPoStatus(status) {
    const labels = {
        pending: 'Pending',
        sent: 'Sent',
        partial: 'Partial',
        received: 'Received',
        cancelled: 'Cancelled',
    };
    return labels[status] ?? status;
}

function canDeleteOrder(o) {
    return o.status === 'pending';
}

export default function Index({ orders }) {
    const { flash } = usePage().props;

    const confirmDelete = (o) => {
        if (!canDeleteOrder(o)) return;
        if (!window.confirm(`Delete purchase order ${o.order_number}? This cannot be undone.`)) {
            return;
        }
        router.delete(route('purchase-orders.destroy', o.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Order from suppliers before invoicing and receiving stock
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('purchase-invoices.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Purchase invoices
                        </Link>
                        <Link
                            href={route('purchase-orders.create')}
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            New order
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Purchase Orders" />

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
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Order #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Supplier</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No purchase orders yet.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatPurchaseInvoiceDate(o.order_date)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{o.order_number}</td>
                                        <td className="px-4 py-3 text-gray-700">{o.supplier?.name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                                {formatPoStatus(o.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{o.total}</td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <Link
                                                    href={route('purchase-orders.show', o.id)}
                                                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                                >
                                                    View
                                                </Link>
                                                {o.status !== 'received' && o.status !== 'cancelled' ? (
                                                    <Link
                                                        href={route('purchase-orders.edit', o.id)}
                                                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </Link>
                                                ) : null}
                                                {canDeleteOrder(o) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(o)}
                                                        className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
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
                <Pagination links={orders.links} />
            </div>
        </AuthenticatedLayout>
    );
}
