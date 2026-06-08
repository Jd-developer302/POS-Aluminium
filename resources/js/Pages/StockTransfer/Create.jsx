import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GlassAreaBillingPanel from '@/Components/GlassAreaBillingPanel';
import {
    addBillingPairRow,
    DEFAULT_BILLING_ROW_COUNT,
    emptyAreaPairs,
    emptyLengthPairs,
    removeBillingPairRow,
    setBillingMode,
    syncBillingTotals,
    updateBillingPair,
} from '@/lib/billingLineItemState';
import { computeAreaLineAmounts } from '@/lib/glassAreaBilling';
import { computeLengthLineAmounts } from '@/lib/saleLengthBilling';
import { transformStockTransferItemsForSubmit } from '@/lib/stockTransferItemSubmit';
import { formatVariantAttributes, variantFullLabel } from '@/lib/variantLabel';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';
const comboboxWrapClass = 'relative mt-2 rounded-lg border border-gray-300 bg-white';
const comboboxInputClass =
    'block w-full rounded-lg border-0 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20';

function buildItem(productId, product, variantId = null) {
    const variants = product?.variants ?? [];
    let defaultVariantId =
        variantId !== null && variantId !== '' && variantId !== undefined
            ? Number(variantId)
            : null;
    if (defaultVariantId == null) {
        defaultVariantId =
            product?.type === 'variable' || variants.length !== 1 ? null : Number(variants[0].id);
    }
    return {
        product_id: productId ? Number(productId) : '',
        product_variant_id: defaultVariantId,
        billing_mode: 'quantity',
        length_pairs: emptyLengthPairs(DEFAULT_BILLING_ROW_COUNT),
        quantity: '1',
    };
}

