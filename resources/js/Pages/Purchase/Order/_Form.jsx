import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
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
import { formatVariantAttributes, variantFullLabel } from '@/lib/variantLabel';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

const inputClass =
    'mt-2 block h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';
const comboboxWrapClass = 'relative mt-2 rounded-lg border border-gray-300 bg-white';
const comboboxInputClass =
    'block w-full rounded-lg border-0 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20';

const DEFAULT_LENGTH_ROW_COUNT = DEFAULT_BILLING_ROW_COUNT;

/** @param {Record<string, unknown>} it */
function withUnitCostAsPrice(it) {
    return { ...it, unit_price: it.unit_cost };
}

/** @param {Record<string, unknown>} it */
function withUnitCostFromPrice(it) {
    const { unit_price, ...rest } = it;
    return { ...rest, unit_cost: unit_price };
}

/** @param {Record<string, unknown>} draft */
function syncPurchaseBillingTotals(draft) {
    const mode = draft.billing_mode ?? 'quantity';
    if (!['length_ft', 'area_sqft'].includes(mode)) {
        return draft;
    }
    return withUnitCostFromPrice(syncBillingTotals(withUnitCostAsPrice(draft)));
}

/** @param {unknown} raw */
export function purchaseLengthPairsForForm(raw) {
    const rows = Array.isArray(raw) ? raw : [];
    const mapped = rows.map((r) => ({
        length: r?.length != null && r?.length !== '' ? String(r.length) : '',
        qty: r?.qty != null && r?.qty !== '' ? String(r.qty) : '',
    }));
    const minRows = Math.max(DEFAULT_LENGTH_ROW_COUNT, mapped.length + 1);
    while (mapped.length < minRows) {
        mapped.push({ length: '', qty: '' });
    }
    return mapped;
}

/** @param {unknown} raw */
export function purchaseAreaPairsForForm(raw) {
    const rows = Array.isArray(raw) ? raw : [];
    const mapped = rows.map((r) => ({
        width: r?.width != null && r?.width !== '' ? String(r.width) : '',
        height: r?.height != null && r?.height !== '' ? String(r.height) : '',
        qty: r?.qty != null && r?.qty !== '' ? String(r.qty) : '',
    }));
    const minRows = Math.max(DEFAULT_LENGTH_ROW_COUNT, mapped.length + 1);
    while (mapped.length < minRows) {
        mapped.push({ width: '', height: '', qty: '' });
    }
    return mapped;
}

function pairsForItem(it) {
    const mode = it.billing_mode ?? 'quantity';
    const rows = Array.isArray(it?.length_pairs) ? it.length_pairs : [];
    if (rows.length === 0) {
        return mode === 'area_sqft'
            ? emptyAreaPairs(DEFAULT_LENGTH_ROW_COUNT)
            : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
    }
    if (mode === 'area_sqft') {
        return rows.map((r) => ({
            width: r?.width != null && r?.width !== '' ? String(r.width) : '',
            height: r?.height != null && r?.height !== '' ? String(r.height) : '',
            qty: r?.qty != null && r?.qty !== '' ? String(r.qty) : '',
        }));
    }
    return rows.map((r) => ({
        length: r?.length != null && r?.length !== '' ? String(r.length) : '',
        qty: r?.qty != null && r?.qty !== '' ? String(r.qty) : '',
    }));
}

function buildVariantOptions(variants, productId) {
    if (!productId) return [];
    return (variants ?? []).filter((v) => String(v.product_id) === String(productId));
}

