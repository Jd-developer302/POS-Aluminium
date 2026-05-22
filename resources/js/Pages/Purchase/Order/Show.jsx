import React, { useMemo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { buildPurchaseOrderDetailRows } from '@/lib/purchaseOrderDetailTableRows';
import { saleDetailBillingLayout } from '@/lib/saleDetailTableRows';
import { formatPurchaseInvoiceDate } from '../Invoice/formatInvoiceDate';

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

function formatNotificationChannel(status, detail) {
    const s = (status ?? '').toLowerCase();
    const base = s === 'sent' ? 'Sent' : s === 'failed' ? 'Failed' : s === 'skipped' ? 'Skipped' : status;
    if (!detail) return base;
    return `${base}: ${detail}`;
}

export default function Show({ order }) {
    const { flash } = usePage().props;
    const orderedForm = useForm({});
    const cancelledForm = useForm({});

    const isCancelled = order.status === 'cancelled';
    const isReceived = order.status === 'received';
    const canEdit = !isCancelled && !isReceived;
    const canMarkOrdered = order.status === 'pending';
    const canCancel = !isCancelled && !isReceived;

    const markOrdered = () => {
        orderedForm.post(route('purchase-orders.mark-ordered', order.id));
    };

    const markCancelled = () => {
        cancelledForm.post(route('purchase-orders.mark-cancelled', order.id));
    };

    const lines = order.items ?? [];
    const invoices = order.invoices ?? [];
    const notificationLogs = order.notification_logs ?? [];
    const billingCols = saleDetailBillingLayout(lines);
    const detailRows = useMemo(() => buildPurchaseOrderDetailRows(lines), [lines]);
    const pdfHref = route('purchase-orders.pdf', order.id);

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-gray-900">Purchase Order</h1>}>
            <Head title="Purchase Order" />

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

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Order #</p>
                                <p className="mt-1 text-gray-900">{order.order_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Date</p>
                                <p className="mt-1 text-gray-900">{formatPurchaseInvoiceDate(order.order_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Expected</p>
                                <p className="mt-1 text-gray-900">
                                    {formatPurchaseInvoiceDate(order.expected_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Status</p>
                                <p className="mt-1">
                                    <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                        {formatPoStatus(order.status)}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Supplier</p>
                                <p className="mt-1 text-gray-900">{order.supplier?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Branch</p>
                                <p className="mt-1 text-gray-900">{order.branch?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Warehouse</p>
                                <p className="mt-1 text-gray-900">{order.warehouse?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Total</p>
                                <p className="mt-1 font-semibold text-gray-900">{order.total}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Paid on order</p>
                                <p className="mt-1 text-gray-900">{order.paid_amount}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Received value</p>
                                <p className="mt-1 text-gray-900">{order.received_amount}</p>
                            </div>
                        </div>
                        {order.notes ? (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <p className="text-sm font-semibold text-gray-700">Notes</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{order.notes}</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Product</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Variant</th>
                                        {billingCols === 'qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                Lengths (L×Q)
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                Actual ft (on hand)
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Received</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Unit cost</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Line total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {detailRows.map((row) => (
                                        <tr key={row.key}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.product}</td>
                                            <td className="px-4 py-3 text-gray-700">{row.variant}</td>
                                            {billingCols === 'qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual' ||
                                            billingCols === 'length_actual_qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.lengthsSummary}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual' ||
                                            billingCols === 'length_actual_qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.actualFt}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual_qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{row.received}</td>
                                            <td className="px-4 py-3 tabular-nums text-gray-800">{row.unitCost}</td>
                                            <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900">
                                                {row.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invoices.length > 0 ? (
                            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                                <p className="text-sm font-semibold text-gray-800">Linked purchase invoices</p>
                                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                                    {invoices.map((inv) => (
                                        <li key={inv.id}>
                                            <Link
                                                href={route('purchase-invoices.show', inv.id)}
                                                className="font-medium text-brand hover:text-brand-dark hover:underline"
                                            >
                                                {inv.invoice_number}
                                            </Link>
                                            <span className="text-gray-500"> — {inv.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {notificationLogs.length > 0 ? (
                            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                                <p className="text-sm font-semibold text-gray-800">Supplier notifications (log)</p>
                                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                    When
                                                </th>
                                                <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                    Email
                                                </th>
                                                <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                    WhatsApp
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {notificationLogs.map((log) => (
                                                <tr key={log.id}>
                                                    <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                                                        {log.created_at
                                                            ? new Date(log.created_at).toLocaleString()
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-700">
                                                        {formatNotificationChannel(
                                                            log.email_status,
                                                            log.email_detail,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-700">
                                                        {formatNotificationChannel(
                                                            log.whatsapp_status,
                                                            log.whatsapp_detail,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <a
                                href={pdfHref}
                                className="inline-flex items-center gap-2 rounded-lg border border-sky-950 bg-sky-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-950"
                            >
                                Download PDF
                            </a>
                            <Link
                                href={route('purchase-orders.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Back
                            </Link>
                            {canEdit ? (
                                <Link
                                    href={route('purchase-orders.edit', order.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                >
                                    Edit
                                </Link>
                            ) : null}
                            {canMarkOrdered ? (
                                <button
                                    type="button"
                                    onClick={markOrdered}
                                    disabled={orderedForm.processing}
                                    className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                >
                                    Mark sent to supplier
                                </button>
                            ) : null}
                            {canCancel ? (
                                <button
                                    type="button"
                                    onClick={markCancelled}
                                    disabled={cancelledForm.processing}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                                >
                                    Cancel order
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
