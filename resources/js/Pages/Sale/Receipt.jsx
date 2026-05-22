import React, { useEffect, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import InvoiceLogoHeader from '@/Components/InvoiceLogoHeader';
import ReceiptLayout from '@/Layouts/ReceiptLayout';
import {
    buildSaleDetailRows,
    formatSaleMoney,
    saleDetailBillingLayout,
    saleSummaryTotals,
} from '@/lib/saleDetailTableRows';

const FALLBACK_RECEIPT_SIGNATURE_SRC = '/img/receipt-signature.svg';

export default function Receipt({ sale }) {
    useEffect(() => {
        setTimeout(() => window.print(), 200);
    }, []);

    const receiptSignatureUrl = usePage().props.branding?.receipt_signature_url;
    const signatureSrc = receiptSignatureUrl || FALLBACK_RECEIPT_SIGNATURE_SRC;

    const saleItems = sale.items ?? [];
    const billingCols = saleDetailBillingLayout(saleItems);

    const detailRows = useMemo(() => buildSaleDetailRows(saleItems), [saleItems]);
    const totals = useMemo(() => saleSummaryTotals(sale), [sale]);

    return (
        <ReceiptLayout>
            <Head title="Receipt" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-full print:px-0 print:py-1">
                <div className="mb-4 flex justify-end print:hidden">
                    <Link
                        href={route('sales.show', sale.id)}
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
                                <h2 className="text-lg font-bold text-gray-900">Sales Receipt</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    {new Date(sale.sale_date).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-end">
                                <p className="text-sm font-semibold text-gray-700">Sale #</p>
                                <p className="text-sm text-gray-900">{sale.sale_number}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                            <p>
                                <span className="font-semibold">Branch:</span>{' '}
                                {sale.branch?.name ?? '—'}
                            </p>
                            <p className="sm:text-end">
                                <span className="font-semibold">Warehouse:</span>{' '}
                                {sale.warehouse?.name ?? '—'}
                            </p>
                            <p className="sm:col-span-2">
                                <span className="font-semibold">Customer:</span>{' '}
                                {sale.customer ? (
                                    <>
                                        {sale.customer.name}{' '}
                                        <span className="text-gray-600">({sale.customer.code})</span>
                                        {sale.customer.phone ? (
                                            <span className="text-gray-600"> · {sale.customer.phone}</span>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="text-gray-600">Walk-in</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto print:overflow-visible print:border print:border-gray-300">
                            <table className="w-full min-w-0 border-collapse text-gray-900 print:w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/90 print:bg-gray-50">
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Product</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Variant</th>
                                        {billingCols === 'qty' ? (
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                Lengths (L×Q)
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                Actual ft (on hand)
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual_qty' ? (
                                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                            Unit price
                                        </th>
                                        <th className="px-3 py-2 text-end font-semibold text-gray-700">Disc. %</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailRows.map((row) => (
                                        <tr
                                            key={row.key}
                                            className="border-b border-gray-100 print:break-inside-avoid"
                                        >
                                            <td className="px-3 py-2 font-medium">{row.product}</td>
                                            <td className="px-3 py-2 text-gray-700">{row.variant}</td>
                                            {billingCols === 'qty' ? (
                                                <td className="px-3 py-2 tabular-nums text-gray-800">
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
                                                <td className="px-3 py-2 tabular-nums text-gray-800">
                                                    {row.actualFt}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual_qty' ? (
                                                <td className="px-3 py-2 tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            <td className="px-3 py-2 tabular-nums text-gray-800">{row.unitPrice}</td>
                                            <td className="px-3 py-2 text-end tabular-nums text-gray-800">
                                                {row.discountPercent}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900">
                                                {row.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 space-y-1.5 border-t border-gray-200 pt-4 text-sm">
                            <div className="ml-auto flex max-w-xs flex-col gap-1.5 sm:items-end">
                                <div className="flex w-full justify-between gap-8">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.grossSubtotal)}
                                    </span>
                                </div>
                                <div className="flex w-full justify-between gap-8">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.taxAmount)}
                                    </span>
                                </div>
                                {/* <div className="flex w-full justify-between gap-8">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(sale.shipping_cost)}
                                    </span>
                                </div> */}
                                <div className="flex w-full justify-between gap-8">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.discountAmount)}
                                    </span>
                                </div>
                                <div className="invoice-print-grand flex w-full justify-between gap-8 border-t border-gray-200 pt-2 text-lg font-bold">
                                    <span className="text-gray-900">Total</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.total)}
                                    </span>
                                </div>
                                <div className="flex w-full justify-between gap-8 pt-2">
                                    <span className="text-gray-600">Paid</span>
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {formatSaleMoney(sale.paid_amount)}
                                    </span>
                                </div>
                                <div className="flex w-full justify-between gap-8">
                                    <span className="text-gray-600">Due</span>
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {formatSaleMoney(sale.due_amount)}
                                    </span>
                                </div>
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
