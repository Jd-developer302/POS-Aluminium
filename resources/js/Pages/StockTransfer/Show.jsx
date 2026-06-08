import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    formatAreaPairsSummary,
    formatLengthPairsSummary,
    transferDetailCutsColumnHeader,
    transferDetailQtyColumnHeader,
} from '@/lib/saleDetailTableRows';

function formatDate(value) {
    if (!value) return '—';
    const s = String(value);
    if (s.includes('T')) return s.slice(0, 10);
    return s.length >= 10 ? s.slice(0, 10) : s;
}

function formatQty(value) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

export default function Show({ transfer }) {
    const items = transfer.items ?? [];
    const cutsColumnHeader = useMemo(() => transferDetailCutsColumnHeader(items), [items]);
    const qtyColumnHeader = useMemo(() => transferDetailQtyColumnHeader(items), [items]);

    return (
        <AuthenticatedLayout
            header={<h1 className="text-2xl font-bold text-gray-900">Transfer Details</h1>}
        >
            <Head title="Transfer Details" />

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Reference</p>
                                <p className="mt-1 text-gray-900">{transfer.reference_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Date</p>
                                <p className="mt-1 text-gray-900">
                                    {formatDate(transfer.transfer_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Status</p>
                                <p className="mt-1 text-gray-900">{transfer.status}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Total Qty</p>
                                <p className="mt-1 text-gray-900">
                                    {formatQty(transfer.total_quantity)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            Variant
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            {cutsColumnHeader}
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            {qtyColumnHeader}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(transfer.items ?? []).map((it) => {
                                        const mode = it.billing_mode ?? 'quantity';
                                        const isLength = mode === 'length_ft';
                                        const isArea = mode === 'area_sqft';
                                        const cutsLabel = isLength
                                            ? formatLengthPairsSummary(it.length_pairs)
                                            : isArea
                                              ? formatAreaPairsSummary(it.length_pairs)
                                              : '—';
                                        const qtyLabel = isLength
                                            ? `${formatQty(it.quantity)} ft`
                                            : isArea
                                              ? `${formatQty(it.quantity)} sq ft`
                                              : formatQty(it.quantity);
                                        const pv = it.product_varient ?? it.productVarient;
                                        const variantLabel = pv
                                            ? [pv.sku, pv.name].filter(Boolean).join(' — ')
                                            : '—';

                                        return (
                                            <tr key={it.id}>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {it.product?.name ?? `#${it.product_id}`}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {variantLabel}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{cutsLabel}</td>
                                                <td className="px-4 py-3 text-gray-700">{qtyLabel}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Link
                                href={route('stock-transfers.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Back
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