export default function Create({ branches, warehouses, products }) {
    const productList = products ?? [];
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedVariantForAdd, setSelectedVariantForAdd] = useState('');
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [productFieldFocused, setProductFieldFocused] = useState(false);
    const [variantSearchByIdx, setVariantSearchByIdx] = useState({});

    const selectedProductObj = useMemo(
        () => productList.find((p) => String(p.id) === String(selectedProduct)) ?? null,
        [productList, selectedProduct],
    );

    const filteredProductsForPicker = useMemo(() => {
        const q = String(productSearchQuery ?? '').trim().toLowerCase();
        if (!q) return productList;
        return productList.filter((p) => {
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
    }, [productList, productSearchQuery]);

    const whByBranch = useMemo(() => {
        const m = new Map();
        (warehouses ?? []).forEach((w) => {
            const bid = String(w.branch_id);
            if (!m.has(bid)) m.set(bid, []);
            m.get(bid).push(w);
        });
        return m;
    }, [warehouses]);

    const { data, setData, post, processing, errors, transform } = useForm({
        from_branch_id: '',
        to_branch_id: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        reference_number: `TRF-${Date.now()}`,
        status: 'draft',
        notes: '',
        items: [],
    });

    const fromWarehouses = whByBranch.get(String(data.from_branch_id)) ?? [];
    const toWarehouses = whByBranch.get(String(data.to_branch_id)) ?? [];

    const qtyColumnHeader = useMemo(() => {
        const items = data.items ?? [];
        if (items.every((it) => (it.billing_mode ?? 'quantity') === 'length_ft')) {
            return 'Length Qty (ft)';
        }
        if (items.every((it) => (it.billing_mode ?? 'quantity') === 'area_sqft')) {
            return 'Sq Ft';
        }
        return 'Qty';
    }, [data.items]);

    const clearProductPicker = () => {
        setSelectedProduct('');
        setSelectedVariantForAdd('');
        setProductSearchQuery('');
        setProductFieldFocused(false);
    };

    const selectProductForAdd = (productId) => {
        setSelectedProduct(String(productId));
        setSelectedVariantForAdd('');
        setProductSearchQuery('');
        setProductFieldFocused(false);
    };

    const addItemWithProduct = (productId, variantId = null) => {
        const prod = productList.find((p) => String(p.id) === String(productId));
        if (!prod) return;
        setData('items', [...data.items, buildItem(productId, prod, variantId)]);
        clearProductPicker();
    };

    const addItem = () => {
        if (!selectedProduct) return;
        addItemWithProduct(selectedProduct, selectedVariantForAdd || null);
    };

    const productPickerOpen =
        productFieldFocused || String(productSearchQuery ?? '').trim() !== '';

    const setVariantSearch = (idx, query) => {
        setVariantSearchByIdx((prev) => ({ ...prev, [idx]: query }));
    };

    const updateItem = (idx, key, value) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) return it;
                let next = { ...it, [key]: value };
                if (['length_ft', 'area_sqft'].includes(next.billing_mode ?? 'quantity')) {
                    next = syncBillingTotals(next);
                }
                return next;
            }),
        );
    };

    const toggleBillingMode = (idx, targetMode, checked) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) return it;
                if (!checked) return setBillingMode(it, 'quantity');
                return setBillingMode(it, targetMode);
            }),
        );
    };

    const updateBillingPairRow = (idx, pairIdx, field, raw) => {
        setData(
            'items',
            data.items.map((it, i) =>
                i === idx ? updateBillingPair(it, pairIdx, field, raw) : it,
            ),
        );
    };

    const addBillingPairRowToItem = (idx) => {
        setData(
            'items',
            data.items.map((it, i) => (i === idx ? addBillingPairRow(it) : it)),
        );
    };

    const removeBillingPairRowFromItem = (idx, pairIdx) => {
        setData(
            'items',
            data.items.map((it, i) =>
                i === idx ? removeBillingPairRow(it, pairIdx) : it,
            ),
        );
    };

    const refreshBillingPairs = (idx) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) return it;
                const mode = it.billing_mode ?? 'quantity';
                const empty =
                    mode === 'area_sqft'
                        ? emptyAreaPairs(DEFAULT_BILLING_ROW_COUNT)
                        : emptyLengthPairs(DEFAULT_BILLING_ROW_COUNT);
                return syncBillingTotals({ ...it, length_pairs: empty });
            }),
        );
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
        setVariantSearchByIdx((prev) => {
            const next = {};
            Object.entries(prev).forEach(([k, v]) => {
                const i = Number(k);
                if (i < idx) next[i] = v;
                else if (i > idx) next[i - 1] = v;
            });
            return next;
        });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: transformStockTransferItemsForSubmit(form.items),
        }));
        post(route('stock-transfers.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-gray-900">Create Transfer</h1>}>
            <Head title="Create Transfer" />

            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <form onSubmit={onSubmit} className="space-y-6 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className={labelClass}>From Branch</label>
                                <select
                                    value={data.from_branch_id}
                                    onChange={(e) => {
                                        setData('from_branch_id', e.target.value);
                                        setData('from_warehouse_id', '');
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.from_branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.from_branch_id}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>To Branch</label>
                                <select
                                    value={data.to_branch_id}
                                    onChange={(e) => {
                                        setData('to_branch_id', e.target.value);
                                        setData('to_warehouse_id', '');
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.to_branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.to_branch_id}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>From Warehouse</label>
                                <select
                                    value={data.from_warehouse_id}
                                    onChange={(e) => setData('from_warehouse_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {fromWarehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.from_warehouse_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.from_warehouse_id}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>To Warehouse</label>
                                <select
                                    value={data.to_warehouse_id}
                                    onChange={(e) => setData('to_warehouse_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {toWarehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.to_warehouse_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.to_warehouse_id}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Transfer Date</label>
                                <input
                                    type="date"
                                    value={data.transfer_date}
                                    onChange={(e) => setData('transfer_date', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.transfer_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.transfer_date}</p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Reference</label>
                                <input
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.reference_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.reference_number}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="completed">Completed (move stock)</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Notes</label>
                                <input
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200">
                            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-end">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <label htmlFor="transfer_add_product" className={labelClass}>
                                            Add product
                                        </label>
                                        {selectedProduct ? (
                                            <button
                                                type="button"
                                                onClick={clearProductPicker}
                                                className="text-xs font-semibold text-red-600 hover:text-red-800"
                                            >
                                                Clear
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className={comboboxWrapClass}>
                                        <input
                                            id="transfer_add_product"
                                            type="text"
                                            autoComplete="off"
                                            className={comboboxInputClass}
                                            placeholder="Search product or SKU…"
                                            value={
                                                productFieldFocused
                                                    ? productSearchQuery
                                                    : selectedProductObj?.name ?? ''
                                            }
                                            onChange={(e) => setProductSearchQuery(e.target.value)}
                                            onFocus={() => {
                                                setProductFieldFocused(true);
                                                setProductSearchQuery(
                                                    selectedProduct
                                                        ? (selectedProductObj?.name ?? '')
                                                        : productSearchQuery,
                                                );
                                            }}
                                            onBlur={(e) => {
                                                const raw = e.target.value;
                                                window.setTimeout(() => {
                                                    setProductFieldFocused(false);
                                                    if (String(raw).trim() === '' && selectedProduct) {
                                                        clearProductPicker();
                                                    } else {
                                                        setProductSearchQuery('');
                                                    }
                                                }, 200);
                                            }}
                                        />
                                        {productPickerOpen ? (
                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {selectedProduct ? (
                                                    <button
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={clearProductPicker}
                                                        className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Clear selection
                                                    </button>
                                                ) : null}
                                                {filteredProductsForPicker.length === 0 ? (
                                                    <div className="px-3 py-2 text-sm text-gray-400">
                                                        No product found
                                                    </div>
                                                ) : (
                                                    filteredProductsForPicker.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="border-b border-gray-100 last:border-b-0"
                                                        >
                                                            <button
                                                                type="button"
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    const variants = p.variants ?? [];
                                                                    if (variants.length === 1) {
                                                                        addItemWithProduct(
                                                                            p.id,
                                                                            variants[0].id,
                                                                        );
                                                                        return;
                                                                    }
                                                                    selectProductForAdd(p.id);
                                                                }}
                                                                className={
                                                                    'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ' +
                                                                    (String(p.id) === String(selectedProduct)
                                                                        ? 'bg-brand/5 font-semibold text-brand'
                                                                        : 'text-gray-700')
                                                                }
                                                            >
                                                                <span className="font-medium">{p.name}</span>
                                                            </button>
                                                            {(p.variants ?? []).length > 0 ? (
                                                                <div className="space-y-0.5 border-l-2 border-gray-200 pb-2 pl-4">
                                                                    {(p.variants ?? []).map((v) => (
                                                                        <button
                                                                            key={v.id}
                                                                            type="button"
                                                                            onMouseDown={(e) =>
                                                                                e.preventDefault()
                                                                            }
                                                                            onClick={() =>
                                                                                addItemWithProduct(p.id, v.id)
                                                                            }
                                                                            className="block w-full rounded px-2 py-1.5 text-left text-xs leading-snug text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                                        >
                                                                            {variantFullLabel(v)}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                    {selectedProductObj && (selectedProductObj.variants ?? []).length > 1 ? (
                                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                Variants — click to add or select before Add
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                {(selectedProductObj.variants ?? []).map((v) => {
                                                    const selected =
                                                        String(v.id) ===
                                                        String(selectedVariantForAdd ?? '');
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedVariantForAdd(String(v.id))
                                                            }
                                                            className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                                                                selected
                                                                    ? 'border-brand bg-brand/10 ring-2 ring-inset ring-brand'
                                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {variantFullLabel(v)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {selectedVariantForAdd ? (
                                                <p className="mt-2 text-xs text-gray-600">
                                                    Selected:{' '}
                                                    <span className="font-medium text-gray-900">
                                                        {variantFullLabel(
                                                            (selectedProductObj.variants ?? []).find(
                                                                (v) =>
                                                                    String(v.id) ===
                                                                    String(selectedVariantForAdd),
                                                            ),
                                                        )}
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-xs text-amber-700">
                                                    Pick a variant, or click a variant in the search
                                                    list to add directly.
                                                </p>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    disabled={
                                        !selectedProduct ||
                                        ((selectedProductObj?.variants ?? []).length > 1 &&
                                            !selectedVariantForAdd)
                                    }
                                    className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                Variant
                                            </th>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                {qtyColumnHeader}
                                            </th>
                                            <th className="px-4 py-3 text-end font-semibold text-gray-700">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {data.items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-6 text-center text-gray-500"
                                                >
                                                    Add at least one item.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.items.map((it, idx) => {
                                                const rowProduct = productList.find(
                                                    (p) => p.id === Number(it.product_id),
                                                );
                                                const isVariable = rowProduct?.type === 'variable';
                                                const variants = rowProduct?.variants ?? [];
                                                const showVariantPicker =
                                                    isVariable || variants.length > 0;
                                                const variantSearchQuery =
                                                    variantSearchByIdx[idx] ?? '';
                                                const filteredVariants = (() => {
                                                    const q = String(variantSearchQuery)
                                                        .trim()
                                                        .toLowerCase();
                                                    if (!q) return variants;
                                                    return variants.filter((v) => {
                                                        const name = String(v.name ?? '').toLowerCase();
                                                        const sku = String(v.sku ?? '').toLowerCase();
                                                        const attrs = formatVariantAttributes(v).toLowerCase();
                                                        return (
                                                            name.includes(q) ||
                                                            sku.includes(q) ||
                                                            attrs.includes(q)
                                                        );
                                                    });
                                                })();
                                                const selectedVariantRow =
                                                    variants.find(
                                                        (v) =>
                                                            String(v.id) ===
                                                            String(it.product_variant_id ?? ''),
                                                    ) ?? null;
                                                const billingMode = it.billing_mode ?? 'quantity';
                                                const isLength = billingMode === 'length_ft';
                                                const isArea = billingMode === 'area_sqft';
                                                const pairs = Array.isArray(it.length_pairs)
                                                    ? it.length_pairs
                                                    : isArea
                                                      ? emptyAreaPairs(DEFAULT_BILLING_ROW_COUNT)
                                                      : emptyLengthPairs(DEFAULT_BILLING_ROW_COUNT);
                                                const lenAmt = computeLengthLineAmounts({
                                                    length_pairs: pairs,
                                                });
                                                const areaAmt = computeAreaLineAmounts({
                                                    length_pairs: pairs,
                                                });

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr>
                                                            <td className="px-4 py-3 text-gray-900">
                                                                <span className="font-medium">
                                                                    {rowProduct?.name ?? '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                {!showVariantPicker ? (
                                                                    <span className="text-sm text-gray-500">
                                                                        —
                                                                    </span>
                                                                ) : (
                                                                    <div className="min-w-[14rem] space-y-2">
                                                                        <input
                                                                            type="text"
                                                                            autoComplete="off"
                                                                            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                            placeholder="Filter by SKU, name, or attributes…"
                                                                            value={variantSearchQuery}
                                                                            onChange={(e) =>
                                                                                setVariantSearch(
                                                                                    idx,
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                        />
                                                                        <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-gray-50/50">
                                                                            {filteredVariants.length === 0 ? (
                                                                                <p className="px-3 py-3 text-xs text-gray-400">
                                                                                    No variant found
                                                                                </p>
                                                                            ) : (
                                                                                filteredVariants.map((v) => {
                                                                                    const selected =
                                                                                        String(v.id) ===
                                                                                        String(
                                                                                            it.product_variant_id ??
                                                                                                '',
                                                                                        );
                                                                                    const attrs =
                                                                                        formatVariantAttributes(
                                                                                            v,
                                                                                        );
                                                                                    return (
                                                                                        <button
                                                                                            key={v.id}
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                updateItem(
                                                                                                    idx,
                                                                                                    'product_variant_id',
                                                                                                    String(
                                                                                                        v.id,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            className={`block w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 ${
                                                                                                selected
                                                                                                    ? 'bg-brand/10 ring-2 ring-inset ring-brand'
                                                                                                    : 'bg-white hover:bg-gray-50'
                                                                                            }`}
                                                                                        >
                                                                                            {v.sku ? (
                                                                                                <p className="font-mono text-xs font-bold text-gray-900">
                                                                                                    SKU: {v.sku}
                                                                                                </p>
                                                                                            ) : null}
                                                                                            {v.name ? (
                                                                                                <p className="mt-0.5 text-xs font-medium text-gray-800">
                                                                                                    {v.name}
                                                                                                </p>
                                                                                            ) : null}
                                                                                            {attrs ? (
                                                                                                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                                                                                                    {attrs}
                                                                                                </p>
                                                                                            ) : null}
                                                                                        </button>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>
                                                                        {selectedVariantRow ? (
                                                                            <div className="rounded-lg border border-brand/30 bg-brand-muted px-2 py-2">
                                                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-on-muted">
                                                                                    Selected
                                                                                </p>
                                                                                <p className="mt-0.5 text-xs font-medium text-gray-900">
                                                                                    {variantFullLabel(
                                                                                        selectedVariantRow,
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-amber-700">
                                                                                Select one variant from the list.
                                                                            </p>
                                                                        )}
                                                                        {errors?.[
                                                                            `items.${idx}.product_variant_id`
                                                                        ] && (
                                                                            <p className="text-xs text-red-600">
                                                                                {
                                                                                    errors[
                                                                                        `items.${idx}.product_variant_id`
                                                                                    ]
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                {isLength ? (
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Total ft
                                                                        </p>
                                                                        <p className="font-mono font-semibold">
                                                                            {lenAmt.totalFt.toFixed(4)}
                                                                        </p>
                                                                    </div>
                                                                ) : isArea ? (
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Total sq ft
                                                                        </p>
                                                                        <p className="font-mono font-semibold">
                                                                            {areaAmt.totalSqFt.toFixed(4)}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        type="number"
                                                                        step="0.0001"
                                                                        value={it.quantity}
                                                                        onChange={(e) =>
                                                                            updateItem(
                                                                                idx,
                                                                                'quantity',
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                    />
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-end align-top">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(idx)}
                                                                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        <tr className="bg-gray-50/60">
                                                            <td colSpan={4} className="px-4 py-3">
                                                                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                                                                    <label className="flex cursor-pointer items-start gap-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isLength}
                                                                            onChange={(e) =>
                                                                                toggleBillingMode(
                                                                                    idx,
                                                                                    'length_ft',
                                                                                    e.target.checked,
                                                                                )
                                                                            }
                                                                            className="mt-1 rounded border-gray-300 text-brand focus:ring-brand"
                                                                        />
                                                                        <span>
                                                                            <span className="block text-sm font-semibold text-gray-900">
                                                                                Length (ft) transfer — length ×
                                                                                qty rows
                                                                            </span>
                                                                            <span className="mt-0.5 block text-xs text-gray-600">
                                                                                Multiple rows of length and
                                                                                quantity; total feet (Σ length ×
                                                                                qty) is transferred.
                                                                            </span>
                                                                        </span>
                                                                    </label>
                                                                    <label className="flex cursor-pointer items-start gap-3">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isArea}
                                                                            onChange={(e) =>
                                                                                toggleBillingMode(
                                                                                    idx,
                                                                                    'area_sqft',
                                                                                    e.target.checked,
                                                                                )
                                                                            }
                                                                            className="mt-1 rounded border-gray-300 text-brand focus:ring-brand"
                                                                        />
                                                                        <span>
                                                                            <span className="block text-sm font-semibold text-gray-900">
                                                                                Glass area (sq ft) transfer — W ×
                                                                                H × qty / 144
                                                                            </span>
                                                                            <span className="mt-0.5 block text-xs text-gray-600">
                                                                                Multiple width × height × qty
                                                                                rows; total square feet is
                                                                                transferred.
                                                                            </span>
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {isLength && (
                                                            <tr className="bg-gray-50/80">
                                                                <td colSpan={4} className="px-4 py-4">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                                        Lengths (L×Q)
                                                                    </p>
                                                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                                        {pairs.map((row, pairIdx) => {
                                                                            const lineFt =
                                                                                Number(row.length || 0) *
                                                                                Number(row.qty || 0);
                                                                            return (
                                                                                <div
                                                                                    key={pairIdx}
                                                                                    className="rounded-lg border border-gray-200 bg-white p-2"
                                                                                >
                                                                                    <div className="flex items-center gap-1">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.0001"
                                                                                            min="0"
                                                                                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                                                                            placeholder="Length"
                                                                                            value={row.length}
                                                                                            onChange={(e) =>
                                                                                                updateBillingPairRow(
                                                                                                    idx,
                                                                                                    pairIdx,
                                                                                                    'length',
                                                                                                    e.target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        <span className="text-gray-400">
                                                                                            ×
                                                                                        </span>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.0001"
                                                                                            min="0"
                                                                                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                                                                            placeholder="Qty"
                                                                                            value={row.qty}
                                                                                            onChange={(e) =>
                                                                                                updateBillingPairRow(
                                                                                                    idx,
                                                                                                    pairIdx,
                                                                                                    'qty',
                                                                                                    e.target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        {pairs.length >
                                                                                        1 ? (
                                                                                            <button
                                                                                                type="button"
                                                                                                className="shrink-0 rounded border px-1.5 py-1 text-xs text-gray-500 hover:text-red-700"
                                                                                                onClick={() =>
                                                                                                    removeBillingPairRowFromItem(
                                                                                                        idx,
                                                                                                        pairIdx,
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                ×
                                                                                            </button>
                                                                                        ) : null}
                                                                                    </div>
                                                                                    <p className="mt-1 text-center text-xs text-gray-500">
                                                                                        = {lineFt.toFixed(4)}{' '}
                                                                                        ft
                                                                                    </p>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="mt-3 flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                addBillingPairRowToItem(idx)
                                                                            }
                                                                            className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand"
                                                                        >
                                                                            + Add length row
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                refreshBillingPairs(idx)
                                                                            }
                                                                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                                                        >
                                                                            Refresh rows
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {isArea && (
                                                            <tr className="bg-sky-50/50">
                                                                <td colSpan={4} className="px-4 py-4">
                                                                    <GlassAreaBillingPanel
                                                                        pairs={pairs}
                                                                        onUpdatePair={(
                                                                            pairIdx,
                                                                            field,
                                                                            raw,
                                                                        ) =>
                                                                            updateBillingPairRow(
                                                                                idx,
                                                                                pairIdx,
                                                                                field,
                                                                                raw,
                                                                            )
                                                                        }
                                                                        onAddRow={() =>
                                                                            addBillingPairRowToItem(idx)
                                                                        }
                                                                        onRemoveRow={(pairIdx) =>
                                                                            removeBillingPairRowFromItem(
                                                                                idx,
                                                                                pairIdx,
                                                                            )
                                                                        }
                                                                        onRefresh={() =>
                                                                            refreshBillingPairs(idx)
                                                                        }
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link
                                href={route('stock-transfers.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