export default function PurchaseOrderForm({
    suppliers,
    branches,
    warehouses,
    products,
    variants,
    data,
    setData,
    errors,
    onSubmit,
    submitLabel,
    processing,
    showReceivedQty = false,
}) {
    const { csrf_token: csrfFromPage } = usePage().props;

    const [supplierOptions, setSupplierOptions] = useState(() => [...(suppliers ?? [])]);

    useEffect(() => {
        setSupplierOptions([...(suppliers ?? [])]);
    }, [suppliers]);

    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [supplierCreateName, setSupplierCreateName] = useState('');
    const [supplierCreateCode, setSupplierCreateCode] = useState('');
    const [supplierCreatePhone, setSupplierCreatePhone] = useState('');
    const [supplierCreateEmail, setSupplierCreateEmail] = useState('');
    const [supplierCreateBusy, setSupplierCreateBusy] = useState(false);
    const [supplierCreateError, setSupplierCreateError] = useState('');

    const closeSupplierModal = () => {
        setSupplierModalOpen(false);
        setSupplierCreateName('');
        setSupplierCreateCode('');
        setSupplierCreatePhone('');
        setSupplierCreateEmail('');
        setSupplierCreateError('');
    };

    const csrfToken = () =>
        (typeof csrfFromPage === 'string' && csrfFromPage) ||
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        '';

    const createSupplierInline = async () => {
        const name = String(supplierCreateName ?? '').trim();
        if (!name) {
            setSupplierCreateError('Supplier name is required.');
            return;
        }
        setSupplierCreateBusy(true);
        setSupplierCreateError('');
        try {
            const token = csrfToken();
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const payload = {
                name,
                phone: String(supplierCreatePhone ?? '').trim() || null,
                email: String(supplierCreateEmail ?? '').trim() || null,
            };
            const codeTrim = String(supplierCreateCode ?? '').trim();
            if (codeTrim) {
                payload.code = codeTrim;
            }
            const res = await fetch(route('suppliers.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const firstValidation =
                    json?.errors && typeof json.errors === 'object'
                        ? Object.values(json.errors).flat()?.[0]
                        : null;
                throw new Error(
                    firstValidation || json?.message || `Failed to create supplier (${res.status}).`,
                );
            }
            const created = json?.supplier;
            if (!created?.id) {
                throw new Error('Invalid supplier response.');
            }
            setSupplierOptions((prev) =>
                [...(prev ?? []), { id: created.id, name: created.name }].sort((a, b) =>
                    String(a.name ?? '').localeCompare(String(b.name ?? '')),
                ),
            );
            setData('supplier_id', String(created.id));
            closeSupplierModal();
        } catch (err) {
            setSupplierCreateError(err?.message || 'Failed to create supplier.');
        } finally {
            setSupplierCreateBusy(false);
        }
    };

    const whByBranch = useMemo(() => {
        const m = new Map();
        (warehouses ?? []).forEach((w) => {
            const bid = String(w.branch_id ?? '');
            if (!m.has(bid)) m.set(bid, []);
            m.get(bid).push(w);
        });
        return m;
    }, [warehouses]);

    const availableWarehouses = whByBranch.get(String(data.branch_id ?? '')) ?? warehouses ?? [];

    const [selectedProduct, setSelectedProduct] = useState('');
    const [productAddSearch, setProductAddSearch] = useState('');
    const [productAddFieldFocused, setProductAddFieldFocused] = useState(false);

    const selectedProductForAdd = useMemo(
        () =>
            (products ?? []).find((p) => String(p.id) === String(selectedProduct)) ?? null,
        [products, selectedProduct],
    );

    const filteredProductsForAdd = useMemo(() => {
        const q = String(productAddSearch ?? '').trim().toLowerCase();
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
    }, [products, productAddSearch]);

    const clearProductForAdd = () => {
        setSelectedProduct('');
        setProductAddSearch('');
        setProductAddFieldFocused(false);
    };

    const qtyTableColumnHeader = useMemo(() => {
        const items = data.items ?? [];
        if (items.length === 0) return 'Qty';
        if (items.every((it) => (it.billing_mode ?? 'quantity') === 'length_ft')) {
            return 'Length Qty';
        }
        if (items.every((it) => (it.billing_mode ?? 'quantity') === 'area_sqft')) {
            return 'Sq Ft';
        }
        return 'Qty';
    }, [data.items]);

    const updateBillingPairRow = (idx, pairIdx, field, raw) => {
        setData(
            'items',
            data.items.map((it, i) =>
                i === idx
                    ? withUnitCostFromPrice(
                          updateBillingPair(withUnitCostAsPrice(it), pairIdx, field, raw),
                      )
                    : it,
            ),
        );
    };

    const togglePurchaseBillingMode = (idx, targetMode, checked) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) return it;
                if (!checked) {
                    return withUnitCostFromPrice(
                        setBillingMode(withUnitCostAsPrice(it), 'quantity'),
                    );
                }
                return withUnitCostFromPrice(
                    setBillingMode(withUnitCostAsPrice(it), targetMode),
                );
            }),
        );
    };

    const addBillingPairRowToItem = (idx) => {
        setData(
            'items',
            data.items.map((it, i) =>
                i === idx
                    ? withUnitCostFromPrice(addBillingPairRow(withUnitCostAsPrice(it)))
                    : it,
            ),
        );
    };

    const removeBillingPairRowFromItem = (idx, pairIdx) => {
        setData(
            'items',
            data.items.map((it, i) =>
                i === idx
                    ? withUnitCostFromPrice(
                          removeBillingPairRow(withUnitCostAsPrice(it), pairIdx),
                      )
                    : it,
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
                        ? emptyAreaPairs(DEFAULT_LENGTH_ROW_COUNT)
                        : emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT);
                return syncPurchaseBillingTotals({ ...it, length_pairs: empty });
            }),
        );
    };

    const updateItem = (idx, patch) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) return it;
                let next = { ...it, ...patch };
                if (['length_ft', 'area_sqft'].includes(next.billing_mode ?? 'quantity')) {
                    next = syncPurchaseBillingTotals(next);
                }
                return next;
            }),
        );
    };

    const addItem = () => {
        if (!selectedProduct) return;
        const productRow =
            (products ?? []).find((p) => String(p.id) === String(selectedProduct)) ?? null;
        const productVariants = productRow?.variants ?? [];
        const defaultVariantId =
            productRow?.type === 'variable' || productVariants.length !== 1
                ? ''
                : String(productVariants[0].id);

        setData('items', [
            ...(data.items ?? []),
            {
                product_id: Number(selectedProduct),
                product_variant_id: defaultVariantId,
                billing_mode: 'quantity',
                length_pairs: emptyLengthPairs(DEFAULT_LENGTH_ROW_COUNT),
                rate_per_ft: '',
                rate_per_sqft: '',
                quantity: 1,
                received_quantity: showReceivedQty ? 0 : 0,
                unit_cost: 0,
                discount: 0,
                tax_rate: 0,
            },
        ]);
        clearProductForAdd();
    };

    const removeItem = (idx) => {
        setData(
            'items',
            (data.items ?? []).filter((_, i) => i !== idx),
        );
    };

    return (
        <>
            <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0 lg:col-span-2">
                    <div className="flex items-start justify-between gap-3">
                        <label className={`${labelClass} pt-0.5`}>Supplier *</label>
                        <button
                            type="button"
                            onClick={() => {
                                setSupplierCreateError('');
                                setSupplierModalOpen(true);
                            }}
                            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm ring-1 ring-brand/20 transition hover:bg-brand-dark"
                            title="Add new supplier"
                        >
                            + New
                        </button>
                    </div>
                    <select
                        value={data.supplier_id ?? ''}
                        onChange={(e) => setData('supplier_id', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Select</option>
                        {(supplierOptions ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    {errors?.supplier_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                    )}
                </div>

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
                    <label className={labelClass}>Order # *</label>
                    <input
                        value={data.order_number ?? ''}
                        onChange={(e) => setData('order_number', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. INV-PO-20260430-1234"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Uses your invoice prefix from Settings as a starting pattern (same branch uniqueness rule).
                    </p>
                    {errors?.order_number && <p className="mt-1 text-sm text-red-600">{errors.order_number}</p>}
                </div>

                <div>
                    <label className={labelClass}>Order date *</label>
                    <input
                        type="date"
                        value={data.order_date ?? ''}
                        onChange={(e) => setData('order_date', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.order_date && <p className="mt-1 text-sm text-red-600">{errors.order_date}</p>}
                </div>

                <div>
                    <label className={labelClass}>Expected date</label>
                    <input
                        type="date"
                        value={data.expected_date ?? ''}
                        onChange={(e) => setData('expected_date', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.expected_date && <p className="mt-1 text-sm text-red-600">{errors.expected_date}</p>}
                </div>

                <div>
                    <label className={labelClass}>Shipping</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.shipping_cost ?? 0}
                        onChange={(e) => setData('shipping_cost', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.shipping_cost && <p className="mt-1 text-sm text-red-600">{errors.shipping_cost}</p>}
                </div>

                <div>
                    <label className={labelClass}>Order discount</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.discount_amount ?? 0}
                        onChange={(e) => setData('discount_amount', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.discount_amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.discount_amount}</p>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Paid on order</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.paid_amount ?? 0}
                        onChange={(e) => setData('paid_amount', e.target.value)}
                        className={inputClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional advance to supplier (tracking only).</p>
                    {errors?.paid_amount && <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>}
                </div>
            </div>

            <div>
                <label className={labelClass}>Notes</label>
                <textarea
                    value={data.notes ?? ''}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={2}
                    className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors?.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Line items</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Goods receipt updates stock via purchase invoices. Here you can track ordered vs received
                            quantities after the order is marked sent.
                        </p>
                    </div>
                    <div className="flex w-full min-w-[min(100%,20rem)] max-w-xl flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="po_add_product" className={labelClass}>
                                Add product
                            </label>
                            {selectedProduct ? (
                                <button
                                    type="button"
                                    onClick={clearProductForAdd}
                                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                                >
                                    Clear
                                </button>
                            ) : null}
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="relative min-w-0 flex-1 rounded-lg border border-gray-300 bg-white">
                                <input
                                    id="po_add_product"
                                    type="text"
                                    autoComplete="off"
                                    className={comboboxInputClass}
                                    placeholder="Search product…"
                                    value={
                                        productAddFieldFocused
                                            ? productAddSearch
                                            : (selectedProductForAdd?.name ?? '')
                                    }
                                    onChange={(e) => setProductAddSearch(e.target.value)}
                                    onFocus={() => {
                                        setProductAddFieldFocused(true);
                                        setProductAddSearch(selectedProductForAdd?.name ?? '');
                                    }}
                                    onBlur={(e) => {
                                        const raw = e.target.value;
                                        window.setTimeout(() => {
                                            setProductAddFieldFocused(false);
                                            if (String(raw).trim() === '' && selectedProduct) {
                                                clearProductForAdd();
                                            } else {
                                                setProductAddSearch('');
                                            }
                                        }, 200);
                                    }}
                                />
                                {String(productAddSearch ?? '').trim() !== '' && (
                                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                        {selectedProduct ? (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={clearProductForAdd}
                                                className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                            >
                                                Clear selection
                                            </button>
                                        ) : null}
                                        {filteredProductsForAdd.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-gray-400">
                                                No product found
                                            </div>
                                        ) : (
                                            filteredProductsForAdd.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setSelectedProduct(String(p.id));
                                                        setProductAddSearch('');
                                                        setProductAddFieldFocused(false);
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
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex h-10 shrink-0 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                            >
                                Add line
                            </button>
                        </div>
                    </div>
                </div>

                {errors?.items && typeof errors.items === 'string' && (
                    <p className="mt-3 text-sm text-red-600">{errors.items}</p>
                )}

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Product</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Variant</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                    {qtyTableColumnHeader}
                                </th>
                                {showReceivedQty ? (
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">Received</th>
                                ) : null}
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Unit cost</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Line disc.</th>
                                <th className="px-3 py-2 text-start font-semibold text-gray-700">Tax %</th>
                                <th className="px-3 py-2 text-end font-semibold text-gray-700">Remove</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {(data.items ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={showReceivedQty ? 8 : 7}
                                        className="px-3 py-6 text-center text-gray-500"
                                    >
                                        Add at least one product line.
                                    </td>
                                </tr>
                            ) : (
                                (data.items ?? []).map((it, idx) => {
                                    const vOpts = buildVariantOptions(variants, it.product_id);
                                    const billingMode = it.billing_mode ?? 'quantity';
                                    const isLength = billingMode === 'length_ft';
                                    const isArea = billingMode === 'area_sqft';
                                    const pairs = pairsForItem(it);
                                    const lenAmt = computeLengthLineAmounts({
                                        ...it,
                                        unit_price: it.unit_cost,
                                        length_pairs: pairs,
                                        discount_percent: 0,
                                    });
                                    const areaAmt = computeAreaLineAmounts({
                                        ...it,
                                        unit_cost: it.unit_cost,
                                        length_pairs: pairs,
                                    });

                                    return (
                                        <Fragment key={idx}>
                                            <tr className="hover:bg-gray-50/70 align-top">
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={it.product_id ?? ''}
                                                        onChange={(e) =>
                                                            updateItem(idx, {
                                                                product_id: Number(e.target.value),
                                                                product_variant_id: '',
                                                            })
                                                        }
                                                        className="h-10 max-w-xs rounded-lg border border-gray-300 px-2 text-sm"
                                                    >
                                                        {(products ?? []).map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <label className="mt-2 flex cursor-pointer items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isLength}
                                                            onChange={(e) =>
                                                                togglePurchaseBillingMode(
                                                                    idx,
                                                                    'length_ft',
                                                                    e.target.checked,
                                                                )
                                                            }
                                                            className="rounded border-gray-300 text-brand focus:ring-brand"
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            Length (ft) billing
                                                        </span>
                                                    </label>
                                                    <label className="mt-1 flex cursor-pointer items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isArea}
                                                            onChange={(e) =>
                                                                togglePurchaseBillingMode(
                                                                    idx,
                                                                    'area_sqft',
                                                                    e.target.checked,
                                                                )
                                                            }
                                                            className="rounded border-gray-300 text-brand focus:ring-brand"
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            Glass area (sq ft)
                                                        </span>
                                                    </label>
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
                                                            })
                                                        }
                                                        className="h-10 w-36 rounded-lg border border-gray-300 px-2 text-sm"
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
                                                    {isLength ? (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Total FT</p>
                                                            <p className="font-mono text-sm font-semibold text-gray-900">
                                                                {lenAmt.totalFt.toFixed(4)}
                                                            </p>
                                                        </div>
                                                    ) : isArea ? (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Total sq ft</p>
                                                            <p className="font-mono text-sm font-semibold text-gray-900">
                                                                {areaAmt.totalSqFt.toFixed(4)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            min="0.0001"
                                                            value={it.quantity ?? 1}
                                                            onChange={(e) =>
                                                                updateItem(idx, { quantity: e.target.value })
                                                            }
                                                            className="h-10 w-24 rounded-lg border border-gray-300 px-2"
                                                        />
                                                    )}
                                                </td>
                                                {showReceivedQty ? (
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            min="0"
                                                            value={
                                                                it.received_quantity !== '' &&
                                                                it.received_quantity != null
                                                                    ? it.received_quantity
                                                                    : 0
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(idx, {
                                                                    received_quantity: e.target.value,
                                                                })
                                                            }
                                                            className="h-10 w-24 rounded-lg border border-gray-300 px-2"
                                                        />
                                                        {errors?.[`items.${idx}.received_quantity`] && (
                                                            <p className="mt-1 text-xs text-red-600">
                                                                {errors[`items.${idx}.received_quantity`]}
                                                            </p>
                                                        )}
                                                    </td>
                                                ) : null}
                                                <td className="px-3 py-2">
                                                    {isLength ? (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Cost / ft</p>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={
                                                                    it.rate_per_ft !== '' &&
                                                                    it.rate_per_ft != null
                                                                        ? it.rate_per_ft
                                                                        : it.unit_cost ?? ''
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(idx, {
                                                                        rate_per_ft: e.target.value,
                                                                    })
                                                                }
                                                                className="h-10 w-24 rounded-lg border border-gray-300 px-2"
                                                            />
                                                        </div>
                                                    ) : isArea ? (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Cost / sq ft</p>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={
                                                                    it.rate_per_sqft !== '' &&
                                                                    it.rate_per_sqft != null
                                                                        ? it.rate_per_sqft
                                                                        : it.unit_cost ?? ''
                                                                }
                                                                onChange={(e) =>
                                                                    updateItem(idx, {
                                                                        rate_per_sqft: e.target.value,
                                                                    })
                                                                }
                                                                className="h-10 w-24 rounded-lg border border-gray-300 px-2"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={it.unit_cost ?? 0}
                                                            onChange={(e) =>
                                                                updateItem(idx, { unit_cost: e.target.value })
                                                            }
                                                            className="h-10 w-24 rounded-lg border border-gray-300 px-2"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={it.discount ?? 0}
                                                        onChange={(e) =>
                                                            updateItem(idx, { discount: e.target.value })
                                                        }
                                                        className="h-10 w-20 rounded-lg border border-gray-300 px-2"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        value={it.tax_rate ?? 0}
                                                        onChange={(e) =>
                                                            updateItem(idx, { tax_rate: e.target.value })
                                                        }
                                                        className="h-10 w-16 rounded-lg border border-gray-300 px-2"
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
                                            {isArea && (
                                                <tr className="bg-sky-50/50">
                                                    <td
                                                        colSpan={showReceivedQty ? 8 : 7}
                                                        className="px-3 py-3 text-sm text-gray-800"
                                                    >
                                                        <GlassAreaBillingPanel
                                                            pairs={pairs}
                                                            onUpdatePair={(pairIdx, field, raw) =>
                                                                updateBillingPairRow(
                                                                    idx,
                                                                    pairIdx,
                                                                    field,
                                                                    raw,
                                                                )
                                                            }
                                                            onAddRow={() => addBillingPairRowToItem(idx)}
                                                            onRemoveRow={(pairIdx) =>
                                                                removeBillingPairRowFromItem(idx, pairIdx)
                                                            }
                                                            onRefresh={() => refreshBillingPairs(idx)}
                                                        />
                                                        <div className="mt-3 flex flex-wrap items-end gap-4 border-t border-gray-200 pt-3">
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-600">
                                                                    Total sq ft (order qty)
                                                                </p>
                                                                <p className="font-mono text-sm font-semibold text-gray-900">
                                                                    {areaAmt.totalSqFt.toFixed(4)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {isLength && (
                                                <tr className="bg-gray-50/70">
                                                    <td
                                                        colSpan={showReceivedQty ? 8 : 7}
                                                        className="px-3 py-3 text-sm text-gray-800"
                                                    >
                                                        <p className="text-xs font-medium text-gray-500">
                                                            Length × qty rows
                                                        </p>
                                                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                            {pairs.map((row, pairIdx) => {
                                                                const lineFt =
                                                                    Number(row.length || 0) *
                                                                    Number(row.qty || 0);
                                                                return (
                                                                    <div
                                                                        key={`${idx}-pair-${pairIdx}`}
                                                                        className="rounded border border-gray-200 bg-white px-2 py-2"
                                                                    >
                                                                        <div className="flex flex-wrap items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                step="0.0001"
                                                                                min="0"
                                                                                placeholder="Length"
                                                                                value={row.length}
                                                                                onChange={(e) =>
                                                                                    updateBillingPairRow(
                                                                                        idx,
                                                                                        pairIdx,
                                                                                        'length',
                                                                                        e.target.value,
                                                                                    )
                                                                                }
                                                                                className="w-20 rounded border border-gray-300 px-1 py-1 text-sm"
                                                                            />
                                                                            <span className="text-gray-400">
                                                                                ×
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                step="0.0001"
                                                                                min="0"
                                                                                placeholder="Qty"
                                                                                value={row.qty}
                                                                                onChange={(e) =>
                                                                                    updateBillingPairRow(
                                                                                        idx,
                                                                                        pairIdx,
                                                                                        'qty',
                                                                                        e.target.value,
                                                                                    )
                                                                                }
                                                                                className="w-20 rounded border border-gray-300 px-1 py-1 text-sm"
                                                                            />
                                                                            {pairs.length > 1 ? (
                                                                                <button
                                                                                    type="button"
                                                                                    title="Remove row"
                                                                                    className="shrink-0 rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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
                                                                            = {lineFt.toFixed(4)} ft
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-t border-gray-200 pt-3">
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-600">
                                                                    Total FT (order qty)
                                                                </p>
                                                                <p className="font-mono text-sm font-semibold text-gray-900">
                                                                    {lenAmt.totalFt.toFixed(4)}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10"
                                                                    onClick={() => addBillingPairRowToItem(idx)}
                                                                >
                                                                    + Add length row
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                                                    onClick={() => refreshBillingPairs(idx)}
                                                                >
                                                                    Refresh rows
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
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

            <Modal show={supplierModalOpen} onClose={closeSupplierModal} maxWidth="md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">New supplier</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Create a supplier without leaving this page. Code left blank uses an auto-generated value.
                    </p>
                </div>
                <div className="px-6 py-5">
                    <InputLabel htmlFor="po_quick_supplier_name" value="Name *" />
                    <TextInput
                        id="po_quick_supplier_name"
                        className="mt-2 block w-full"
                        value={supplierCreateName}
                        onChange={(e) => setSupplierCreateName(e.target.value)}
                        placeholder="Supplier name"
                        autoFocus
                    />
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="po_quick_supplier_code" value="Code (optional)" />
                            <TextInput
                                id="po_quick_supplier_code"
                                className="mt-2 block w-full"
                                value={supplierCreateCode}
                                onChange={(e) => setSupplierCreateCode(e.target.value)}
                                placeholder="Leave blank for auto code"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="po_quick_supplier_phone" value="Phone" />
                            <TextInput
                                id="po_quick_supplier_phone"
                                className="mt-2 block w-full"
                                value={supplierCreatePhone}
                                onChange={(e) => setSupplierCreatePhone(e.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="po_quick_supplier_email" value="Email" />
                            <TextInput
                                id="po_quick_supplier_email"
                                type="email"
                                className="mt-2 block w-full"
                                value={supplierCreateEmail}
                                onChange={(e) => setSupplierCreateEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    {supplierCreateError && (
                        <p className="mt-3 text-xs text-red-600">{supplierCreateError}</p>
                    )}
                    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeSupplierModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            type="button"
                            disabled={supplierCreateBusy}
                            className="bg-brand hover:bg-brand-dark"
                            onClick={createSupplierInline}
                        >
                            {supplierCreateBusy ? 'Creating...' : 'Create'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </>
    );
}
