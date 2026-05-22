import React, { useMemo, useState } from 'react';
import { computeLengthLineAmounts, emptyLengthPairs } from '@/lib/saleLengthBilling';
import { formatVariantAttributes, variantFullLabel } from '@/lib/variantLabel';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';
const comboboxWrapClass = 'relative mt-2 rounded-lg border border-gray-300 bg-white';
const comboboxInputClass =
    'block w-full rounded-lg border-0 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20';

const DEFAULT_LENGTH_ROW_COUNT = 4;

/** @param {Record<string, unknown> | null | undefined} stock */
export function stockLengthPairsForForm(stock) {
    if ((stock?.billing_mode ?? 'quantity') !== 'length_ft') {
        return emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
    }
    const raw = stock?.length_pairs;
    const rows = Array.isArray(raw) ? raw : [];
    const mapped = rows.map((r) => ({
        length: r?.length !== undefined && r?.length !== null ? String(r.length) : '',
        qty: r?.qty !== undefined && r?.qty !== null ? String(r.qty) : '',
    }));
    const minRows = Math.max(DEFAULT_LENGTH_ROW_COUNT, mapped.length + 1);
    while (mapped.length < minRows) {
        mapped.push({ length: '', qty: '' });
    }
    return mapped;
}

/**
 * @param {Record<string, unknown>} form
 * @returns {Record<string, unknown>}
 */
export function transformStockSubmitData(form) {
    const reserved = Number(form.reserved_quantity ?? 0);
    const variantRaw = form.product_variant_id;
    const productVariantId =
        variantRaw === '' || variantRaw == null ? null : Number(variantRaw);

    if ((form.billing_mode ?? 'quantity') !== 'length_ft') {
        return {
            warehouse_id: Number(form.warehouse_id),
            product_id: Number(form.product_id),
            product_variant_id: productVariantId,
            billing_mode: 'quantity',
            length_pairs: null,
            quantity: Number(form.quantity ?? 0),
            reserved_quantity: reserved,
            status: form.status,
        };
    }

    const normalizedPairs = (Array.isArray(form.length_pairs) ? form.length_pairs : []).map(
        (row) => ({
            length: row?.length === '' || row?.length == null ? 0 : Number(row.length),
            qty: row?.qty === '' || row?.qty == null ? 0 : Number(row.qty),
        }),
    );
    const totalFt = normalizedPairs.reduce((s, r) => s + r.length * r.qty, 0);

    return {
        warehouse_id: Number(form.warehouse_id),
        product_id: Number(form.product_id),
        product_variant_id: productVariantId,
        billing_mode: 'length_ft',
        length_pairs: normalizedPairs,
        quantity: totalFt,
        reserved_quantity: reserved,
        status: form.status,
    };
}

