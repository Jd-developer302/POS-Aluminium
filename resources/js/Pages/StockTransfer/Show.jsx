import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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
                                            Product ID
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                            Qty
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(transfer.items ?? []).map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {it.product_id}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {formatQty(it.quantity)}
                                            </td>
                                        </tr>
                                    ))}
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

