import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
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

export default function Index({ transfers }) {
    const { flash } = usePage().props;
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Branch to branch product transfers
                        </p>
                    </div>
                    <Link
                        href={route('stock-transfers.create')}
                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                        New transfer
                    </Link>
                </div>
            }
        >
            <Head title="Stock Transfers" />

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
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Reference
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Total Qty
                                </th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {transfers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No transfers yet.
                                    </td>
                                </tr>
                            ) : (
                                transfers.data.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatDate(t.transfer_date)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{t.reference_number}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (t.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : t.status === 'cancelled'
                                                          ? 'bg-red-100 text-red-800'
                                                          : 'bg-gray-200 text-gray-700')
                                                }
                                            >
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {formatQty(t.total_quantity)}
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <Link
                                                href={route('stock-transfers.show', t.id)}
                                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={transfers.links} />
            </div>
        </AuthenticatedLayout>
    );
}