export default function StockForm({
    data,
    setData,
    errors,
    branches,
    warehouses,
    products,
    variants: variantsProp,
    submitLabel,
    onSubmit,
    processing,
}) {
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [variantSearchQuery, setVariantSearchQuery] = useState('');
    const [productFieldFocused, setProductFieldFocused] = useState(false);

    const selectedBranch = String(data.branch_id ?? '');
    const availableWarehouses = useMemo(() => {
        if (!selectedBranch) return warehouses ?? [];
        return (warehouses ?? []).filter((w) => String(w.branch_id) === selectedBranch);
    }, [warehouses, selectedBranch]);

    const selectedProductId = String(data.product_id ?? '');

    const selectedProductRow = useMemo(
        () => (products ?? []).find((p) => String(p.id) === selectedProductId) ?? null,
        [products, selectedProductId],
    );

    const availableVariants = useMemo(() => {
        if (!selectedProductId) return [];
        const nested = selectedProductRow?.variants;
        if (Array.isArray(nested) && nested.length > 0) {
            return nested;
        }
        return (variantsProp ?? []).filter((v) => String(v.product_id) === selectedProductId);
    }, [variantsProp, selectedProductId, selectedProductRow]);

    const selectedVariantRow = useMemo(
        () => availableVariants.find((v) => String(v.id) === String(data.product_variant_id ?? '')) ?? null,
        [availableVariants, data.product_variant_id],
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
                    String(v.name ?? '').toLowerCase().includes(q),
            );
        });
    }, [products, productSearchQuery]);

    const filteredVariants = useMemo(() => {
        const q = String(variantSearchQuery ?? '').trim().toLowerCase();
        if (!q) return availableVariants;
        return availableVariants.filter((v) => {
            const name = String(v.name ?? '').toLowerCase();
            const sku = String(v.sku ?? '').toLowerCase();
            const attrs = formatVariantAttributes(v).toLowerCase();
            return name.includes(q) || sku.includes(q) || attrs.includes(q);
        });
    }, [availableVariants, variantSearchQuery]);

    const clearProductSelection = () => {
        setData((prev) => ({
            ...prev,
            product_id: '',
            product_variant_id: '',
        }));
        setProductSearchQuery('');
        setVariantSearchQuery('');
        setProductFieldFocused(false);
    };

    const clearVariantSelection = () => {
        setData((prev) => ({ ...prev, product_variant_id: '' }));
        setVariantSearchQuery('');
    };

    const isLength = (data.billing_mode ?? 'quantity') === 'length_ft';
    const pairs = Array.isArray(data.length_pairs)
        ? data.length_pairs
        : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
    const lenAmt = computeLengthLineAmounts({
        ...data,
        length_pairs: pairs,
        rate_per_ft: 0,
        unit_price: 0,
    });

    const syncLengthTotals = (draft) => {
        if ((draft.billing_mode ?? 'quantity') !== 'length_ft') {
            return draft;
        }
        const p = Array.isArray(draft.length_pairs)
            ? draft.length_pairs
            : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
        let totalFt = 0;
        for (const row of p) {
            totalFt += Number(row?.length ?? 0) * Number(row?.qty ?? 0);
        }
        return {
            ...draft,
            length_pairs: p,
            quantity: totalFt > 0 ? String(totalFt) : '',
        };
    };

    const toggleLengthStock = (checked) => {
        if (!checked) {
            setData((prev) => ({
                ...prev,
                billing_mode: 'quantity',
                length_pairs: emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT),
                quantity:
                    prev.quantity !== '' && Number(prev.quantity) > 0 ? String(prev.quantity) : '0',
            }));
            return;
        }
        setData((prev) =>
            syncLengthTotals({
                ...prev,
                billing_mode: 'length_ft',
                length_pairs:
                    Array.isArray(prev.length_pairs) && prev.length_pairs.length > 0
                        ? prev.length_pairs
                        : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT),
            }),
        );
    };

    const updateLengthPair = (pairIdx, field, raw) => {
        setData((prev) => {
            const p = Array.isArray(prev.length_pairs)
                ? prev.length_pairs
                : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
            const nextPairs = [...p].map((row, j) =>
                j === pairIdx ? { ...row, [field]: raw } : row,
            );
            return syncLengthTotals({ ...prev, length_pairs: nextPairs });
        });
    };

    const addLengthPairRow = () => {
        setData((prev) => {
            const p = Array.isArray(prev.length_pairs)
                ? prev.length_pairs
                : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
            return syncLengthTotals({
                ...prev,
                length_pairs: [...p, { length: '', qty: '' }],
            });
        });
    };

    const removeLengthPairRow = (pairIdx) => {
        setData((prev) => {
            const p = Array.isArray(prev.length_pairs)
                ? prev.length_pairs
                : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
            if (p.length <= 1) {
                return prev;
            }
            const nextPairs = p.filter((_, j) => j !== pairIdx);
            return syncLengthTotals({ ...prev, length_pairs: nextPairs });
        });
    };

    const refreshLengthPairs = () => {
        setData((prev) =>
            syncLengthTotals({
                ...prev,
                length_pairs: emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT),
            }),
        );
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className={labelClass}>Branch</label>
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
                    {errors?.branch_id && <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>}
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
                    {errors?.warehouse_id && <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>}
                </div>

                <div>
                    <label className={labelClass}>Status *</label>
                    <select
                        value={data.status ?? 'active'}
                        onChange={(e) => setData('status', e.target.value)}
                        className={inputClass}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {errors?.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className={labelClass} htmlFor="stock_product_search">
                            Product *
                        </label>
                        {selectedProductId ? (
                            <button
                                type="button"
                                onClick={clearProductSelection}
                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button>
                        ) : null}
                    </div>
                    <div className={comboboxWrapClass}>
                        <input
                            id="stock_product_search"
                            type="text"
                            autoComplete="off"
                            className={comboboxInputClass}
                            placeholder="Search product…"
                            value={
                                productFieldFocused
                                    ? productSearchQuery
                                    : (selectedProductRow?.name ?? '')
                            }
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            onFocus={() => {
                                setProductFieldFocused(true);
                                setProductSearchQuery(selectedProductRow?.name ?? '');
                            }}
                            onBlur={(e) => {
                                const raw = e.target.value;
                                window.setTimeout(() => {
                                    setProductFieldFocused(false);
                                    if (String(raw).trim() === '' && selectedProductId) {
                                        clearProductSelection();
                                    } else {
                                        setProductSearchQuery('');
                                    }
                                }, 200);
                            }}
                        />
                        {String(productSearchQuery ?? '').trim() !== '' && (
                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                {selectedProductId ? (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            clearProductSelection();
                                        }}
                                        className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        Remove product
                                    </button>
                                ) : null}
                                {filteredProducts.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-400">No product found</div>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setData((prev) => ({
                                                    ...prev,
                                                    product_id: String(p.id),
                                                    product_variant_id: '',
                                                }));
                                                setProductSearchQuery('');
                                                setVariantSearchQuery('');
                                                setProductFieldFocused(false);
                                            }}
                                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <span className="font-medium">{p.name}</span>
                                            {(p.variants ?? []).length > 0 ? (
                                                <span className="mt-1 block space-y-0.5 border-l-2 border-gray-200 pl-2">
                                                    {(p.variants ?? []).map((v) => (
                                                        <span
                                                            key={v.id}
                                                            className="block text-xs leading-snug text-gray-500"
                                                        >
                                                            {variantFullLabel(v)}
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
                    {errors?.product_id && <p className="mt-1 text-sm text-red-600">{errors.product_id}</p>}
                </div>

                <div className="lg:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className={labelClass} htmlFor="stock_variant_search">
                            Variant *
                        </label>
                        {selectedProductId && availableVariants.length > 0 && data.product_variant_id ? (
                            <button
                                type="button"
                                onClick={clearVariantSelection}
                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>
                    {!selectedProductId ? (
                        <p className="mt-2 text-sm text-gray-500">Select a product first.</p>
                    ) : availableVariants.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-500">No variants for this product.</p>
                    ) : (
                        <div className="mt-2 space-y-3">
                            <input
                                id="stock_variant_search"
                                type="text"
                                autoComplete="off"
                                className={inputClass}
                                placeholder="Filter by SKU, name, or attributes…"
                                value={variantSearchQuery}
                                onChange={(e) => setVariantSearchQuery(e.target.value)}
                            />
                            <div className="max-h-72 overflow-auto rounded-lg border border-gray-200 bg-gray-50/50">
                                {filteredVariants.length === 0 ? (
                                    <p className="px-3 py-4 text-sm text-gray-400">No variant found</p>
                                ) : (
                                    filteredVariants.map((v) => {
                                        const selected =
                                            String(v.id) === String(data.product_variant_id ?? '');
                                        const attrs = formatVariantAttributes(v);
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => {
                                                    setData((prev) => ({
                                                        ...prev,
                                                        product_variant_id: String(v.id),
                                                    }));
                                                }}
                                                className={`block w-full border-b border-gray-100 px-3 py-3 text-left last:border-b-0 ${
                                                    selected
                                                        ? 'bg-brand/10 ring-2 ring-inset ring-brand'
                                                        : 'bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                {v.sku ? (
                                                    <p className="font-mono text-sm font-bold text-gray-900">
                                                        SKU: {v.sku}
                                                    </p>
                                                ) : null}
                                                {v.name ? (
                                                    <p className="mt-0.5 text-sm font-medium text-gray-800">
                                                        {v.name}
                                                    </p>
                                                ) : null}
                                                {attrs ? (
                                                    <p className="mt-1 text-xs leading-relaxed text-gray-600">
                                                        {attrs}
                                                    </p>
                                                ) : null}
                                                {!v.sku && !v.name && !attrs ? (
                                                    <p className="text-sm text-gray-700">
                                                        Variant #{v.id}
                                                    </p>
                                                ) : null}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            {selectedVariantRow ? (
                                <div className="rounded-lg border border-brand/30 bg-brand-muted px-3 py-2.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-on-muted">
                                        Selected variant
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {variantFullLabel(selectedVariantRow)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-amber-700">
                                    Select one variant from the list above.
                                </p>
                            )}
                        </div>
                    )}
                    {errors?.product_variant_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.product_variant_id}</p>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                    <input
                        type="checkbox"
                        checked={isLength}
                        onChange={(e) => toggleLengthStock(e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span>
                        <span className="block text-sm font-semibold text-gray-900">
                            Length (ft) stock — length × qty rows
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-600">
                            Same as Sale: multiple rows of length and quantity; total feet (Σ length × qty) is
                            saved as stock quantity so inventory matches length-billed sales.
                        </span>
                    </span>
                </label>
            </div>

            {isLength ? (
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Lengths</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {pairs.map((row, pairIdx) => {
                            const lineFt = Number(row.length || 0) * Number(row.qty || 0);
                            return (
                                <div
                                    key={pairIdx}
                                    className="rounded-lg border border-gray-200 bg-gray-50/50 p-2"
                                >
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
                                            placeholder="Length"
                                            value={row.length}
                                            onChange={(e) =>
                                                updateLengthPair(pairIdx, 'length', e.target.value)
                                            }
                                        />
                                        <span className="shrink-0 text-gray-400">×</span>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
                                            placeholder="Qty"
                                            value={row.qty}
                                            onChange={(e) =>
                                                updateLengthPair(pairIdx, 'qty', e.target.value)
                                            }
                                        />
                                        {pairs.length > 1 ? (
                                            <button
                                                type="button"
                                                title="Remove row"
                                                className="shrink-0 rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => removeLengthPairRow(pairIdx)}
                                            >
                                                ×
                                            </button>
                                        ) : null}
                                    </div>
                                    <p className="mt-1 text-center text-xs text-gray-500">
                                        = {lineFt.toFixed(4)} ft
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-gray-200 pt-3">
                        <div>
                            <p className="text-xs font-medium text-gray-600">Total FT (stock qty)</p>
                            <p className="font-mono text-lg font-semibold text-gray-900">
                                {lenAmt.totalFt.toFixed(4)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10"
                                onClick={addLengthPairRow}
                            >
                                + Add length row
                            </button>
                            <button
                                type="button"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                onClick={refreshLengthPairs}
                            >
                                Refresh rows
                            </button>
                        </div>
                    </div>
                    {errors?.length_pairs && (
                        <p className="text-sm text-red-600">{errors.length_pairs}</p>
                    )}
                </div>
            ) : (
                <div>
                    <label className={labelClass}>Quantity (units)</label>
                    <input
                        type="number"
                        step="0.0001"
                        value={data.quantity ?? 0}
                        onChange={(e) => setData('quantity', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                </div>
            )}

            <div>
                <label className={labelClass}>Reserved quantity</label>
                <input
                    type="number"
                    step="0.0001"
                    value={data.reserved_quantity ?? 0}
                    onChange={(e) => setData('reserved_quantity', e.target.value)}
                    className={inputClass}
                />
                {errors?.reserved_quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.reserved_quantity}</p>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
