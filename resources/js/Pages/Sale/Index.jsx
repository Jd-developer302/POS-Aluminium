import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function asStringList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value.map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    if (typeof value === 'object') {
        return Object.values(value).map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    return [];
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

export default function Index({ sales }) {
    const { flash, auth } = usePage().props;
    const perms = asStringList(auth?.user?.permissions);
    const canDeleteSale = !perms.length || perms.includes('sales.delete');

    const deleteSale = (sale) => {
        router.delete(route('sales.destroy', sale.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage customer sales</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('sale-history.index')}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Sale history
                        </Link>
                        <Link
                            href={route('sales.create')}
                            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            New sale
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Sales" />

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
                                    Sale #
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Branch
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Warehouse
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Customer
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {sales.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No sales yet.
                                    </td>
                                </tr>
                            ) : (
                                sales.data.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {new Date(s.sale_date).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {s.sale_number}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.branch?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.warehouse?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.customer ? (
                                                <span>
                                                    <span className="font-medium text-gray-900">
                                                        {s.customer.name}
                                                    </span>
                                                    <span className="block text-xs text-gray-500">
                                                        {s.customer.code}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">Walk-in</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {s.total}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (s.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : s.status === 'cancelled'
                                                          ? 'bg-red-100 text-red-800'
                                                          : 'bg-gray-200 text-gray-700')
                                                }
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="inline-flex items-center gap-2">
                                                <Link
                                                    href={route('sales.show', s.id)}
                                                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                                >
                                                    View
                                                </Link>
                                                {canDeleteSale ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteSale(s)}
                                                        className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={sales.links} />
            </div>
        </AuthenticatedLayout>
    );
}

