import Dropdown from '@/Components/Dropdown';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 bg-white text-sm shadow-sm focus:border-brand focus:ring-brand';

const PRODUCT_TYPES = [
    { value: '', label: 'All types' },
    { value: 'simple', label: 'Simple' },
    { value: 'variable', label: 'Variable' },
];

const iconStroke = 1.75;

function IconPackage({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
            />
        </svg>
    );
}

function IconPlus({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>
    );
}

function IconEllipsisHorizontal({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm5.25 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
        </svg>
    );
}

function typeBadgeClass(type) {
    switch (type) {
        case 'variable':
            return 'bg-amber-500 text-white';
        case 'simple':
        default:
            return 'bg-emerald-500 text-white';
    }
}

function typeLabel(type) {
    if (type === 'variable') {
        return 'Variable';
    }
    return 'Simple';
}

function saleTypeBadgeClass(saleType) {
    return saleType === 'weight'
        ? 'bg-violet-600 text-white'
        : 'bg-brand/90 text-white';
}

function saleTypeShortLabel(saleType) {
    return saleType === 'weight' ? 'Weight' : 'Qty';
}

function buildQuery(filters, extra = {}) {
    const merged = { ...filters, ...extra };
    const out = {};
    if (merged.q) {
        out.q = merged.q;
    }
    if (merged.category_id) {
        out.category_id = merged.category_id;
    }
    if (merged.brand_id) {
        out.brand_id = merged.brand_id;
    }
    if (merged.type) {
        out.type = merged.type;
    }
    if (merged.page) {
        out.page = merged.page;
    }
    return out;
}

