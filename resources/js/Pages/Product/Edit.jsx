import BranchLogoDropzone from '@/Components/BranchLogoDropzone';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Edit({
    product,
    categories,
    subCategories,
    brands,
    units,
    taxes,
    low_stock_threshold: lowStockThreshold = 10,
    default_tax_percentage: defaultTaxPercentage = 0,
}) {
    const { data, setData, put, post, processing, errors, transform } = useForm({
        category_id: product.category_id,
        sub_category_id: product.sub_category_id ?? '',
        brand_id: product.brand_id,
        unit_id: product.unit_id,
        tax_id: product.tax_id,
        name: product.name,
        sku: product.sku ?? '',
        type: product.type ?? 'simple',
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        sale_type: product.sale_type ?? 'quantity',
        quantity_in_pack: product.quantity_in_pack,
        pack_in_carton: product.pack_in_carton,
        image: null,
        description: product.description,
        alert: product.alert,
        alert_message: product.alert_message,
        expiry_alert:
            product.expiry_alert != null ? String(product.expiry_alert) : '',
        quantity_alert:
            product.quantity_alert != null ? String(product.quantity_alert) : '',
        status: product.status,
        variants: product.type === 'variable' ? (product.variants ?? []) : [],
    });

    const subOptions = useMemo(
        () =>
            (subCategories ?? []).filter(
                (s) => String(s.category_id) === String(data.category_id),
            ),
        [subCategories, data.category_id],
    );

    const submit = (e) => {
        e.preventDefault();
        transform((form) => {
            const isVariable = form.type === 'variable';
            const next = {
                ...form,
                brand_id: form.brand_id || null,
                sub_category_id: form.sub_category_id || null,
                tax_id: form.tax_id || null,
                barcode: null,
                variants: isVariable
                    ? form.variants.map((variant) => ({
                          id: variant.id,
                          name: variant.name,
                          sku: variant.sku,
                          barcode: null,
                          cost_price: Number(variant.cost_price),
                          selling_price: Number(variant.selling_price),
                          status: variant.status ?? 'active',
                          attribute_values: variant.attribute_values ?? [],
                      }))
                    : [],
                purchase_price: isVariable ? 0 : Number(form.purchase_price),
                sale_price: isVariable ? 0 : Number(form.sale_price),
                sku: isVariable ? (form.variants[0]?.sku ?? '') : form.sku,
                expiry_alert:
                    form.expiry_alert === '' || form.expiry_alert == null
                        ? null
                        : Number(form.expiry_alert),
                quantity_alert:
                    form.quantity_alert === '' || form.quantity_alert == null
                        ? null
                        : Number(form.quantity_alert),
            };
            if (form.image instanceof File) {
                next._method = 'put';
            }
            return next;
        });
        if (data.image instanceof File) {
            post(route('products.update', product.slug));
        } else {
            put(route('products.update', product.slug));
        }
    };

    const updateVariantRow = (idx, patch) => {
        setData(
            'variants',
            data.variants.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
        );
    };

    const removeVariantRow = (idx) => {
        setData(
            'variants',
            data.variants.filter((_, i) => i !== idx),
        );
    };

    const ready =
        (categories?.length ?? 0) > 0 &&
        (subCategories?.length ?? 0) > 0 &&
        (units?.length ?? 0) > 0;

    const typeLabels = {
        simple: 'Simple',
        variable: 'Variable',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            <span className="font-mono text-gray-700">{product.slug}</span>
                            <span className="text-gray-400"> · </span>
                            Slug updates when you change the name
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('products.batches.index', product.slug)}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Batches
                        </Link>
                        <Link
                            href={route('products.serials.index', product.slug)}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Serials
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${product.name}`} />

            {!ready ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    <p className="font-medium">Setup required</p>
                    <p className="mt-1">
                        You need at least one category, one sub category under it, and one
                        unit before editing products.
                    </p>
                </div>
            ) : (
                <form onSubmit={submit} className="mx-auto max-w-7xl space-y-4">
                    <div className="grid gap-4 lg:grid-cols-12">
                        <div className="space-y-4 lg:col-span-8">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    General Information
                                </h2>
                                <div>
                                    <InputLabel htmlFor="name" value="Product Name" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>
                                <div className="mt-3">
                                    <InputLabel htmlFor="description" value="Description" />
                                    <textarea
                                        id="description"
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData('description', e.target.value)
                                        }
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.description}
                                    />
                                </div>
                                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="category_id" value="Category" />
                                        <select
                                            id="category_id"
                                            className={selectClass}
                                            value={data.category_id}
                                            onChange={(e) => {
                                                const cid = e.target.value;
                                                setData('category_id', cid);
                                                setData('sub_category_id', '');
                                            }}
                                        >
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            className="mt-2"
                                            message={errors.category_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="sub_category_id"
                                            value="Sub category (optional)"
                                        />
                                        <select
                                            id="sub_category_id"
                                            className={selectClass}
                                            value={data.sub_category_id ?? ''}
                                            onChange={(e) =>
                                                setData('sub_category_id', e.target.value)
                                            }
                                        >
                                            <option value="">— None —</option>
                                            {subOptions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            className="mt-2"
                                            message={errors.sub_category_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="brand_id" value="Brand (optional)" />
                                        <select
                                            id="brand_id"
                                            className={selectClass}
                                            value={data.brand_id ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'brand_id',
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : null,
                                                )
                                            }
                                        >
                                            <option value="">—</option>
                                            {(brands ?? []).map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError className="mt-2" message={errors.brand_id} />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    Product Type & Settings
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            Product Type
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Type is fixed after creation (
                                            {typeLabels[data.type] ?? data.type}).
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-4 text-sm opacity-80">
                                            {[
                                                ['simple', 'Simple'],
                                                ['variable', 'Variable'],
                                            ].map(([value, label]) => (
                                                <label
                                                    key={value}
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value={value}
                                                        checked={data.type === value}
                                                        disabled
                                                        readOnly
                                                        className="cursor-not-allowed"
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Sale Type</p>
                                        <div className="mt-1 flex flex-wrap gap-4 text-sm">
                                            {[
                                                ['quantity', 'Quantity'],
                                                ['weight', 'Weight'],
                                            ].map(([value, label]) => (
                                                <label key={value} className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="sale_type"
                                                        value={value}
                                                        checked={data.sale_type === value}
                                                        onChange={() => setData('sale_type', value)}
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError className="mt-2" message={errors.sale_type} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="status" value="Status" />
                                        <select
                                            id="status"
                                            className={selectClass}
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <InputError className="mt-2" message={errors.status} />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={data.alert}
                                                onChange={(e) => setData('alert', e.target.checked)}
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                            />
                                            Enable alerts
                                        </label>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="alert_message" value="Alert Message" />
                                        <TextInput
                                            id="alert_message"
                                            className="mt-1 block w-full"
                                            value={data.alert_message}
                                            onChange={(e) =>
                                                setData('alert_message', e.target.value)
                                            }
                                        />
                                        <InputError className="mt-2" message={errors.alert_message} />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="expiry_alert" value="Expiry Alert (days)" />
                                            <TextInput
                                                id="expiry_alert"
                                                type="number"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.expiry_alert}
                                                onChange={(e) =>
                                                    setData('expiry_alert', e.target.value)
                                                }
                                            />
                                            <InputError className="mt-2" message={errors.expiry_alert} />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="quantity_alert" value="Quantity Alert" />
                                            <TextInput
                                                id="quantity_alert"
                                                type="number"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.quantity_alert}
                                                onChange={(e) =>
                                                    setData('quantity_alert', e.target.value)
                                                }
                                            />
                                            <InputError className="mt-2" message={errors.quantity_alert} />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Leave empty to use the default threshold (
                                                {Number(lowStockThreshold).toLocaleString()}) from
                                                Settings → Stock.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {data.type === 'simple' && (
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                                        SKU & pricing
                                    </h2>
                                    <p className="mb-3 text-sm text-gray-500">
                                        A unique 12-digit barcode is kept when you save (assigned
                                        automatically if missing). SKU, cost, and selling price are
                                        stored on the default variant.
                                    </p>
                                    {product.barcode ? (
                                        <p className="mb-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
                                            <span className="text-xs font-sans text-gray-500">
                                                Current barcode{' '}
                                            </span>
                                            {product.barcode}
                                        </p>
                                    ) : (
                                        <p className="mb-3 text-sm text-amber-800">
                                            No barcode yet — one will be assigned on save.
                                        </p>
                                    )}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="sku" value="SKU" />
                                            <TextInput
                                                id="sku"
                                                className="mt-1 block w-full font-mono"
                                                value={data.sku}
                                                onChange={(e) => setData('sku', e.target.value)}
                                            />
                                            <InputError className="mt-2" message={errors.sku} />
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="purchase_price" value="Cost" />
                                            <TextInput
                                                id="purchase_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.purchase_price}
                                                onChange={(e) =>
                                                    setData('purchase_price', e.target.value)
                                                }
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.purchase_price}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="sale_price" value="Selling price" />
                                            <TextInput
                                                id="sale_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.sale_price}
                                                onChange={(e) =>
                                                    setData('sale_price', e.target.value)
                                                }
                                            />
                                            <InputError className="mt-2" message={errors.sale_price} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {data.type === 'variable' && (
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h2 className="mb-3 text-base font-semibold text-gray-900">
                                        Product Variants
                                    </h2>
                                    <p className="mb-3 text-sm text-gray-500">
                                        Edit each line. Barcodes stay the same when you save. Removing a
                                        row deletes that variant (at least one must remain).
                                    </p>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-2 text-left">Name</th>
                                                    <th className="px-2 py-2 text-left">SKU</th>
                                                    <th className="px-2 py-2 text-left">Cost</th>
                                                    <th className="px-2 py-2 text-left">Selling</th>
                                                    <th className="px-2 py-2 text-left">Status</th>
                                                    <th className="px-2 py-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.variants.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-2 py-3 text-center text-gray-500"
                                                        >
                                                            No variants.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.variants.map((row, idx) => (
                                                        <tr key={row.id ?? idx}>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    className="w-full"
                                                                    value={row.name}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, {
                                                                            name: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    className="w-full font-mono"
                                                                    value={row.sku}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, {
                                                                            sku: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full"
                                                                    value={row.cost_price}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, {
                                                                            cost_price: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <TextInput
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full"
                                                                    value={row.selling_price}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, {
                                                                            selling_price:
                                                                                e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <select
                                                                    className={selectClass + ' mt-0'}
                                                                    value={row.status ?? 'active'}
                                                                    onChange={(e) =>
                                                                        updateVariantRow(idx, {
                                                                            status: e.target.value,
                                                                        })
                                                                    }
                                                                >
                                                                    <option value="active">Active</option>
                                                                    <option value="inactive">
                                                                        Inactive
                                                                    </option>
                                                                </select>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVariantRow(idx)}
                                                                    disabled={data.variants.length <= 1}
                                                                    className="text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <InputError className="mt-2" message={errors.variants} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 lg:col-span-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    Product Media
                                </h2>
                                <BranchLogoDropzone
                                    id="image"
                                    label="Upload image"
                                    file={data.image}
                                    existingUrl={product.image_url}
                                    onFileChange={(file) => setData('image', file)}
                                    error={errors.image}
                                    disabled={processing}
                                />
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    Stock & Packaging
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="quantity_in_pack" value="Quantity in Pack" />
                                        <TextInput
                                            id="quantity_in_pack"
                                            type="number"
                                            min="1"
                                            className="mt-1 block w-full"
                                            value={data.quantity_in_pack}
                                            onChange={(e) =>
                                                setData(
                                                    'quantity_in_pack',
                                                    Number(e.target.value) || 1,
                                                )
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.quantity_in_pack}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="pack_in_carton" value="Pack in Carton" />
                                        <TextInput
                                            id="pack_in_carton"
                                            type="number"
                                            min="1"
                                            className="mt-1 block w-full"
                                            value={data.pack_in_carton}
                                            onChange={(e) =>
                                                setData(
                                                    'pack_in_carton',
                                                    Number(e.target.value) || 1,
                                                )
                                            }
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.pack_in_carton}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="unit_id" value="Unit" />
                                        <select
                                            id="unit_id"
                                            className={selectClass}
                                            value={data.unit_id}
                                            onChange={(e) => setData('unit_id', e.target.value)}
                                        >
                                            {units.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.symbol
                                                        ? `${u.name} (${u.symbol})`
                                                        : u.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError className="mt-2" message={errors.unit_id} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="tax_id" value="Tax (optional)" />
                                        <select
                                            id="tax_id"
                                            className={selectClass}
                                            value={data.tax_id ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'tax_id',
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : null,
                                                )
                                            }
                                        >
                                            <option value="">—</option>
                                            {(taxes ?? []).map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} ({t.code})
                                                </option>
                                            ))}
                                        </select>
                                        <InputError className="mt-2" message={errors.tax_id} />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Settings → Tax default for new products:{' '}
                                            <span className="font-semibold text-gray-700">
                                                {Number(defaultTaxPercentage).toLocaleString()}%
                                            </span>{' '}
                                            (link a catalog tax with that rate).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <PrimaryButton
                            disabled={processing || subOptions.length === 0}
                            className="bg-brand hover:bg-brand-dark"
                        >
                            Save changes
                        </PrimaryButton>
                        <Link
                            href={route('products.show', product.slug)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            )}
        </AuthenticatedLayout>
    );
}
