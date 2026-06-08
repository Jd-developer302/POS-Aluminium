import React, { useMemo, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StockAvailabilityModal from '@/Components/StockAvailabilityModal';
import GlassAreaBillingPanel from '@/Components/GlassAreaBillingPanel';
import { useStockAvailability } from '@/hooks/useStockAvailability';
import { transformSaleQuotationItemForSubmit } from '@/lib/billingItemSubmit';
import {
    addBillingPairRow,
    applyVariantPrice,
    DEFAULT_BILLING_ROW_COUNT,
    emptyAreaPairs,
    emptyLengthPairs,
    removeBillingPairRow,
    setBillingMode,
    syncBillingTotals,
    updateBillingPair,
} from '@/lib/billingLineItemState';
import { computeAreaLineAmounts } from '@/lib/glassAreaBilling';
import { computeLengthLineAmounts, lineNetBeforeTax } from '@/lib/saleLengthBilling';
import { formatVariantAttributes, variantFullLabel } from '@/lib/variantLabel';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

const inputClassInline =
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

const labelClass = 'block text-sm font-semibold text-gray-700';

const customerComboboxWrapClass = 'relative mt-2 rounded-md border border-gray-300 bg-white';
const customerComboboxInputClass =
    'block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500';

/** Simple products: same default price as first active variant (product list order). Variable products keep 0 until a variant is chosen. */
function defaultUnitPriceForProduct(product) {
    if (!product || product.type !== 'simple') return 0;
    const v0 = product.variants?.[0];
    const sp = Number(v0?.selling_price);
    return Number.isFinite(sp) ? sp : 0;
}

function buildItem(productId, product) {
    const unitPrice = defaultUnitPriceForProduct(product);
    const variants = product?.variants ?? [];
    const defaultVariantId =
        product?.type === 'variable' || variants.length !== 1 ? null : Number(variants[0].id);
    return {
        product_id: productId ? Number(productId) : '',
        product_variant_id: defaultVariantId,
        billing_mode: 'quantity',
        length_pairs: emptyLengthPairs(),
        rate_per_ft: '',
        rate_per_sqft: '',
        discount_percent: '0',
        quantity: 1,
        unit_price: unitPrice,
    };
}

/** @param {unknown} value */
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

function formatQuickCustomerError(json) {
    if (!json || typeof json !== 'object') return 'Unable to create customer.';
    if (typeof json.message === 'string' && json.message) return json.message;
    if (json.errors && typeof json.errors === 'object') {
        const parts = Object.values(json.errors).flat();
        const msg = parts.filter((p) => typeof p === 'string').join(' ');
        if (msg) return msg;
    }
    return 'Unable to create customer.';
}

export default function Create({ branches, warehouses, customers = [], products, invoice_prefix = 'INV' }) {
    const productList = products ?? [];
    const { flash, auth, csrf_token: csrfFromPage } = usePage().props;
    const perms = asStringList(auth?.user?.permissions);
    const canQuickCreateCustomer =
        !perms.length || perms.includes('customers.create');

    const [customerOptions, setCustomerOptions] = useState(() => [...(customers ?? [])]);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerFieldFocused, setCustomerFieldFocused] = useState(false);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickCode, setQuickCode] = useState('');
    const [quickPhone, setQuickPhone] = useState('');
    const [quickEmail, setQuickEmail] = useState('');
    const [quickError, setQuickError] = useState('');
    const [quickBusy, setQuickBusy] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState('');
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const stockAvailability = useStockAvailability();

    const selectedProductObj = useMemo(
        () => productList.find((p) => String(p.id) === String(selectedProduct)) ?? null,
        [productList, selectedProduct],
    );

    const filteredProductsForPicker = useMemo(() => {
        const q = String(productSearchQuery ?? '').trim().toLowerCase();
        if (!q) return productList;
        return productList.filter((p) => {
            if (String(p.name ?? '')
                .toLowerCase()
                .includes(q)) {
                return true;
            }
            return (p.variants ?? []).some((v) => {
                const sku = String(v.sku ?? '').toLowerCase();
                const name = String(v.name ?? '').toLowerCase();
                const attrs = formatVariantAttributes(v).toLowerCase();
                return sku.includes(q) || name.includes(q) || attrs.includes(q);
            });
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

    const { data, setData, post, errors, processing, transform } = useForm({
        branch_id: branches?.[0]?.id ?? '',
        warehouse_id: '',
        customer_id: '',
        sale_date: new Date().toISOString().slice(0, 16),
        status: 'draft',
        notes: '',
        items: [],
    });

    const availableWarehouses = whByBranch.get(String(data.branch_id)) ?? [];

    const selectedCustomerId = String(data.customer_id ?? '');
    const selectedCustomerRow = useMemo(
        () => (customerOptions ?? []).find((c) => String(c.id) === selectedCustomerId) ?? null,
        [customerOptions, selectedCustomerId],
    );

    const filteredCustomersForPicker = useMemo(() => {
        const q = String(customerSearchQuery ?? '').trim().toLowerCase();
        const list = customerOptions ?? [];
        if (!q) return list;
        return list.filter((c) => {
            const name = String(c?.name ?? '').toLowerCase();
            const code = String(c?.code ?? '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [customerOptions, customerSearchQuery]);

    const clearCustomerSelection = () => {
        setData('customer_id', '');
        setCustomerSearchQuery('');
        setCustomerFieldFocused(false);
    };

    /** Table header: "Length Qty" when every line uses length (ft) billing; otherwise "Qty". */
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

    const addItem = async () => {
        if (!selectedProduct) return;
        const prod = productList.find((p) => String(p.id) === String(selectedProduct));
        const newItem = buildItem(selectedProduct, prod);
        setData('items', [...data.items, newItem]);
        setSelectedProduct('');
        setProductSearchQuery('');
        await stockAvailability.showForProduct({
            warehouseId: data.warehouse_id,
            productId: newItem.product_id,
            variantId: newItem.product_variant_id,
            productName: prod?.name ?? 'Product',
        });
    };

    const removeItem = (idx) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== idx),
        );
    };

    const updateItem = (idx, key, value) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) {
                    return it;
                }
                let next = { ...it, [key]: value };
                if (key === 'product_variant_id') {
                    const prod = productList.find((p) => p.id === Number(it.product_id));
                    const v = prod?.variants?.find(
                        (x) => String(x.id) === String(value),
                    );
                    if (v != null) {
                        next = applyVariantPrice(next, v.selling_price);
                    }
                }
                if (['length_ft', 'area_sqft'].includes(next.billing_mode ?? 'quantity')) {
                    next = syncBillingTotals(next);
                }
                return next;
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

    const toggleBillingMode = (idx, targetMode, checked) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) {
                    return it;
                }
                if (!checked) {
                    return setBillingMode(it, 'quantity');
                }
                return setBillingMode(it, targetMode);
            }),
        );
    };

    const refreshBillingPairs = (idx) => {
        setData(
            'items',
            data.items.map((it, i) => {
                if (i !== idx) {
                    return it;
                }
                const mode = it.billing_mode ?? 'quantity';
                const empty =
                    mode === 'area_sqft'
                        ? emptyAreaPairs(DEFAULT_BILLING_ROW_COUNT)
                        : emptyLengthPairs(DEFAULT_BILLING_ROW_COUNT);
                return syncBillingTotals({ ...it, length_pairs: empty });
            }),
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

    const { subtotal, taxTotal, total } = useMemo(() => {
        let sub = 0;
        let tax = 0;
        for (const it of data.items ?? []) {
            const line = lineNetBeforeTax(it);
            sub += line;
            const prod = productList.find((x) => x.id === Number(it.product_id));
            const rate = Number(prod?.tax_percentage ?? 0);
            tax += line * (rate / 100);
        }
        return {
            subtotal: sub,
            taxTotal: tax,
            total: sub + tax,
        };
    }, [data.items, productList]);

    const onSubmit = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: (form.items ?? []).map((it) =>
                transformSaleQuotationItemForSubmit(it),
            ),
        }));
        post(route('sales.store'));
    };

    const openCustomerModal = () => {
        setQuickName('');
        setQuickCode('');
        setQuickPhone('');
        setQuickEmail('');
        setQuickError('');
        setCustomerModalOpen(true);
    };

    const closeCustomerModal = () => {
        if (!quickBusy) setCustomerModalOpen(false);
    };

    const createCustomerInline = async () => {
        const name = String(quickName ?? '').trim();
        if (!name) {
            setQuickError('Name is required.');
            return;
        }
        setQuickBusy(true);
        setQuickError('');
        try {
            const token =
                (typeof csrfFromPage === 'string' && csrfFromPage) ||
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                '';
            if (!token) {
                throw new Error('Security token missing. Refresh the page and try again.');
            }
            const body = {
                name,
                phone: String(quickPhone ?? '').trim() || null,
                email: String(quickEmail ?? '').trim() || null,
            };
            const codeTrim = String(quickCode ?? '').trim();
            if (codeTrim) body.code = codeTrim;

            const res = await fetch(route('customers.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': token,
                },
                credentials: 'same-origin',
                body: JSON.stringify(body),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(formatQuickCustomerError(json));
            }
            const created = json?.customer;
            if (!created?.id) {
                throw new Error('Invalid response from server.');
            }
            setCustomerOptions((prev) => {
                if (prev.some((c) => c.id === created.id)) return prev;
                return [...prev, created];
            });
            setData('customer_id', String(created.id));
            setCustomerModalOpen(false);
        } catch (err) {
            setQuickError(err?.message || 'Failed to create customer.');
        } finally {
            setQuickBusy(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-2xl font-bold text-gray-900">Create Sale</h1>}
        >
            <Head title="Create Sale" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <form onSubmit={onSubmit} className="space-y-6 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className={labelClass}>Branch</label>
                                <select
                                    value={data.branch_id}
                                    onChange={(e) => {
                                        setData('branch_id', e.target.value);
                                        setData('warehouse_id', '');
                                    }}
                                    className={inputClass}
                                >
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Warehouse</label>
                                <select
                                    value={data.warehouse_id}
                                    onChange={(e) => setData('warehouse_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select warehouse</option>
                                    {availableWarehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.warehouse_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Sale Date</label>
                                <input
                                    type="datetime-local"
                                    value={data.sale_date}
                                    onChange={(e) => setData('sale_date', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.sale_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.sale_date}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Sale / invoice number</label>
                                <input
                                    readOnly
                                    value={`${invoice_prefix}-…`}
                                    title="Generated when you save, using Invoice prefix from Settings"
                                    className={`${inputClass} cursor-default bg-gray-50 font-mono text-sm text-gray-700`}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Prefix{' '}
                                    <span className="font-semibold text-gray-700">
                                        {invoice_prefix}
                                    </span>{' '}
                                    comes from Settings → Invoice. The full number is created
                                    automatically on save.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className={labelClass}>Customer</label>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                    <div className="min-h-[42px] sm:min-w-0 sm:flex-1">
                                        <div className={customerComboboxWrapClass}>
                                            <div className="flex items-stretch">
                                                <input
                                                    type="text"
                                                    autoComplete="off"
                                                    className={customerComboboxInputClass}
                                                    placeholder="Search customer..."
                                                    value={
                                                        String(customerSearchQuery ?? '').trim() !== ''
                                                            ? customerSearchQuery
                                                            : selectedCustomerRow?.name ?? ''
                                                    }
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        setCustomerSearchQuery(v);
                                                        if (v.trim() === '') {
                                                            setData('customer_id', '');
                                                        } else if (
                                                            selectedCustomerRow &&
                                                            v.trim() !== String(selectedCustomerRow.name ?? '').trim()
                                                        ) {
                                                            setData('customer_id', '');
                                                        }
                                                    }}
                                                    onFocus={() => setCustomerFieldFocused(true)}
                                                />
                                                {(selectedCustomerId ||
                                                    String(customerSearchQuery ?? '').trim() !== '') && (
                                                    <button
                                                        type="button"
                                                        title="Clear"
                                                        onClick={clearCustomerSelection}
                                                        className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                                                        aria-label="Clear customer"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>

                                            {(customerFieldFocused ||
                                                String(customerSearchQuery ?? '').trim() !== '') && (
                                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    <button
                                                        type="button"
                                                        onMouseDown={(ev) => ev.preventDefault()}
                                                        onClick={clearCustomerSelection}
                                                        className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Walk-in (no customer)
                                                    </button>
                                                    {filteredCustomersForPicker.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                            No customer found
                                                        </div>
                                                    ) : (
                                                        filteredCustomersForPicker.map((c) => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onMouseDown={(ev) => ev.preventDefault()}
                                                                onClick={() => {
                                                                    setData('customer_id', String(c.id));
                                                                    setCustomerSearchQuery('');
                                                                    setCustomerFieldFocused(false);
                                                                }}
                                                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <span className="font-medium">{c.name}</span>
                                                                {c.code ? (
                                                                    <span className="ms-2 text-xs text-gray-500">
                                                                        {c.code}
                                                                    </span>
                                                                ) : null}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {canQuickCreateCustomer && (
                                        <button
                                            type="button"
                                            onClick={openCustomerModal}
                                            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-brand bg-white px-3 py-2 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand-muted sm:w-auto sm:self-stretch sm:px-4"
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                                {errors.customer_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    {canQuickCreateCustomer
                                        ? 'Pick a customer or use Add to create one without leaving this page.'
                                        : 'Only active customers are listed. Ask an admin to grant customer create permission or use Customers screen.'}
                                </p>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="completed">Completed (deduct stock)</option>
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
                                {errors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200">
                            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-end">
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="sale_add_product" className={labelClass}>
                                        Add product
                                    </label>
                                    <div className="relative mt-2 rounded-md border border-gray-300 bg-white">
                                        <div className="flex items-stretch">
                                            <input
                                                id="sale_add_product"
                                                type="text"
                                                autoComplete="off"
                                                className="block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                                placeholder="Search product..."
                                                value={
                                                    String(productSearchQuery ?? '').trim() !== ''
                                                        ? productSearchQuery
                                                        : selectedProductObj?.name ?? ''
                                                }
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setProductSearchQuery(v);
                                                    if (v.trim() === '') {
                                                        setSelectedProduct('');
                                                    } else if (
                                                        selectedProductObj &&
                                                        v.trim() !==
                                                            String(selectedProductObj.name ?? '').trim()
                                                    ) {
                                                        setSelectedProduct('');
                                                    }
                                                }}
                                            />
                                            {(selectedProduct ||
                                                String(productSearchQuery ?? '').trim() !== '') && (
                                                <button
                                                    type="button"
                                                    title="Clear"
                                                    onClick={() => {
                                                        setSelectedProduct('');
                                                        setProductSearchQuery('');
                                                    }}
                                                    className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                                                    aria-label="Clear product"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                        {String(productSearchQuery ?? '').trim() !== '' && (
                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                {filteredProductsForPicker.length === 0 ? (
                                                    <div className="px-3 py-2 text-sm text-gray-400">
                                                        No product found
                                                    </div>
                                                ) : (
                                                    filteredProductsForPicker.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedProduct(String(p.id));
                                                                setProductSearchQuery('');
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
                                </div>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
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
                                                Variant / SKU
                                            </th>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                {qtyTableColumnHeader}
                                            </th>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                Unit price
                                            </th>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                                Line total
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
                                                    colSpan={6}
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
                                                const variants = rowProduct?.variants ?? [];
                                                const isVariable = rowProduct?.type === 'variable';
                                                const showVariantPicker =
                                                    isVariable || variants.length > 0;
                                                const billingMode =
                                                    it.billing_mode ?? 'quantity';
                                                const isLength = billingMode === 'length_ft';
                                                const isArea = billingMode === 'area_sqft';
                                                const pairs = Array.isArray(it.length_pairs)
                                                    ? it.length_pairs
                                                    : isArea
                                                      ? emptyAreaPairs()
                                                      : emptyLengthPairs();
                                                const lenAmt = computeLengthLineAmounts({
                                                    ...it,
                                                    length_pairs: pairs,
                                                });
                                                const areaAmt = computeAreaLineAmounts({
                                                    ...it,
                                                    length_pairs: pairs,
                                                });
                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr>
                                                            <td className="px-4 py-3 text-gray-900">
                                                                <span className="font-medium">
                                                                    {rowProduct?.name ?? '—'}
                                                                </span>
                                                                <label className="mt-2 flex cursor-pointer items-center gap-2">
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
                                                                            toggleBillingMode(
                                                                                idx,
                                                                                'area_sqft',
                                                                                e.target.checked,
                                                                            )
                                                                        }
                                                                        className="rounded border-gray-300 text-brand focus:ring-brand"
                                                                    />
                                                                    <span className="text-xs text-gray-600">
                                                                        Glass area (sq ft) — W × H ×
                                                                        qty / 144, rate / sq ft
                                                                    </span>
                                                                </label>
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                {showVariantPicker ? (
                                                                    <select
                                                                        value={
                                                                            it.product_variant_id ?? ''
                                                                        }
                                                                        onChange={(e) =>
                                                                            updateItem(
                                                                                idx,
                                                                                'product_variant_id',
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        className="w-full min-w-[12rem] max-w-xs rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                    >
                                                                        <option value="">
                                                                            Select variant…
                                                                        </option>
                                                                        {variants.map((v) => (
                                                                            <option
                                                                                key={v.id}
                                                                                value={v.id}
                                                                            >
                                                                                {v.sku ? `${v.sku} — ` : ''}
                                                                                {v.name ??
                                                                                    `Variant #${v.id}`}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">
                                                                        —
                                                                    </span>
                                                                )}
                                                                {errors?.[
                                                                    `items.${idx}.product_variant_id`
                                                                ] && (
                                                                    <p className="mt-1 text-xs text-red-600">
                                                                        {
                                                                            errors[
                                                                                `items.${idx}.product_variant_id`
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                {isLength ? (
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Length Qty
                                                                        </p>
                                                                        <p className="font-mono text-sm font-semibold text-gray-900">
                                                                            {lenAmt.totalFt.toFixed(4)}
                                                                        </p>
                                                                    </div>
                                                                ) : isArea ? (
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Total sq ft
                                                                        </p>
                                                                        <p className="font-mono text-sm font-semibold text-gray-900">
                                                                            {areaAmt.totalSqFt.toFixed(4)}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <>
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
                                                                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                        />
                                                                        {errors?.[
                                                                            `items.${idx}.quantity`
                                                                        ] && (
                                                                            <p className="mt-1 text-xs text-red-600">
                                                                                {
                                                                                    errors[
                                                                                        `items.${idx}.quantity`
                                                                                    ]
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                {isLength ? (
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Rate / ft
                                                                        </p>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            value={
                                                                                it.rate_per_ft !==
                                                                                    '' &&
                                                                                it.rate_per_ft != null
                                                                                    ? it.rate_per_ft
                                                                                    : it.unit_price ?? ''
                                                                            }
                                                                            onChange={(e) =>
                                                                                updateItem(
                                                                                    idx,
                                                                                    'rate_per_ft',
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                        />
                                                                    </div>
                                                                ) : isArea ? (
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">
                                                                            Rate / sq ft
                                                                        </p>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            value={
                                                                                it.rate_per_sqft !==
                                                                                    '' &&
                                                                                it.rate_per_sqft != null
                                                                                    ? it.rate_per_sqft
                                                                                    : it.unit_price ?? ''
                                                                            }
                                                                            onChange={(e) =>
                                                                                updateItem(
                                                                                    idx,
                                                                                    'rate_per_sqft',
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={it.unit_price}
                                                                            onChange={(e) =>
                                                                                updateItem(
                                                                                    idx,
                                                                                    'unit_price',
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                                        />
                                                                        {errors?.[
                                                                            `items.${idx}.unit_price`
                                                                        ] && (
                                                                            <p className="mt-1 text-xs text-red-600">
                                                                                {
                                                                                    errors[
                                                                                        `items.${idx}.unit_price`
                                                                                    ]
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 align-top font-semibold text-gray-900">
                                                                {lineNetBeforeTax(it).toFixed(2)}
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
                                                        {isLength && (
                                                            <tr className="bg-gray-50/80">
                                                                <td
                                                                    colSpan={6}
                                                                    className="px-4 py-4 text-sm text-gray-800"
                                                                >
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                                        Lengths
                                                                    </p>
                                                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                                        {pairs.map((row, pairIdx) => {
                                                                                const lineFt =
                                                                                    Number(
                                                                                        row.length ||
                                                                                            0,
                                                                                    ) *
                                                                                    Number(
                                                                                        row.qty || 0,
                                                                                    );
                                                                                return (
                                                                                    <div
                                                                                        key={
                                                                                            pairIdx
                                                                                        }
                                                                                        className="rounded-lg border border-gray-200 bg-white p-2"
                                                                                    >
                                                                                        <div className="flex items-center gap-1">
                                                                                            <input
                                                                                                type="number"
                                                                                                step="0.0001"
                                                                                                min="0"
                                                                                                className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
                                                                                                placeholder="Length"
                                                                                                value={
                                                                                                    row.length
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateBillingPairRow(
                                                                                                        idx,
                                                                                                        pairIdx,
                                                                                                        'length',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                            <span className="shrink-0 text-gray-400">
                                                                                                ×
                                                                                            </span>
                                                                                            <input
                                                                                                type="number"
                                                                                                step="0.0001"
                                                                                                min="0"
                                                                                                className="w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
                                                                                                placeholder="Qty"
                                                                                                value={
                                                                                                    row.qty
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateBillingPairRow(
                                                                                                        idx,
                                                                                                        pairIdx,
                                                                                                        'qty',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
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
                                                                                            ={' '}
                                                                                            {lineFt.toFixed(
                                                                                                4,
                                                                                            )}{' '}
                                                                                            ft
                                                                                        </p>
                                                                                    </div>
                                                                                );
                                                                        })}
                                                                    </div>
                                                                    <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-gray-200 pt-3">
                                                                        <div>
                                                                            <p className="text-xs font-medium text-gray-600">
                                                                                Total FT
                                                                            </p>
                                                                            <p className="font-mono text-lg font-semibold text-gray-900">
                                                                                {lenAmt.totalFt.toFixed(
                                                                                    4,
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-medium text-gray-600">
                                                                                Amount (before
                                                                                discount)
                                                                            </p>
                                                                            <p className="font-mono text-sm text-gray-800">
                                                                                {lenAmt.gross.toFixed(
                                                                                    2,
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs font-medium text-gray-600">
                                                                                Discount %
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                max="100"
                                                                                className="mt-1 block w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                                                                value={
                                                                                    it.discount_percent
                                                                                }
                                                                                onChange={(e) =>
                                                                                    updateItem(
                                                                                        idx,
                                                                                        'discount_percent',
                                                                                        e.target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-medium text-gray-600">
                                                                                After discount
                                                                                (line)
                                                                            </p>
                                                                            <p className="font-mono text-lg font-semibold text-brand">
                                                                                {lenAmt.net.toFixed(
                                                                                    2,
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <div className="ml-auto flex flex-wrap gap-2">
                                                                            <button
                                                                                type="button"
                                                                                className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10"
                                                                                onClick={() =>
                                                                                    addBillingPairRowToItem(idx)
                                                                                }
                                                                            >
                                                                                + Add length row
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                                                                onClick={() =>
                                                                                    refreshBillingPairs(idx)
                                                                                }
                                                                            >
                                                                                Refresh
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {isArea && (
                                                            <tr className="bg-sky-50/50">
                                                                <td colSpan={6} className="px-4 py-4">
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
                                                                        discountPercent={
                                                                            it.discount_percent
                                                                        }
                                                                        onDiscountChange={(v) =>
                                                                            updateItem(
                                                                                idx,
                                                                                'discount_percent',
                                                                                v,
                                                                            )
                                                                        }
                                                                    />
                                                                    <div className="mt-4 flex flex-wrap gap-6 border-t border-gray-200 pt-3 text-sm">
                                                                        <div>
                                                                            <p className="text-xs font-medium text-gray-600">
                                                                                Total sq ft
                                                                            </p>
                                                                            <p className="font-mono text-lg font-semibold text-gray-900">
                                                                                {areaAmt.totalSqFt.toFixed(4)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-medium text-gray-600">
                                                                                Line total
                                                                            </p>
                                                                            <p className="font-mono text-lg font-semibold text-brand">
                                                                                {areaAmt.net.toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
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

                            <div className="space-y-1 border-t border-gray-100 p-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">
                                        {subtotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Tax (from product)</span>
                                    <span className="font-semibold text-gray-900">
                                        {taxTotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-1 text-base">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link
                                href={route('sales.index')}
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

            <Modal show={customerModalOpen} onClose={closeCustomerModal} maxWidth="lg">
                <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">New customer</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Saved as active, regular group. You can edit full details later under Customers.
                    </p>
                </div>
                <div className="space-y-4 px-6 py-5">
                    <div>
                        <label className={labelClass}>Name *</label>
                        <input
                            value={quickName}
                            onChange={(e) => setQuickName(e.target.value)}
                            className={`mt-2 ${inputClassInline}`}
                            placeholder="Customer name"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Code</label>
                        <input
                            value={quickCode}
                            onChange={(e) => setQuickCode(e.target.value)}
                            className={`mt-2 ${inputClassInline}`}
                            placeholder="Leave blank to auto-generate (e.g. C-A1B2C3D4E)"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Phone</label>
                            <input
                                value={quickPhone}
                                onChange={(e) => setQuickPhone(e.target.value)}
                                className={`mt-2 ${inputClassInline}`}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input
                                type="email"
                                value={quickEmail}
                                onChange={(e) => setQuickEmail(e.target.value)}
                                className={`mt-2 ${inputClassInline}`}
                            />
                        </div>
                    </div>
                    {quickError && <p className="text-sm text-red-600">{quickError}</p>}
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeCustomerModal}
                            disabled={quickBusy}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={quickBusy}
                            onClick={createCustomerInline}
                            className="rounded-lg border border-transparent bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                        >
                            {quickBusy ? 'Creating…' : 'Create & select'}
                        </button>
                    </div>
                </div>
            </Modal>

            <StockAvailabilityModal
                show={stockAvailability.open}
                onClose={stockAvailability.close}
                loading={stockAvailability.loading}
                error={stockAvailability.error}
                info={stockAvailability.info}
            />
        </AuthenticatedLayout>
    );
}

