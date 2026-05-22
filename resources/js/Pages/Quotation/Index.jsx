import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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

function money(n) {
    const x = Number(n ?? 0);
    return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index({ quotations }) {
    const { flash } = usePage().props;

    const destroyRow = (row) => {
        if (!confirm('Delete this quotation?')) return;
        router.delete(route('quotations.destroy', row.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Price offers for customers — no stock movement until converted to a sale.
                        </p>
                    </div>
                    <Link
                        href={route('quotations.create')}
                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        New quotation
                    </Link>
                </div>
            }
        >
            <Head title="Quotations" />

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
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Quotation #</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Warehouse</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Customer</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {quotations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        No quotations yet.
                                    </td>
                                </tr>
                            ) : (
                                quotations.data.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {q.quotation_date
                                                ? new Date(q.quotation_date).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-900">{q.quotation_no}</td>
                                        <td className="px-4 py-3 text-gray-700">{q.branch?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{q.warehouse?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {q.customer ? `${q.customer.code} — ${q.customer.name}` : '—'}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{money(q.total)}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-800">
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route('quotations.show', q.id)}
                                                    className="text-xs font-semibold text-brand hover:underline"
                                                >
                                                    View
                                                </Link>
                                                {q.status !== 'converted' && (
                                                    <Link
                                                        href={route('quotations.edit', q.id)}
                                                        className="text-xs font-semibold text-gray-700 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
                                                {q.status !== 'converted' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => destroyRow(q)}
                                                        className="text-xs font-semibold text-red-600 hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={quotations.links} />
        </AuthenticatedLayout>
    );
}
