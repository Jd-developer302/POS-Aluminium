import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

const typeLabels = {
    simple: 'Simple',
    variable: 'Variable',
};

function FieldReadonly({ label, children, className = '' }) {
    return (
        <div className={className}>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <div className="mt-1 text-sm text-gray-900">{children}</div>
        </div>
    );
}

export default function Show({ product }) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    const type = product.type ?? 'simple';
    const isSimple = type === 'simple';
    const isVariable = type === 'variable';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            <span className="font-mono text-gray-700">{product.slug}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {perms.includes('products.edit') && (
                            <Link
                                href={route('products.edit', product.slug)}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        <Link
                            href={route('products.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={product.name} />

            <div className="mx-auto max-w-7xl space-y-4">
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-12">
                    <div className="space-y-4 lg:col-span-8">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">
                                General Information
                            </h2>
                            <FieldReadonly label="Product Name">
                                <span className="font-medium text-gray-900">{product.name}</span>
                            </FieldReadonly>
                            <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700">Description</p>
                                {product.description ? (
                                    <p className="mt-1 whitespace-pre-wrap rounded-md border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm text-gray-800">
                                        {product.description}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-500">—</p>
                                )}
                            </div>
                            <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                <FieldReadonly label="Category">
                                    {product.category?.name ?? '—'}
                                </FieldReadonly>
                                <FieldReadonly label="Sub category">
                                    {product.sub_category?.name ?? '—'}
                                </FieldReadonly>
                                <FieldReadonly label="Brand (optional)">
                                    {product.brand?.name ?? '—'}
                                </FieldReadonly>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">
                                Product Type & Settings
                            </h2>
                            <div className="space-y-3">
                                <FieldReadonly label="Product Type">
                                    {typeLabels[type] ?? type ?? '—'}
                                </FieldReadonly>
                                <FieldReadonly label="Sale Type">
                                    {product.sale_type === 'weight' ? 'Weight' : 'Quantity'}
                                </FieldReadonly>
                                <FieldReadonly label="Status">
                                    <span
                                        className={
                                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                                            (product.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-200 text-gray-700')
                                        }
                                    >
                                        {product.status}
                                    </span>
                                </FieldReadonly>
                                <FieldReadonly label="Enable alerts">
                                    {product.alert ? 'Yes' : 'No'}
                                </FieldReadonly>
                                <FieldReadonly label="Alert Message">
                                    {product.alert_message || '—'}
                                </FieldReadonly>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FieldReadonly label="Expiry Alert (days)">
                                        {product.expiry_alert ?? '—'}
                                    </FieldReadonly>
                                    <FieldReadonly label="Quantity Alert">
                                        {product.quantity_alert ?? '—'}
                                    </FieldReadonly>
                                </div>
                            </div>
                        </div>

                        {isSimple && (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    SKU & pricing
                                </h2>
                                <p className="mb-3 text-sm text-gray-500">
                                    SKU, barcode, cost, and selling price are stored on the default
                                    product variant (same table as variable SKUs).
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FieldReadonly label="SKU">
                                        <span className="font-mono">{product.sku || '—'}</span>
                                    </FieldReadonly>
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700">
                                        Barcode (Code 128)
                                    </p>
                                    <div className="mt-2 space-y-2">
                                        {product.barcode_image_src && product.barcode ? (
                                            <>
                                                <img
                                                    src={product.barcode_image_src}
                                                    alt=""
                                                    className="max-h-16 w-auto border border-gray-200 bg-white p-1"
                                                />
                                                <p className="font-mono text-sm text-gray-900 tracking-wider">
                                                    {product.barcode}
                                                </p>
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-500">—</span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <FieldReadonly label="Cost">
                                        {product.purchase_price}
                                    </FieldReadonly>
                                    <FieldReadonly label="Selling price">
                                        {product.sale_price}
                                    </FieldReadonly>
                                </div>
                            </div>
                        )}

                        {isVariable && (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h2 className="mb-3 text-base font-semibold text-gray-900">
                                    Product Variants
                                </h2>
                                <p className="mb-3 text-sm text-gray-500">
                                    Each variant has its own SKU, barcode, and pricing.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-2 py-2 text-left">Name</th>
                                                <th className="px-2 py-2 text-left">SKU</th>
                                                <th className="px-2 py-2 text-left">Barcode</th>
                                                <th className="px-2 py-2 text-left">Cost</th>
                                                <th className="px-2 py-2 text-left">Selling</th>
                                                <th className="px-2 py-2 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {(product.variants ?? []).length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-2 py-3 text-center text-gray-500"
                                                    >
                                                        No variants.
                                                    </td>
                                                </tr>
                                            ) : (
                                                (product.variants ?? []).map((row) => (
                                                    <tr key={row.id}>
                                                        <td className="px-2 py-2 text-gray-900">
                                                            {row.name}
                                                        </td>
                                                        <td className="px-2 py-2 font-mono text-gray-800">
                                                            {row.sku}
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            {row.barcode_image_src && row.barcode ? (
                                                                <div className="space-y-1">
                                                                    <img
                                                                        src={row.barcode_image_src}
                                                                        alt=""
                                                                        className="max-h-10 w-auto border border-gray-200 bg-white p-0.5"
                                                                    />
                                                                    <span className="block font-mono text-[10px] text-gray-700">
                                                                        {row.barcode}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 tabular-nums text-gray-800">
                                                            {row.cost_price}
                                                        </td>
                                                        <td className="px-2 py-2 tabular-nums text-gray-800">
                                                            {row.selling_price}
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <span
                                                                className={
                                                                    row.status === 'active'
                                                                        ? 'text-emerald-700'
                                                                        : 'text-gray-600'
                                                                }
                                                            >
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 lg:col-span-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">
                                Product Media
                            </h2>
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt=""
                                    className="max-h-48 w-auto rounded-lg border border-gray-200 object-contain"
                                />
                            ) : (
                                <p className="text-sm text-gray-500">No image</p>
                            )}
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-base font-semibold text-gray-900">
                                Stock & Packaging
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldReadonly label="Quantity in Pack">
                                    {product.quantity_in_pack}
                                </FieldReadonly>
                                <FieldReadonly label="Pack in Carton">
                                    {product.pack_in_carton}
                                </FieldReadonly>
                                <FieldReadonly label="Unit" className="sm:col-span-2">
                                    {product.unit
                                        ? product.unit.symbol
                                            ? `${product.unit.name} (${product.unit.symbol})`
                                            : product.unit.name
                                        : '—'}
                                </FieldReadonly>
                                <FieldReadonly label="Tax (optional)" className="sm:col-span-2">
                                    {product.tax
                                        ? `${product.tax.name} (${product.tax.code})`
                                        : '—'}
                                </FieldReadonly>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
