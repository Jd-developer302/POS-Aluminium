import React, { useMemo } from 'react';

const inputClass =
    'mt-2 block h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

export default function BatchForm({
    product,
    variants,
    data,
    setData,
    errors,
    onSubmit,
    submitLabel,
    processing,
}) {
    const hasVariants = (variants?.length ?? 0) > 0 && product?.type === 'variable';

    const variantOptions = useMemo(() => variants ?? [], [variants]);

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">
                    Product: <span className="font-bold">{product?.name}</span>
                </p>
                {hasVariants && (
                    <p className="mt-1 text-xs text-gray-500">
                        This product has variants — batch will be saved variant-wise.
                    </p>
                )}
            </div>

            {hasVariants && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className={labelClass}>Variant *</label>
                        <select
                            value={data.product_variant_id ?? ''}
                            onChange={(e) =>
                                setData('product_variant_id', e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Select</option>
                            {variantOptions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.sku ? `${v.sku} — ${v.name}` : v.name}
                                </option>
                            ))}
                        </select>
                        {errors?.product_variant_id && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.product_variant_id}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className={labelClass}>Batch number *</label>
                    <input
                        value={data.batch_number ?? ''}
                        onChange={(e) => setData('batch_number', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. BATCH-001"
                    />
                    {errors?.batch_number && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.batch_number}
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Manufacture date</label>
                    <input
                        type="date"
                        value={data.manufacture_date ?? ''}
                        onChange={(e) =>
                            setData('manufacture_date', e.target.value)
                        }
                        className={inputClass}
                    />
                    {errors?.manufacture_date && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.manufacture_date}
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Expiry date</label>
                    <input
                        type="date"
                        value={data.expiry_date ?? ''}
                        onChange={(e) => setData('expiry_date', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.expiry_date && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.expiry_date}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className={labelClass}>Cost price</label>
                    <input
                        type="number"
                        step="0.01"
                        value={data.cost_price ?? ''}
                        onChange={(e) => setData('cost_price', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.cost_price && (
                        <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Selling price</label>
                    <input
                        type="number"
                        step="0.01"
                        value={data.selling_price ?? ''}
                        onChange={(e) => setData('selling_price', e.target.value)}
                        className={inputClass}
                    />
                    {errors?.selling_price && (
                        <p className="mt-1 text-sm text-red-600">{errors.selling_price}</p>
                    )}
                </div>
                <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                            type="checkbox"
                            checked={!!data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                        />
                        Active
                    </label>
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

