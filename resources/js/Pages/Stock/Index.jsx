import React, { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { formatVariantAttributes } from '@/lib/variantLabel';
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

const iconStroke = 1.75;

function IconEye({ className }) {
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
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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

const inputClass =
    'mt-2 block h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';
const comboboxWrapClass = 'relative mt-2 rounded-lg border border-gray-300 bg-white';
const comboboxInputClass =
    'block h-10 w-full rounded-lg border-0 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20';

function buildQuery(filters) {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
}

function buildExportUrl(format, filters, selectedIds) {
    const routeName = format === 'pdf' ? 'stocks.export.pdf' : 'stocks.export.csv';
    const qs = new URLSearchParams();
    Object.entries(buildQuery(filters)).forEach(([k, v]) => qs.set(k, v));
    selectedIds.forEach((id) => qs.append('ids[]', String(id)));
    return `${route(routeName)}?${qs.toString()}`;
}

export default function Index({
    stocks,
    filters: filtersProp,
    branches,
    warehouses,
    products,
    low_stock_threshold_default: lowStockDefault = 10,
}) {
    const { flash } = usePage().props;
    const filters = filtersProp ?? {};

    const [q, setQ] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id ?? '');
    const [productId, setProductId] = useState(filters.product_id ?? '');
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [productFieldFocused, setProductFieldFocused] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    const selectedProductId = String(productId ?? '');

    const selectedProductRow = useMemo(
        () => (products ?? []).find((p) => String(p.id) === selectedProductId) ?? null,
        [products, selectedProductId],
    );

    const filteredProducts = useMemo(() => {
        const q = String(productSearchQuery ?? '').trim().toLowerCase();
        const list = products ?? [];
        if (!q) return list;
        return list.filter((p) => {
            if (String(p.name ?? '').toLowerCase().includes(q)) {
                return true;
            }
            return (p.variants ?? []).some(
                (v) =>
                    String(v.sku ?? '').toLowerCase().includes(q) ||
                    String(v.name ?? '').toLowerCase().includes(q) ||
                    formatVariantAttributes(v).toLowerCase().includes(q),
            );
        });
    }, [products, productSearchQuery]);

    const clearProductFilter = () => {
        setProductId('');
        setProductSearchQuery('');
        setProductFieldFocused(false);
    };

    useEffect(() => {
        setSelectedIds(new Set());
    }, [stocks.current_page]);

    const whByBranch = useMemo(() => {
        const m = new Map();
        (warehouses ?? []).forEach((w) => {
            const bid = String(w.branch_id ?? '');
            if (!m.has(bid)) m.set(bid, []);
            m.get(bid).push(w);
        });
        return m;
    }, [warehouses]);

    const availableWarehouses = whByBranch.get(String(branchId)) ?? warehouses ?? [];

    const run = (e) => {
        e?.preventDefault();
        router.get(
            route('stocks.index'),
            buildQuery({
                q,
                status,
                branch_id: branchId,
                warehouse_id: warehouseId,
                product_id: productId,
            }),
            { preserveState: true, replace: true },
        );
    };

    const clear = () => {
        setQ('');
        setStatus('');
        setBranchId('');
        setWarehouseId('');
        clearProductFilter();
        router.get(route('stocks.index'), {}, { preserveState: false, replace: true });
    };

    const destroyRow = (row) => {
        if (!confirm('Delete this stock row?')) return;
        router.delete(route('stocks.destroy', row.id), { preserveScroll: true });
    };

    const pageIds = useMemo(() => (stocks.data ?? []).map((s) => s.id), [stocks.data]);
    const allPageSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

    const toggleAllPage = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageIds.forEach((id) => next.delete(id));
            } else {
                pageIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const toggleRow = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const openExport = (format) => {
        const href = buildExportUrl(format, {
            q,
            status,
            branch_id: branchId,
            warehouse_id: warehouseId,
            product_id: productId,
        }, Array.from(selectedIds));
        window.location.href = href;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Warehouse-wise stock rows. “Low” uses each product’s quantity alert, or
                            the default threshold ({Number(lowStockDefault).toLocaleString()}) from
                            Settings → Stock.
                        </p>
                    </div>
                    <Link
                        href={route('stocks.create')}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        <IconPlus className="h-5 w-5" />
                        Create
                    </Link>
                </div>
            }
        >
            <Head title="Stock" />

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

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <form onSubmit={run} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className={labelClass}>Search (product / sku)</label>
                            <input value={q} onChange={(e) => setQ(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={branchId}
                                onChange={(e) => {
                                    setBranchId(e.target.value);
                                    setWarehouseId('');
                                }}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(availableWarehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className={labelClass} htmlFor="stock_index_product_search">
                                    Product
                                </label>
                                {selectedProductId ? (
                                    <button
                                        type="button"
                                        onClick={clearProductFilter}
                                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </div>
                            <div className={comboboxWrapClass}>
                                <input
                                    id="stock_index_product_search"
                                    type="text"
                                    autoComplete="off"
                                    className={comboboxInputClass}
                                    placeholder="All — type to search product or SKU…"
                                    value={
                                        productFieldFocused
                                            ? productSearchQuery
                                            : selectedProductId
                                              ? (selectedProductRow?.name ?? '')
                                              : ''
                                    }
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                    onFocus={() => {
                                        setProductFieldFocused(true);
                                        setProductSearchQuery(
                                            selectedProductId
                                                ? (selectedProductRow?.name ?? '')
                                                : productSearchQuery,
                                        );
                                    }}
                                    onBlur={(e) => {
                                        const raw = e.target.value;
                                        window.setTimeout(() => {
                                            setProductFieldFocused(false);
                                            if (String(raw).trim() === '' && selectedProductId) {
                                                clearProductFilter();
                                            } else {
                                                setProductSearchQuery('');
                                            }
                                        }, 200);
                                    }}
                                />
                                {(productFieldFocused || String(productSearchQuery ?? '').trim() !== '') && (
                                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={clearProductFilter}
                                            className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            All products
                                        </button>
                                        {filteredProducts.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-gray-400">
                                                No product found
                                            </div>
                                        ) : (
                                            filteredProducts.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setProductId(String(p.id));
                                                        setProductSearchQuery('');
                                                        setProductFieldFocused(false);
                                                    }}
                                                    className={
                                                        'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ' +
                                                        (String(p.id) === selectedProductId
                                                            ? 'bg-brand/5 font-semibold text-brand'
                                                            : 'text-gray-700')
                                                    }
                                                >
                                                    <span className="font-medium">{p.name}</span>
                                                    {(p.variants ?? []).length > 0 ? (
                                                        <span className="mt-1 block space-y-0.5 border-l-2 border-gray-200 pl-2">
                                                            {(p.variants ?? []).map((v) => (
                                                                <span
                                                                    key={v.id}
                                                                    className="block text-xs leading-snug text-gray-500"
                                                                >
                                                                    {v.sku ? `${v.sku} — ` : ''}
                                                                    {v.name || formatVariantAttributes(v)}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex items-end justify-start gap-2 sm:justify-end">
                            <button
                                type="submit"
                                className="mt-1 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={clear}
                                className="mt-1 inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </form>

                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openExport('csv')}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                        >
                            Download CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => openExport('pdf')}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                        >
                            Download PDF
                        </button>
                    </div>
                    <p className="max-w-xl text-xs text-gray-500">
                        Exports use the same filters as above. If you tick rows, only those IDs are
                        included (still must match filters). If none are ticked, all matching rows
                        export (up to 10,000 for full export, 500 selected IDs max).
                    </p>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-3 py-3 text-start font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                        checked={allPageSelected}
                                        disabled={pageIds.length === 0}
                                        onChange={toggleAllPage}
                                        aria-label="Select all stock rows on this page"
                                    />
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Product</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Variant</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Warehouse</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Lengths (L×Q)
                                </th>
                                <th
                                    className="px-4 py-3 text-start font-semibold text-gray-700"
                                    title="Feet currently on hand in inventory (after sales, transfers, etc.)."
                                >
                                    Actual ft (on hand)
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty (units)</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Reserved</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {stocks.data.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                        No stock rows found.
                                    </td>
                                </tr>
                            ) : (
                                stocks.data.map((s) => (
                                    <tr
                                        key={s.id}
                                        className={
                                            s.is_low_stock
                                                ? 'bg-amber-50/60 hover:bg-amber-50'
                                                : 'hover:bg-gray-50/80'
                                        }
                                    >
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                                checked={selectedIds.has(s.id)}
                                                onChange={() => toggleRow(s.id)}
                                                aria-label={`Select stock row ${s.id}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {s.product?.name ?? `#${s.product_id}`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.product_varient?.sku
                                                ? `${s.product_varient.sku} — ${s.product_varient.name}`
                                                : s.product_varient?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.warehouse?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.warehouse?.branch?.name ?? '—'}
                                        </td>
                                        <td className="max-w-[16rem] px-4 py-3 text-gray-700">
                                            {(s.billing_mode ?? 'quantity') === 'length_ft' ? (
                                                <div>
                                                    <div>{formatLengthPairsSummary(s.length_pairs)}</div>
                                                    {s.length_pairs_sum_ft != null && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Σ rows: {formatQty(s.length_pairs_sum_ft)} ft
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800">
                                            {(s.billing_mode ?? 'quantity') === 'length_ft' ? (
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-gray-900">
                                                            {formatQty(s.quantity)}
                                                        </span>
                                                        {s.is_low_stock && (
                                                            <span
                                                                className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900"
                                                                title={`At or below alert (${s.low_stock_threshold_used ?? lowStockDefault})`}
                                                            >
                                                                Low
                                                            </span>
                                                        )}
                                                    </div>
                                                    {s.length_pairs_qty_matches_sum === false &&
                                                        s.length_pairs_sum_ft != null && (
                                                            <p
                                                                className="mt-1 text-xs text-amber-800"
                                                                title="Saved length rows may be from the last manual edit; on-hand quantity is what inventory uses after sales and movements."
                                                            >
                                                                Saved rows Σ:{' '}
                                                                {formatQty(s.length_pairs_sum_ft)} ft — differs
                                                                from on hand
                                                            </p>
                                                        )}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-gray-900">
                                                    {(s.billing_mode ?? 'quantity') === 'length_ft'
                                                        ? '—'
                                                        : formatQty(s.quantity)}
                                                </span>
                                                {(s.billing_mode ?? 'quantity') !== 'length_ft' &&
                                                    s.is_low_stock && (
                                                        <span
                                                            className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900"
                                                            title={`At or below alert (${s.low_stock_threshold_used ?? lowStockDefault})`}
                                                        >
                                                            Low
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatQty(s.reserved_quantity)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (s.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-gray-100 text-gray-800')
                                                }
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('stocks.show', s.id)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    <IconEye className="h-4 w-4" />
                                                    
                                                </Link>
                                                <Link
                                                    href={route('stocks.edit', s.id)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    <IconPencil className="h-4 w-4" />
                                                    
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyRow(s)}
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
                <Pagination links={stocks.links} />
            </div>
        </AuthenticatedLayout>
    );
}

