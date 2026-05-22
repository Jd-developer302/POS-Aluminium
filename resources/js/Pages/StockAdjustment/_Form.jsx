import React, { useMemo, useState } from 'react';

const inputClass =
    'mt-2 block h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

function formatDate(value) {
    if (!value) return '';
    const s = String(value);
    if (s.includes('T')) return s.slice(0, 10);
    return s;
}

function buildVariantOptions(variants, productId) {
    if (!productId) return [];
    return (variants ?? []).filter((v) => String(v.product_id) === String(productId));
}

function buildBatchOptions(batches, productId, variantId) {
    if (!productId) return [];
    return (batches ?? []).filter((b) => {
        if (String(b.product_id) !== String(productId)) return false;
        if (!variantId) return true;
        return String(b.product_variant_id ?? '') === String(variantId);
    });
}

export default function StockAdjustmentForm({
    branches,
    warehouses,
    products,
    variants,
    batches,
    data,
    setData,
    errors,
    onSubmit,
    submitLabel,
    processing,
}) {
    const whByBranch = useMemo(() => {
        const m = new Map();
        (warehouses ?? []).forEach((w) => {
            const bid = String(w.branch_id ?? '');
            if (!m.has(bid)) m.set(bid, []);
            m.get(bid).push(w);
        });
        return m;
    }, [warehouses]);

    const availableWarehouses =
        whByBranch.get(String(data.branch_id ?? '')) ?? warehouses ?? [];

    const [selectedProduct, setSelectedProduct] = useState('');

    const addItem = () => {
        if (!selectedProduct) return;
        setData('items', [
            ...(data.items ?? []),
            {
                id: null,
                product_id: Number(selectedProduct),
                product_variant_id: '',
                product_batch_id: '',
                quantity: 1,
                notes: '',
            },
        ]);
        setSelectedProduct('');
    };

    const updateItem = (idx, patch) => {
        setData(
            'items',
            (data.items ?? []).map((it, i) => (i === idx ? { ...it, ...patch } : it)),
        );
    };

    const removeItem = (idx) => {
        setData(
            'items',
            (data.items ?? []).filter((_, i) => i !== idx),
        );
    };

    const totalQty = useMemo(() => {
        return (data.items ?? []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    }, [data.items]);

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className={labelClass}>Branch *</label>
                    <select
                        value={data.branch_id ?? ''}
                        onChange={(e) => {
                            setData('branch_id', e.target.value);
                            setData('warehouse_id', '');
                        }}
                        className={inputClass}
                    >
                        <option value="">Select</option>
                        {(branches ?? []).map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    {errors?.branch_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Warehouse *</label>
                    <select
                        value={data.warehouse_id ?? ''}
                        onChange={(e) => setData('warehouse_id', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select</option>
                        {availableWarehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                    {errors?.warehouse_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Date *</label>
                    <input
                        type="date"
                        value={data.adjustment_date ?? ''}
                        onChange={(e) => setData('adjustment_date', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.adjustment_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.adjustment_date}</p>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Reference *</label>
                    <input
                        value={data.reference_number ?? ''}
                        onChange={(e) => setData('reference_number', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.reference_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.reference_number}</p>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className={labelClass}>Type *</label>
                    <select
                        value={data.type ?? 'increase'}
                        onChange={(e) => setData('type', e.target.value)}
                        className={inputClass}
                    >
                        <option value="increase">Increase</option>
                        <option value="decrease">Decrease</option>
                        <option value="damage">Damage</option>
                        <option value="wastage">Wastage</option>
                        <option value="manual">Manual</option>
                    </select>
                    {errors?.type && (
                        <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Status *</label>
                    <select
                        value={data.status ?? 'draft'}
                        onChange={(e) => setData('status', e.target.value)}
                        className={inputClass}
                    >
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    {errors?.status && (
                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                    )}
                </div>
                <div className="sm:col-span-2">
                    <label className={labelClass}>Reason</label>
                    <input
                        value={data.reason ?? ''}
                        onChange={(e) => setData('reason', e.target.value)}
                        className={inputClass}
                        placeholder="Optional note"
                    />
                    {errors?.reason && (
                        <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Items</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Total qty: <span className="font-semibold text-gray-900">{totalQty}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[220px]">
                            <label className={labelClass}>Add product</label>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select</option>
                                {(products ?? []).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-2 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Product</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Variant</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Batch</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Qty</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Notes</th>
                                <th className="px-3 py-2 text-end font-semibold text-gray-700">Remove</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {(data.items ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                                        No items added.
                                    </td>
                                </tr>
                            ) : (
                                (data.items ?? []).map((it, idx) => {
                                    const vOpts = buildVariantOptions(variants, it.product_id);
                                    const bOpts = buildBatchOptions(batches, it.product_id, it.product_variant_id);
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/70">
                                            <td className="px-3 py-2">
                                                <select
                                                    value={it.product_id ?? ''}
                                                    onChange={(e) =>
                                                        updateItem(idx, {
                                                            product_id: Number(e.target.value),
                                                            product_variant_id: '',
                                                            product_batch_id: '',
                                                        })
                                                    }
                                                    className="h-10 w-56 rounded-lg border border-gray-300 px-3"
                                                >
                                                    {(products ?? []).map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors?.[`items.${idx}.product_id`] && (
                                                    <p className="mt-1 text-xs text-red-600">
                                                        {errors[`items.${idx}.product_id`]}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={it.product_variant_id ?? ''}
                                                    onChange={(e) =>
                                                        updateItem(idx, {
                                                            product_variant_id: e.target.value,
                                                            product_batch_id: '',
                                                        })
                                                    }
                                                    className="h-10 w-44 rounded-lg border border-gray-300 px-3"
                                                >
                                                    <option value="">—</option>
                                                    {vOpts.map((v) => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.sku ? `${v.sku} — ${v.name}` : v.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={it.product_batch_id ?? ''}
                                                    onChange={(e) =>
                                                        updateItem(idx, { product_batch_id: e.target.value })
                                                    }
                                                    className="h-10 w-44 rounded-lg border border-gray-300 px-3"
                                                >
                                                    <option value="">—</option>
                                                    {bOpts.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.batch_number}
                                                            {b.expiry_date ? ` (exp ${formatDate(b.expiry_date)})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    value={it.quantity ?? 1}
                                                    onChange={(e) =>
                                                        updateItem(idx, { quantity: e.target.value })
                                                    }
                                                    className="h-10 w-24 rounded-lg border border-gray-300 px-3"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    value={it.notes ?? ''}
                                                    onChange={(e) => updateItem(idx, { notes: e.target.value })}
                                                    className="h-10 w-56 rounded-lg border border-gray-300 px-3"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="inline-flex h-10 items-center rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

