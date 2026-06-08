import React, { useMemo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { buildPurchaseInvoiceDetailRows } from '@/lib/purchaseOrderDetailTableRows';
import {
    saleDetailBillingLayout,
    saleDetailCutsColumnHeader,
    saleDetailOnHandColumnHeader,
} from '@/lib/saleDetailTableRows';
import { formatPurchaseInvoiceDate } from './formatInvoiceDate';

function paymentStatusLabel(inv) {
    const due = Number(inv?.due_amount ?? 0);
    const paid = Number(inv?.paid_amount ?? 0);
    if (due <= 0 && paid > 0) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
}

export default function Show({ invoice }) {
    const { flash } = usePage().props;
    const { post, processing } = useForm({ confirm: true });
    const paymentForm = useForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount:
            invoice?.due_amount != null && Number(invoice.due_amount) > 0
                ? String(invoice.due_amount)
                : '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
    });

    const receive = () => {
        post(route('purchase-invoices.receive', invoice.id));
    };

    const addPayment = (e) => {
        e.preventDefault();
        paymentForm.post(route('purchase-invoices.payments.store', invoice.id));
    };

    const isReceived = Boolean(invoice.received_at);
    const isCancelled = invoice.status === 'cancelled';
    const canReceive = !isReceived && !isCancelled;
    const canEdit = invoice.status === 'draft' && !isReceived;

    const lines = invoice.items ?? [];
    const billingCols = saleDetailBillingLayout(lines);
    const cutsColumnHeader = saleDetailCutsColumnHeader(lines);
    const onHandColumnHeader = saleDetailOnHandColumnHeader(lines);
    const detailRows = useMemo(() => buildPurchaseInvoiceDetailRows(lines), [lines]);

    return (
        <AuthenticatedLayout
            header={<h1 className="text-2xl font-bold text-gray-900">Purchase Invoice</h1>}
        >
            <Head title="Purchase Invoice" />

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
                                <p className="text-sm font-semibold text-gray-700">Invoice #</p>
                                <p className="mt-1 text-gray-900">{invoice.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Date</p>
                                <p className="mt-1 text-gray-900">
                                    {formatPurchaseInvoiceDate(invoice.invoice_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Status</p>
                                <p className="mt-1 text-gray-900">{invoice.status}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Total</p>
                                <p className="mt-1 text-gray-900">{invoice.total}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Branch</p>
                                <p className="mt-1 text-gray-900">{invoice.branch?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Warehouse</p>
                                <p className="mt-1 text-gray-900">{invoice.warehouse?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Supplier</p>
                                <p className="mt-1 text-gray-900">
                                    {invoice.supplier ? (
                                        <>
                                            <span className="font-medium">{invoice.supplier.name}</span>
                                            {(invoice.supplier.code || invoice.supplier.phone) && (
                                                <span className="block text-xs font-normal text-gray-600">
                                                    {[invoice.supplier.code, invoice.supplier.phone]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Due date</p>
                                <p className="mt-1 text-gray-900">
                                    {invoice.due_date
                                        ? formatPurchaseInvoiceDate(invoice.due_date)
                                        : '—'}
                                </p>
                            </div>
                        </div>
                        {invoice.notes ? (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <p className="text-sm font-semibold text-gray-700">Notes</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                                    {invoice.notes}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Variant</th>
                                        {billingCols === 'qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                {cutsColumnHeader}
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                {onHandColumnHeader}
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            Unit cost
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            Line total
                                        </th>
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
                                            <td className="px-4 py-3 tabular-nums text-gray-800">{row.unitCost}</td>
                                            <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900">
                                                {row.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="text-sm text-gray-600">
                                <div>
                                    Payment:{' '}
                                    <span className="font-semibold capitalize text-gray-900">
                                        {paymentStatusLabel(invoice)}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1 text-end text-sm">
                                <div className="flex justify-end gap-6">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">{invoice.subtotal}</span>
                                </div>
                                <div className="flex justify-end gap-6">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-semibold text-gray-900">{invoice.tax_amount}</span>
                                </div>
                                <div className="flex justify-end gap-6 text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>{invoice.total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <h2 className="text-base font-semibold text-gray-900">Payments</h2>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Paid</span>
                                        <span className="font-semibold text-gray-900">{invoice.paid_amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Due</span>
                                        <span className="font-semibold text-gray-900">{invoice.due_amount}</span>
                                    </div>
                                </div>

                                <form onSubmit={addPayment} className="mt-4 space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={paymentForm.data.payment_date}
                                                onChange={(e) =>
                                                    paymentForm.setData('payment_date', e.target.value)
                                                }
                                                disabled={isCancelled}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100"
                                            />
                                            {paymentForm.errors.payment_date ? (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {paymentForm.errors.payment_date}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={paymentForm.data.amount}
                                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                                disabled={isCancelled}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100"
                                            />
                                            {paymentForm.errors.amount ? (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {paymentForm.errors.amount}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Method
                                            </label>
                                            <select
                                                value={paymentForm.data.payment_method}
                                                onChange={(e) =>
                                                    paymentForm.setData('payment_method', e.target.value)
                                                }
                                                disabled={isCancelled}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="bank_transfer">Bank transfer</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {paymentForm.errors.payment_method ? (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {paymentForm.errors.payment_method}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Reference (optional)
                                            </label>
                                            <input
                                                value={paymentForm.data.reference_number}
                                                onChange={(e) =>
                                                    paymentForm.setData('reference_number', e.target.value)
                                                }
                                                disabled={isCancelled}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Notes (optional)
                                        </label>
                                        <textarea
                                            value={paymentForm.data.notes}
                                            onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                            disabled={isCancelled}
                                            rows={2}
                                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={paymentForm.processing || isCancelled}
                                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                    >
                                        Add payment
                                    </button>
                                    {isCancelled ? (
                                        <p className="text-xs text-gray-600">
                                            Cancelled invoices cannot accept payments.
                                        </p>
                                    ) : null}
                                </form>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <h2 className="text-base font-semibold text-gray-900">Actions</h2>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link
                                        href={route('purchase-invoices.voucher', invoice.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                                    >
                                        Print voucher
                                    </Link>
                                </div>
                                <p className="mt-3 text-xs text-gray-600">
                                    Opens a printable page (like sale receipt). Use your browser print dialog to
                                    save as PDF.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <Link
                                href={route('purchase-invoices.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Back
                            </Link>
                            {canEdit ? (
                                <Link
                                    href={route('purchase-invoices.edit', invoice.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                >
                                    Edit
                                </Link>
                            ) : null}
                            {canReceive ? (
                                <button
                                    type="button"
                                    onClick={receive}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                >
                                    Receive & Update Stock
                                </button>
                            ) : (
                                <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600">
                                    {isCancelled
                                        ? 'Cancelled — cannot receive'
                                        : 'Already received — stock updated'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
