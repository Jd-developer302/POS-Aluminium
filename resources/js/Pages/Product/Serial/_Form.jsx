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

export default function SerialForm({
    product,
    batches,
    warehouses,
    data,
    setData,
    errors,
    onSubmit,
    submitLabel,
    processing,
}) {
    const batchOptions = useMemo(() => batches ?? [], [batches]);
    const whOptions = useMemo(() => warehouses ?? [], [warehouses]);

    const hasVariants = useMemo(() => {
        // variants are inferred from batches that have product_variant_id
        return (batchOptions ?? []).some((b) => b.product_variant_id != null);
    }, [batchOptions]);

    const [variantId, setVariantId] = useState('');

    const variantOptions = useMemo(() => {
        const m = new Map();
        (batchOptions ?? []).forEach((b) => {
            if (!b.product_varient) return;
            m.set(String(b.product_variant_id), b.product_varient);
        });
        return Array.from(m.entries()).map(([id, v]) => ({
            id,
            name: v.name,
            sku: v.sku,
        }));
    }, [batchOptions]);

    const filteredBatches = useMemo(() => {
        if (!hasVariants || !variantId) return batchOptions;
        return (batchOptions ?? []).filter(
            (b) => String(b.product_variant_id ?? '') === String(variantId),
        );
    }, [batchOptions, hasVariants, variantId]);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">
                    Product: <span className="font-bold">{product?.name}</span>
                </p>
            </div>

            {hasVariants && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className={labelClass}>Variant</label>
                        <select
                            value={variantId}
                            onChange={(e) => {
                                setVariantId(e.target.value);
                                setData('product_batch_id', '');
                            }}
                            className={inputClass}
                        >
                            <option value="">All</option>
                            {variantOptions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.sku ? `${v.sku} — ${v.name}` : v.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <label className={labelClass}>Serial number *</label>
                    <input
                        value={data.serial_number ?? ''}
                        onChange={(e) => setData('serial_number', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. SN-00001"
                    />
                    {errors?.serial_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Status *</label>
                    <select
                        value={data.status ?? 'available'}
                        onChange={(e) => setData('status', e.target.value)}
                        className={inputClass}
                    >
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="returned">Returned</option>
                        <option value="damaged">Damaged</option>
                    </select>
                    {errors?.status && (
                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                    )}
                </div>

                <div>
                    <label className={labelClass}>Warehouse</label>
                    <select
                        value={data.warehouse_id ?? ''}
                        onChange={(e) => setData('warehouse_id', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">None</option>
                        {whOptions.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                    {errors?.warehouse_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <label className={labelClass}>Batch</label>
                    <select
                        value={data.product_batch_id ?? ''}
                        onChange={(e) => setData('product_batch_id', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">None</option>
                        {filteredBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.batch_number}
                                {b.product_varient?.sku
                                    ? ` — ${b.product_varient.sku}`
                                    : ''}
                                {b.expiry_date ? ` (exp ${formatDate(b.expiry_date)})` : ''}
                            </option>
                        ))}
                    </select>
                    {errors?.product_batch_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.product_batch_id}</p>
                    )}
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

