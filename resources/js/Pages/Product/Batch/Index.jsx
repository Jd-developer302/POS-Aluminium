import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';

const iconStroke = 1.75;

function formatDate(value) {
    if (!value) return '—';
    const s = String(value);
    // Handles ISO strings like 2026-04-23T00:00:00.000000Z
    if (s.includes('T')) return s.slice(0, 10);
    return s;
}

function IconPlus({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>
    );
}

function IconPencil({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.697.395l-4.62.951 1.027-4.622a4.5 4.5 0 0 1 .395-1.697L16.862 4.487Zm0 0L19.5 7.125"
            />
        </svg>
    );
}

function IconTrash({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

export default function Index({ product, variants, batches }) {
    const { flash } = usePage().props;
    const hasVariants = (variants?.length ?? 0) > 0 && product?.type === 'variable';

    const destroyRow = (row) => {
        if (!confirm('Delete this batch?')) return;
        router.delete(route('products.batches.destroy', [product.slug, row.id]), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Product Batches
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {product?.name}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('products.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Products List
                        </Link>
                        <Link
                            href={route('products.batches.create', product.slug)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            <IconPlus className="h-5 w-5" />
                            New
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Product Batches" />

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
                                    Batch
                                </th>
                                {hasVariants && (
                                    <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                        Variant
                                    </th>
                                )}
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Mfg
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Exp
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Cost
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Sell
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Active
                                </th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {(batches?.data ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={hasVariants ? 8 : 7}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        No batches yet.
                                    </td>
                                </tr>
                            ) : (
                                (batches.data ?? []).map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {b.batch_number}
                                        </td>
                                        {hasVariants && (
                                            <td className="px-4 py-3 text-gray-700">
                                                {b.product_varient?.sku
                                                    ? `${b.product_varient.sku} — ${b.product_varient.name}`
                                                    : b.product_varient?.name ?? '—'}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatDate(b.manufacture_date)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatDate(b.expiry_date)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {b.cost_price ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {b.selling_price ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (b.is_active
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-gray-100 text-gray-800')
                                                }
                                            >
                                                {b.is_active ? 'active' : 'inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('products.batches.edit', [
                                                        product.slug,
                                                        b.id,
                                                    ])}
                                                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    <IconPencil className="h-4 w-4" />
                                                    
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyRow(b)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                    
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
                <Pagination links={batches?.links ?? []} />
            </div>
        </AuthenticatedLayout>
    );
}

