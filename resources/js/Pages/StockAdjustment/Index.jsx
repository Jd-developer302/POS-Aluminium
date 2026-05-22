import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';

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

export default function Index({ adjustments }) {
    const { flash } = usePage().props;

    const destroyRow = (row) => {
        if (!confirm('Delete this adjustment?')) return;
        router.delete(route('stock-adjustments.destroy', row.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
                        <p className="mt-1 text-sm text-gray-500">Increase/Decrease stock with audit log</p>
                    </div>
                   <div>
                   <Link
                            href={route('products.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Products List
                        </Link>
                    <Link
                        href={route('stock-adjustments.create')}
                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        New adjustment
                    </Link>
                   </div>
                </div>
            }
        >
            <Head title="Stock Adjustments" />

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
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Reference</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Type</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Total qty</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {(adjustments?.data ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                        No adjustments yet.
                                    </td>
                                </tr>
                            ) : (
                                adjustments.data.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatDate(a.adjustment_date)}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{a.reference_number}</td>
                                        <td className="px-4 py-3 text-gray-700">{a.type}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatQty(a.total_quantity)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('stock-adjustments.show', a.id)}
                                                    className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    href={route('stock-adjustments.edit', a.id)}
                                                    className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyRow(a)}
                                                    className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <Pagination links={adjustments?.links ?? []} />
            </div>
        </AuthenticatedLayout>
    );
}

