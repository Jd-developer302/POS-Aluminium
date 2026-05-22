import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

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

function buildQuery(filters) {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
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

const SOURCE_TYPE_LABELS = {
    stock_transfer: 'Stock Transfer',
    stock_adjustment: 'Stock Adjustment',
    purchase_invoice: 'Purchase Invoice',
    sale: 'Sale',
    sale_return: 'Sale Return',
    system: 'System',
};

function formatSourceType(value) {
    if (value == null || value === '') return '—';
    const key = String(value).trim();
    if (SOURCE_TYPE_LABELS[key]) {
        return SOURCE_TYPE_LABELS[key];
    }
    return key
        .split('_')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

export default function Index({ movements, filters: filtersProp, branches, warehouses, products }) {
    const { flash } = usePage().props;
    const filters = filtersProp ?? {};

    const [q, setQ] = useState(filters.q ?? '');
    const [direction, setDirection] = useState(filters.direction ?? '');
    const [sourceType, setSourceType] = useState(filters.source_type ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id ?? '');
    const [productId, setProductId] = useState(filters.product_id ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

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
            route('inventory-movements.index'),
            buildQuery({
                q,
                direction,
                source_type: sourceType,
                branch_id: branchId,
                warehouse_id: warehouseId,
                product_id: productId,
                from,
                to,
            }),
            { preserveState: true, replace: true },
        );
    };

    const clear = () => {
        setQ('');
        setDirection('');
        setSourceType('');
        setBranchId('');
        setWarehouseId('');
        setProductId('');
        setFrom('');
        setTo('');
        router.get(route('inventory-movements.index'), {}, { preserveState: false, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Movements</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Full stock audit trail (in / out)
                    </p>
                </div>
            }
        >
            <Head title="Inventory Movements" />

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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className={labelClass}>Search (reference/source)</label>
                            <input value={q} onChange={(e) => setQ(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Direction</label>
                            <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputClass}>
                                <option value="">All</option>
                                <option value="in">In</option>
                                <option value="out">Out</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Source type</label>
                            <input value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={inputClass} placeholder="sale / purchase_invoice ..." />
                        </div>
                        <div>
                            <label className={labelClass}>Product</label>
                            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
                                <option value="">All</option>
                                {(products ?? []).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass}>
                                <option value="">All</option>
                                {(availableWarehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>From</label>
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>To</label>
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            Apply filters
                        </button>
                        <button
                            type="button"
                            onClick={clear}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Time</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Dir</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Product</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Warehouse</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Before</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">After</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Source</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Reference</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {movements.data.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                        No movements found.
                                    </td>
                                </tr>
                            ) : (
                                movements.data.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {new Date(m.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (m.direction === 'in'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-800')
                                                }
                                            >
                                                {m.direction}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{m.product?.name ?? `#${m.product_id}`}</td>
                                        <td className="px-4 py-3 text-gray-700">{m.branch?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{m.warehouse?.name ?? '—'}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {formatQty(m.quantity)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{formatQty(m.before_qty)}</td>
                                        <td className="px-4 py-3 text-gray-700">{formatQty(m.after_qty)}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {formatSourceType(m.source_type)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{m.reference ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {[
                                                m.created_by?.employee?.name,
                                                m.created_by?.name,
                                            ].find((x) => x != null && String(x).trim() !== '') ?? '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={movements.links} />
            </div>
        </AuthenticatedLayout>
    );
}

