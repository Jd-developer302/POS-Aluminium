import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const iconStroke = 1.75;

function IconEye({ className }) {
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
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );
}

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

export default function Index({ warehouses }) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    const destroy = (id, name) => {
        if (!window.confirm(`Delete warehouse "${name}"?`)) {
            return;
        }
        router.delete(route('warehouses.destroy', id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Storage locations by branch
                        </p>
                    </div>
                    {perms.includes('warehouses.create') && (
                        <Link
                            href={route('warehouses.create')}
                            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            <IconPlus className="h-5 w-5 shrink-0" />
                            New warehouse
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Warehouses" />

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

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Code
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Branch
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Default
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {warehouses.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No warehouses yet.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.data.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-mono text-sm text-gray-800">
                                            {w.code}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {w.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {w.branch?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {w.is_default ? (
                                                <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                                                    Default
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                    (w.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-gray-200 text-gray-700')
                                                }
                                            >
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                {perms.includes('warehouses.view') && (
                                                    <Link
                                                        href={route('warehouses.show', w.id)}
                                                        title="View"
                                                        aria-label={`View warehouse ${w.name}`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-500 shadow-sm transition hover:border-brand/35 hover:bg-brand-muted hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                                                    >
                                                        <IconEye className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {perms.includes('warehouses.edit') && (
                                                    <Link
                                                        href={route('warehouses.edit', w.id)}
                                                        title="Edit"
                                                        aria-label={`Edit warehouse ${w.name}`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-500 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                                                    >
                                                        <IconPencil className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {perms.includes('warehouses.delete') && (
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        aria-label={`Delete warehouse ${w.name}`}
                                                        onClick={() => destroy(w.id, w.name)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200/70"
                                                    >
                                                        <IconTrash className="h-4 w-4" />
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
                <Pagination links={warehouses.links} />
            </div>
        </AuthenticatedLayout>
    );
}
