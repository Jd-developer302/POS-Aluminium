import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

function formatQty(value) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

function formatLengthPairsSummary(pairs) {
    if (!Array.isArray(pairs)) return '—';
    const parts = pairs
        .map((r) => {
            const l = Number(r?.length ?? 0);
            const q = Number(r?.qty ?? 0);
            if (l <= 0 && q <= 0) return null;
            return `${l}×${q}`;
        })
        .filter(Boolean);
    return parts.length ? parts.join(' + ') : '—';
}

export default function Show({ stock }) {
    const { flash } = usePage().props;

    const destroyRow = () => {
        if (!confirm('Delete this stock row?')) return;
        router.delete(route('stocks.destroy', stock.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock Details</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            View stock row info
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('stocks.edit', stock.id)}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={destroyRow}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
                        >
                            Delete
                        </button>
                        <Link
                            href={route('stocks.index')}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Stock Details" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-gray-900">Main</h2>
                        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Product</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {stock.product?.name ?? `#${stock.product_id}`}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Variant</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {stock.product_varient?.sku
                                        ? `${stock.product_varient.sku} — ${stock.product_varient.name}`
                                        : stock.product_varient?.name ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Branch</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {stock.warehouse?.branch?.name ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Warehouse</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {stock.warehouse?.name ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Billing</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {(stock.billing_mode ?? 'quantity') === 'length_ft'
                                        ? 'Length (ft) — Σ(length × qty)'
                                        : 'Units (quantity)'}
                                </dd>
                            </div>
                            {(stock.billing_mode ?? 'quantity') === 'length_ft' && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-semibold text-gray-700">Lengths (L×Q)</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {formatLengthPairsSummary(stock.length_pairs)}
                                    </dd>
                                    {stock.length_pairs_sum_ft != null && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Σ from saved rows: {formatQty(stock.length_pairs_sum_ft)} ft
                                        </p>
                                    )}
                                </div>
                            )}
                            {(stock.billing_mode ?? 'quantity') === 'length_ft' &&
                                Array.isArray(stock.stock_length_items) &&
                                stock.stock_length_items.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-semibold text-gray-700">
                                            Cut-length rods (live)
                                        </dt>
                                        <dd className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                            Length (ft)
                                                        </th>
                                                        <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                                            Qty (rods)
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {stock.stock_length_items.map((row) => (
                                                        <tr key={row.id}>
                                                            <td className="px-3 py-2 tabular-nums text-gray-900">
                                                                {formatQty(row.length)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                                                                {formatQty(row.qty)}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700">{row.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </dd>
                                    </div>
                                )}
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">
                                    {(stock.billing_mode ?? 'quantity') === 'length_ft'
                                        ? 'Actual ft on hand (inventory qty)'
                                        : 'Quantity'}
                                </dt>
                                <dd className="mt-1 text-sm font-semibold text-gray-900">
                                    {formatQty(stock.quantity)}
                                </dd>
                                {(stock.billing_mode ?? 'quantity') === 'length_ft' &&
                                    stock.length_pairs_qty_matches_sum === false &&
                                    stock.length_pairs_sum_ft != null && (
                                        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                            Saved length rows add up to{' '}
                                            <span className="font-semibold">
                                                {formatQty(stock.length_pairs_sum_ft)} ft
                                            </span>
                                            , which differs from on-hand quantity. Inventory uses the on-hand
                                            value after sales, transfers, and adjustments; open Edit and save to
                                            realign the breakdown if needed.
                                        </p>
                                    )}
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Reserved</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {formatQty(stock.reserved_quantity)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-gray-700">Status</dt>
                                <dd className="mt-1">
                                    <span
                                        className={
                                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                            (stock.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-100 text-gray-800')
                                        }
                                    >
                                        {stock.status}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-gray-900">Meta</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">ID</dt>
                                <dd className="text-gray-900">#{stock.id}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">Created</dt>
                                <dd className="text-gray-900">
                                    {stock.created_at
                                        ? new Date(stock.created_at).toLocaleString()
                                        : '—'}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="font-semibold text-gray-700">Updated</dt>
                                <dd className="text-gray-900">
                                    {stock.updated_at
                                        ? new Date(stock.updated_at).toLocaleString()
                                        : '—'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

