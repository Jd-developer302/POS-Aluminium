import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }
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

const statusClass = (s) => {
    if (s === 'completed') {
        return 'bg-emerald-100 text-emerald-800';
    }
    if (s === 'cancelled') {
        return 'bg-gray-100 text-gray-700';
    }
    return 'bg-amber-100 text-amber-900';
};

export default function Index({ returnPages }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sale returns</h1>
                        <p className="mt-1 text-sm text-gray-500">Partial returns linked to a sale; complete to restock</p>
                    </div>
                    <Link
                        href={route('sale-returns.create')}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        New return
                    </Link>
                </div>
            }
        >
            <Head title="Sale returns" />

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
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Return #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Date</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Sale #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Warehouse</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700"> </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {returnPages.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        No returns yet.
                                    </td>
                                </tr>
                            ) : (
                                returnPages.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium text-gray-900">{r.return_number}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {r.return_date ? String(r.return_date).slice(0, 10) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800">{r.sale?.sale_number ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{r.warehouse?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-end text-gray-900">{r.total}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ' +
                                                    statusClass(r.status)
                                                }
                                            >
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <Link
                                                href={route('sale-returns.show', r.id)}
                                                className="text-sm font-semibold text-brand hover:underline"
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
            <Pagination links={returnPages.links} />
        </AuthenticatedLayout>
    );
}
