import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

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

export default function Show({ adjustment }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {adjustment.reference_number} · {adjustment.status}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('stock-adjustments.edit', adjustment.id)}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Edit
                        </Link>
                        <Link
                            href={route('stock-adjustments.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Stock Adjustment" />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-gray-900">Details</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">Date</dt>
                                <dd className="text-gray-900">
                                    {formatDate(adjustment.adjustment_date)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">Type</dt>
                                <dd className="text-gray-900">{adjustment.type}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">Status</dt>
                                <dd className="text-gray-900">{adjustment.status}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">Total qty</dt>
                                <dd className="text-gray-900">
                                    {formatQty(adjustment.total_quantity)}
                                </dd>
                            </div>
                            {adjustment.reason && (
                                <div>
                                    <dt className="font-semibold text-gray-700">Reason</dt>
                                    <dd className="mt-1 text-gray-900">{adjustment.reason}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-base font-semibold text-gray-900">Items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Product</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Variant</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Batch</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(adjustment.items ?? []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                                No items.
                                            </td>
                                        </tr>
                                    ) : (
                                        (adjustment.items ?? []).map((it) => (
                                            <tr key={it.id} className="hover:bg-gray-50/80">
                                                <td className="px-4 py-3 text-gray-900">
                                                    #{it.product_id}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {it.product_variant_id ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {it.product_batch_id ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-900">
                                                    {formatQty(it.quantity)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{it.notes ?? '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

