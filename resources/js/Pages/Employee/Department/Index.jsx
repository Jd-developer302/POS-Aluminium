import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const iconStroke = 1.75;

function IconPencil({ className }) {
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
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.697.395l-4.62.951 1.027-4.622a4.5 4.5 0 0 1 .395-1.697L16.862 4.487Zm0 0L19.5 7.125"
            />
        </svg>
    );
}

function IconTrash({ className }) {
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
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
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

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }

    return (
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Pagination">
            {links.map((link, i) => {
                if (!link.url) {
                    return (
                        <span
                            key={i}
                            className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400"
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
    );
}

export default function Index({ departments, branches, filters: filtersProp }) {
    const { flash } = usePage().props;

    const { data, setData, get, processing } = useForm({
        branch_id: filtersProp?.branch_id ?? '',
        status: filtersProp?.status ?? '',
        q: filtersProp?.q ?? '',
    });

    const applyFilters = (e) => {
        e.preventDefault();
        get(route('departments.index'), {
            preserveState: true,
        });
    };

    const clearFilters = () => {
        setData({ branch_id: '', status: '', q: '' });
        router.get(route('departments.index'));
    };

    const destroy = (slug, name) => {
        if (!window.confirm(`Delete department "${name}"?`)) {
            return;
        }
        router.delete(route('departments.destroy', slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Organize teams by branch
                        </p>
                    </div>
                    {branches.length > 0 && (
                        <Link
                            href={route('departments.create')}
                            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            <IconPlus className="h-5 w-5 shrink-0" />
                            New
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Departments" />

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

            <form
                onSubmit={applyFilters}
                className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
            >
                <div className="min-w-0 flex-1 sm:max-w-xs">
                    <label className="block text-xs font-medium text-gray-600">Branch</label>
                    <select
                        value={data.branch_id}
                        onChange={(e) => setData('branch_id', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="">All branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-0 sm:w-40">
                    <label className="block text-xs font-medium text-gray-600">Status</label>
                    <select
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div className="min-w-0 flex-1 sm:max-w-sm">
                    <label className="block text-xs font-medium text-gray-600">Search</label>
                    <input
                        type="search"
                        value={data.q}
                        onChange={(e) => setData('q', e.target.value)}
                        placeholder="Name or slug…"
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Clear
                    </button>
                </div>
            </form>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Name</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Slug</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {departments.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No departments found.
                                    </td>
                                </tr>
                            ) : (
                                departments.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {row.branch?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                            {row.slug}
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
                                        <td className="px-4 py-3 text-end">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={route('departments.edit', row.slug)}
                                                    title="Edit"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200/60"
                                                >
                                                    <IconPencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    title="Delete"
                                                    onClick={() => destroy(row.slug, row.name)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200/70"
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </button>
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
                <Pagination links={departments.links} />
            </div>
        </AuthenticatedLayout>
    );
}
