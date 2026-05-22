import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

function Pagination({ links }) {
    if (!links?.length) return null;
    return (
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Pagination">
            {links.map((link, i) =>
                link.url ? (
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
                ) : (
                    <span
                        key={i}
                        className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}

function buildQuery(obj) {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
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

export default function Index({ suppliers, filters: filtersProp }) {
    const { flash, auth } = usePage().props;
    const filters = filtersProp ?? {};
    const perms = asStringList(auth?.user?.permissions);

    const canView = !perms.length || perms.includes('suppliers.view');
    const canCreate = !perms.length || perms.includes('suppliers.create');
    const canEdit = !perms.length || perms.includes('suppliers.edit');
    const canDelete = !perms.length || perms.includes('suppliers.delete');

    const [q, setQ] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(route('suppliers.index'), buildQuery({ q: q.trim(), status }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setQ('');
        setStatus('');
        router.get(route('suppliers.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const destroy = (row) => {
        if (!canDelete) return;
        if (
            !window.confirm(
                `Delete supplier "${row.name}"? This is only allowed if there are no purchase invoices.`,
            )
        ) {
            return;
        }
        router.delete(route('suppliers.destroy', row.id));
    };

    if (!canView) {
        return (
            <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>}>
                <Head title="Suppliers" />
                <p className="text-sm text-gray-600">You do not have permission to view suppliers.</p>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                        <p className="mt-1 text-sm text-gray-500">Vendors for purchase invoices and stock intake</p>
                    </div>
                    {canCreate && (
                        <Link
                            href={route('suppliers.create')}
                            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                        >
                            New supplier
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Suppliers" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px] flex-1">
                        <label className={labelClass}>Search</label>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className={inputClass}
                            placeholder="Name, code, email, phone…"
                        />
                    </div>
                    <div className="w-40">
                        <label className={labelClass}>Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Reset
                    </button>
                </form>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Code</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Name</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Contact</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Invoices</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {suppliers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No suppliers found.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                                            {row.code}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {row.name}
                                            {row.business_name ? (
                                                <span className="mt-0.5 block text-xs font-normal text-gray-500">
                                                    {row.business_name}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {[row.email, row.phone].filter(Boolean).join(' · ') || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (row.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-gray-200 text-gray-700')
                                                }
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{row.purchase_invoices_count}</td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {canEdit && (
                                                    <Link
                                                        href={route('suppliers.edit', row.id)}
                                                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </Link>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => destroy(row)}
                                                        disabled={row.purchase_invoices_count > 0}
                                                        title={
                                                            row.purchase_invoices_count > 0
                                                                ? 'Remove purchase invoices first'
                                                                : 'Delete'
                                                        }
                                                        className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={suppliers.links} />
            </div>
        </AuthenticatedLayout>
    );
}
