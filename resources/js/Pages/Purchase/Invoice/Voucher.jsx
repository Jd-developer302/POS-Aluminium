import React, { useEffect, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import InvoiceLogoHeader from '@/Components/InvoiceLogoHeader';
import ReceiptLayout from '@/Layouts/ReceiptLayout';
import { buildPurchaseInvoiceDetailRows } from '@/lib/purchaseOrderDetailTableRows';
import {
    saleDetailBillingLayout,
    saleDetailCutsColumnHeader,
    saleDetailOnHandColumnHeader,
} from '@/lib/saleDetailTableRows';
import { formatPurchaseInvoiceDate } from './formatInvoiceDate';

const FALLBACK_RECEIPT_SIGNATURE_SRC = '/img/receipt-signature.svg';

function paymentStatusLabel(invoice) {
    const due = Number(invoice?.due_amount ?? 0);
    const paid = Number(invoice?.paid_amount ?? 0);
    if (due <= 0 && paid > 0) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
}

export default function Voucher({ invoice }) {
    useEffect(() => {
        setTimeout(() => window.print(), 200);
    }, []);

    const receiptSignatureUrl = usePage().props.branding?.receipt_signature_url;
    const signatureSrc = receiptSignatureUrl || FALLBACK_RECEIPT_SIGNATURE_SRC;

    const lines = invoice.items ?? [];
    const billingCols = saleDetailBillingLayout(lines);
    const cutsColumnHeader = saleDetailCutsColumnHeader(lines);
    const onHandColumnHeader = saleDetailOnHandColumnHeader(lines);
    const detailRows = useMemo(() => buildPurchaseInvoiceDetailRows(lines), [lines]);

    const supplier = invoice.supplier;

    return (
        <ReceiptLayout>
            <Head title="Purchase voucher" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-full print:px-0 print:py-1">
                <div className="mb-4 flex justify-end print:hidden">
                    <Link
                        href={route('purchase-invoices.show', invoice.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Back
                    </Link>
                </div>

                <div className="invoice-print-doc overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:border-none print:shadow-none">
                    <InvoiceLogoHeader />
                    <div className="border-b border-gray-100 p-6 print:p-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Purchase Invoice</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {formatPurchaseInvoiceDate(invoice.invoice_date)}
                                </p>
                            </div>
                            <div className="text-end">
                                <p className="text-sm font-semibold text-gray-700">Invoice #</p>
                                <p className="text-sm text-gray-900">{invoice.invoice_number}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                            <p>
                                <span className="font-semibold">Branch:</span>{' '}
                                {invoice.branch?.name ?? '—'}
                            </p>
                            <p className="sm:text-end">
                                <span className="font-semibold">Warehouse:</span>{' '}
                                {invoice.warehouse?.name ?? '—'}
                            </p>
                            <p className="sm:col-span-2">
                                <span className="font-semibold">Supplier:</span>{' '}
                                {supplier ? (
                                    <>
                                        {supplier.name}{' '}
                                        {supplier.code ? (
                                            <span className="text-gray-600">({supplier.code})</span>
                                        ) : null}
                                        {supplier.phone ? (
                                            <span className="text-gray-600"> · {supplier.phone}</span>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="text-gray-600">—</span>
                                )}
                            </p>
                            <p className="sm:col-span-2">
                                <span className="font-semibold">Status:</span>{' '}
                                <span className="capitalize">{invoice.status}</span>
                                {' · '}
                                <span className="font-semibold">Payment:</span>{' '}
                                <span className="capitalize">{paymentStatusLabel(invoice)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto rounded-lg border border-gray-200 print:border-gray-300">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-start font-semibold text-gray-700">Item</th>
                                        <th className="px-3 py-2 text-start font-semibold text-gray-700">Variant</th>
                                        {billingCols === 'qty' ? (
                                            <th className="px-3 py-2 text-end font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                {cutsColumnHeader}
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                                {onHandColumnHeader}
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual_qty' ? (
                                            <th className="px-3 py-2 text-end font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        <th className="px-3 py-2 text-end font-semibold text-gray-700">Unit cost</th>
                                        <th className="px-3 py-2 text-end font-semibold text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {detailRows.map((row) => (
                                        <tr key={row.key} className="align-top print:break-inside-avoid">
                                            <td className="px-3 py-2 text-gray-900">{row.product}</td>
                                            <td className="px-3 py-2 text-gray-700">{row.variant}</td>
                                            {billingCols === 'qty' ? (
                                                <td className="px-3 py-2 text-end tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual' ||
                                            billingCols === 'length_actual_qty' ? (
                                                <td className="px-3 py-2 tabular-nums text-gray-800">
                                                    {row.lengthsSummary}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual' ||
                                            billingCols === 'length_actual_qty' ? (
                                                <td className="px-3 py-2 text-end tabular-nums text-gray-800">
                                                    {row.actualFt}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual_qty' ? (
                                                <td className="px-3 py-2 text-end tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            <td className="px-3 py-2 text-end tabular-nums text-gray-800">
                                                {row.unitCost}
                                            </td>
                                            <td className="px-3 py-2 text-end font-semibold tabular-nums text-gray-900">
                                                {row.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold text-gray-900">{invoice.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-semibold text-gray-900">{invoice.tax_amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Paid</span>
                                <span className="font-semibold text-gray-900">{invoice.paid_amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Due</span>
                                <span className="font-semibold text-gray-900">{invoice.due_amount}</span>
                            </div>
                            <div className="invoice-print-grand flex justify-between text-lg">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-gray-900">{invoice.total}</span>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end print:break-inside-avoid print:mt-12">
                            <div className="w-full max-w-[280px] text-center sm:w-64">
                                <div className="flex min-h-[4.5rem] items-end justify-center px-2">
                                    <img
                                        src={signatureSrc}
                                        alt=""
                                        className="max-h-20 w-full max-w-[220px] object-contain object-bottom"
                                    />
                                </div>
                                <p className="mt-2 border-t border-gray-800 pt-2 text-xs font-medium text-gray-700">
                                    Authorized Signature
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ReceiptLayout>
    );
}
