import React, { useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import InvoiceLogoHeader from '@/Components/InvoiceLogoHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { expandQuotationItemsForDisplay } from '@/lib/quotationDisplayRows';

function money(n) {
    const x = Number(n ?? 0);
    return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Show({ quotation }) {
    const { flash } = usePage().props;
    const items = quotation.items ?? [];
    const displayRows = useMemo(() => expandQuotationItemsForDisplay(items), [items]);

    const destroyQ = () => {
        if (!confirm('Delete this quotation?')) return;
        router.delete(route('quotations.destroy', quotation.id));
    };

    const pdfHref = route('quotations.pdf', quotation.id);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Quotation</h1>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={pdfHref}
                            className="inline-flex rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                            Download PDF
                        </a>
                        {quotation.status !== 'converted' && (
                            <Link
                                href={route('quotations.edit', quotation.id)}
                                className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        {quotation.status !== 'converted' && (
                            <button
                                type="button"
                                onClick={destroyQ}
                                className="inline-flex rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                Delete
                            </button>
                        )}
                        <Link
                            href={route('quotations.index')}
                            className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Quotation ${quotation.quotation_no}`} />

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

                <div className="invoice-print-doc overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <InvoiceLogoHeader className="border-gray-100" />
                    <div className="border-b border-gray-100 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Quotation #</p>
                                <p className="mt-1 font-mono text-gray-900">{quotation.quotation_no}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Date</p>
                                <p className="mt-1 text-gray-900">
                                    {quotation.quotation_date
                                        ? new Date(quotation.quotation_date).toLocaleDateString()
                                        : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Valid until</p>
                                <p className="mt-1 text-gray-900">
                                    {quotation.valid_until
                                        ? new Date(quotation.valid_until).toLocaleDateString()
                                        : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Status</p>
                                <p className="mt-1 capitalize text-gray-900">{quotation.status}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Branch</p>
                                <p className="mt-1 text-gray-900">{quotation.branch?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Warehouse</p>
                                <p className="mt-1 text-gray-900">{quotation.warehouse?.name ?? '—'}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-sm font-semibold text-gray-700">Customer</p>
                                <p className="mt-1 text-gray-900">
                                    {quotation.customer ? (
                                        <>
                                            {quotation.customer.name}{' '}
                                            <span className="text-sm text-gray-500">
                                                ({quotation.customer.code})
                                            </span>
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </p>
                            </div>
                        </div>
                        {quotation.notes && (
                            <p className="mt-4 text-sm text-gray-600">
                                <span className="font-semibold text-gray-700">Notes: </span>
                                {quotation.notes}
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto p-6 pt-0">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">Product</th>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">Variant</th>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">Length × Qty</th>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">Unit price</th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">Disc. %</th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayRows.map((row) => {
                                    const isAdj = row.rowType === 'adjustment';

                                    return (
                                        <tr
                                            key={row.key}
                                            className={isAdj ? 'bg-gray-50 italic text-gray-700' : ''}
                                        >
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-gray-900">{row.productTitle}</div>
                                                {row.productSubtitle && !isAdj && (
                                                    <div className="text-xs text-gray-500">{row.productSubtitle}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{row.variantLabel || '—'}</td>
                                            <td className="px-3 py-2 text-gray-800">{row.lengthQtyLabel}</td>
                                            <td className="px-3 py-2 text-gray-800">
                                                {row.unitPriceKind === 'none' || row.unitPriceLabel == null ? (
                                                    '—'
                                                ) : row.unitPriceKind === 'rate_ft' ? (
                                                    <span>
                                                        <span className="text-xs text-gray-500">Rate/ft </span>
                                                        {money(row.unitPriceLabel)}
                                                    </span>
                                                ) : (
                                                    money(row.unitPriceLabel)
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-end tabular-nums text-gray-800">
                                                {isAdj ? '—' : row.discountPercent}
                                            </td>
                                            <td className="px-3 py-2 text-end font-semibold text-gray-900">
                                                {money(row.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-100 p-6">
                        <div className="ml-auto max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">{money(quotation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-semibold">{money(quotation.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-semibold">{money(quotation.shipping_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Discount</span>
                                <span className="font-semibold">{money(quotation.discount_amount)}</span>
                            </div>
                            <div className="invoice-print-grand flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
                                <span>Total</span>
                                <span>{money(quotation.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