function TablePagination({ products, filters }) {
    const [goPage, setGoPage] = useState(String(products.current_page));

    useEffect(() => {
        setGoPage(String(products.current_page));
    }, [products.current_page]);

    const links = products.links ?? [];
    const lastPage = products.last_page ?? 1;
    const currentPage = products.current_page ?? 1;

    const goSubmit = (e) => {
        e.preventDefault();
        const p = parseInt(goPage, 10);
        if (Number.isNaN(p) || p < 1 || p > lastPage) {
            return;
        }
        router.get(
            route('products.index'),
            buildQuery(filters, { page: p }),
            { preserveState: true, replace: true },
        );
    };

    return (
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50/80 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
                Page{' '}
                <span className="font-semibold text-gray-900">{currentPage}</span>{' '}
                of{' '}
                <span className="font-semibold text-gray-900">{lastPage}</span>
            </p>
            <nav
                className="flex flex-wrap items-center justify-center gap-1"
                aria-label="Pagination"
            >
                {links.map((link, i) => {
                    if (!link.url) {
                        return (
                            <span
                                key={i}
                                className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-400"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    }
                    return (
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
                    );
                })}
            </nav>
            <form
                onSubmit={goSubmit}
                className="flex flex-wrap items-center gap-2 text-sm text-gray-600"
            >
                <span>Go to page</span>
                <input
                    type="number"
                    min={1}
                    max={lastPage}
                    value={goPage}
                    onChange={(e) => setGoPage(e.target.value)}
                    className="w-16 rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-brand focus:ring-brand"
                />
                <button
                    type="submit"
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Go
                </button>
            </form>
        </div>
    );
}

export default function Index({
    products,
    filters: filtersProp,
    categories = [],
    brands = [],
}) {
    const filters = filtersProp ?? {};
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    const filterDefaults = useMemo(
        () => ({
            q: filters?.q ?? '',
            category_id:
                filters?.category_id != null ? String(filters.category_id) : '',
            brand_id: filters?.brand_id != null ? String(filters.brand_id) : '',
            type: filters?.type ?? '',
        }),
        [filters],
    );

    const [q, setQ] = useState(filterDefaults.q);
    const [categoryId, setCategoryId] = useState(filterDefaults.category_id);
    const [brandId, setBrandId] = useState(filterDefaults.brand_id);
    const [type, setType] = useState(filterDefaults.type);

    useEffect(() => {
        setQ(filterDefaults.q);
        setCategoryId(filterDefaults.category_id);
        setBrandId(filterDefaults.brand_id);
        setType(filterDefaults.type);
    }, [filterDefaults]);

    const activeFilters = useMemo(
        () => ({
            q: q.trim() || null,
            category_id: categoryId ? Number(categoryId) : null,
            brand_id: brandId ? Number(brandId) : null,
            type: type || null,
        }),
        [q, categoryId, brandId, type],
    );

    const runSearch = (e) => {
        e?.preventDefault();
        router.get(
            route('products.index'),
            buildQuery(activeFilters, { page: 1 }),
            { preserveState: true, replace: true },
        );
    };

    const destroy = (slug, name) => {
        if (!window.confirm(`Delete product "${name}"?`)) {
            return;
        }
        router.delete(route('products.destroy', slug));
    };

    const total = products.total ?? 0;
    const perPage = products.per_page ?? 15;
    const currentPage = products.current_page ?? 1;

    return (
        <AuthenticatedLayout>
            <Head title="Products" />

            <div className="space-y-5">
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {/* Search card */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-base font-semibold text-gray-900">Search</h2>
                    <form onSubmit={runSearch} className="mt-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-1">
                                <label
                                    htmlFor="filter_q"
                                    className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Search (name, SKU, barcode, brand)
                                </label>
                                <TextInput
                                    id="filter_q"
                                    className="mt-1 block w-full"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Name, SKU, barcode, brand…"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="filter_category"
                                    className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Category
                                </label>
                                <select
                                    id="filter_category"
                                    className={selectClass}
                                    value={categoryId}
                                    onChange={(e) =>
                                        setCategoryId(e.target.value)
                                    }
                                >
                                    <option value="">All categories</option>
                                    {(categories ?? []).map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="filter_brand"
                                    className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Brand
                                </label>
                                <select
                                    id="filter_brand"
                                    className={selectClass}
                                    value={brandId}
                                    onChange={(e) => setBrandId(e.target.value)}
                                >
                                    <option value="">All brands</option>
                                    {(brands ?? []).map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="filter_type"
                                    className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Product type
                                </label>
                                <select
                                    id="filter_type"
                                    className={selectClass}
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    {PRODUCT_TYPES.map((opt) => (
                                        <option key={opt.value || 'all'} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <PrimaryButton
                                type="submit"
                                className="bg-brand hover:bg-brand-dark"
                            >
                                Search
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* Products table card */}
                <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Products
                            </h2>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Total products{' '}
                                <span className="font-semibold text-gray-800">
                                    {total}
                                </span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {perms.includes('products.create') && (
                                <Link
                                    href={route('products.create')}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-brand px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-brand-dark"
                                >
                                    <IconPlus className="h-4 w-4" />
                                    New product
                                </Link>
                            )}
                            {perms.includes('products.create') && (
                                <Link
                                    href={route('products.import')}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-brand px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-brand-dark"
                                >
                                    Import product
                                </Link>
                            )}
                            {perms.includes('products.view') && (
                                <a
                                    href={route(
                                        'products.export',
                                        buildQuery(filters),
                                    )}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-brand bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand shadow-sm transition hover:bg-brand-muted"
                                >
                                    Export product
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="overflow-visible">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Sr no
                                    </th>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Name
                                    </th>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        <span className="inline-flex items-center gap-1">
                                            <IconPackage className="h-4 w-4 text-gray-500" />
                                            Stock
                                        </span>
                                    </th>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Cost
                                    </th>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Selling price
                                    </th>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Active
                                    </th>
                                    <th className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Type
                                    </th>
                                    <th className="px-3 py-3 text-end text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-10 text-center text-gray-500"
                                        >
                                            No products match your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((p, idx) => {
                                        const sr =
                                            (currentPage - 1) * perPage + idx + 1;
                                        return (
                                            <tr
                                                key={p.id}
                                                className="bg-white even:bg-gray-50/70 hover:bg-brand-muted/30"
                                            >
                                                <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                                                    {sr}
                                                </td>
                                                <td className="max-w-[12rem] px-3 py-2.5">
                                                    <div className="truncate font-medium text-gray-900">
                                                        {p.name}
                                                    </div>
                                                    <div className="mt-0.5 truncate font-mono text-[11px] text-gray-500">
                                                        {p.sku}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-gray-800">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span>
                                                            {Number(
                                                                p.stock ?? 0,
                                                            ).toLocaleString(undefined, {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 4,
                                                            })}
                                                        </span>
                                                        {p.is_low_stock && (
                                                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                                                                Low
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-gray-900">
                                                    {p.cost}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                                                    {p.selling_price}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-gray-800">
                                                    {p.status === 'active'
                                                        ? 'Yes'
                                                        : 'No'}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span
                                                            className={
                                                                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ' +
                                                                typeBadgeClass(
                                                                    p.type,
                                                                )
                                                            }
                                                        >
                                                            {typeLabel(p.type)}
                                                        </span>
                                                        <span
                                                            className={
                                                                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ' +
                                                                saleTypeBadgeClass(
                                                                    p.sale_type,
                                                                )
                                                            }
                                                        >
                                                            {saleTypeShortLabel(
                                                                p.sale_type,
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-end">
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button
                                                                type="button"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-brand/40 hover:bg-brand-muted hover:text-brand"
                                                                aria-label="Actions"
                                                            >
                                                                <IconEllipsisHorizontal className="h-5 w-5" />
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content align="right">
                                                            {perms.includes(
                                                                'products.view',
                                                            ) && (
                                                                <Dropdown.Link
                                                                    href={route(
                                                                        'products.show',
                                                                        p.slug,
                                                                    )}
                                                                >
                                                                    View
                                                                </Dropdown.Link>
                                                            )}
                                                            {perms.includes(
                                                                'products.edit',
                                                            ) && (
                                                                <Dropdown.Link
                                                                    href={route(
                                                                        'products.edit',
                                                                        p.slug,
                                                                    )}
                                                                >
                                                                    Edit
                                                                </Dropdown.Link>
                                                            )}
                                                            {perms.includes(
                                                                'products.edit',
                                                            ) && (
                                                                <Dropdown.Link
                                                                    href={route(
                                                                        'products.batches.index',
                                                                        p.slug,
                                                                    )}
                                                                >
                                                                    Batches
                                                                </Dropdown.Link>
                                                            )}
                                                            {perms.includes(
                                                                'products.edit',
                                                            ) && (
                                                                <Dropdown.Link
                                                                    href={route(
                                                                        'products.serials.index',
                                                                        p.slug,
                                                                    )}
                                                                >
                                                                    Serials
                                                                </Dropdown.Link>
                                                            )}
                                                            {perms.includes(
                                                                'products.edit',
                                                            ) && (
                                                                <Dropdown.Link
                                                                    href={route(
                                                                        'stock-adjustments.create',
                                                                        { product_id: p.id },
                                                                    )}
                                                                >
                                                                    Stock adjustment
                                                                </Dropdown.Link>
                                                            )}
                                                            {perms.includes(
                                                                'products.delete',
                                                            ) && (
                                                                <button
                                                                    type="button"
                                                                    className="block w-full px-4 py-2 text-start text-sm text-red-600 transition hover:bg-red-50"
                                                                    onClick={() =>
                                                                        destroy(
                                                                            p.slug,
                                                                            p.name,
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {products.data.length > 0 && (
                        <TablePagination products={products} filters={filters} />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
