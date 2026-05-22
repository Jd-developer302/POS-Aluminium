import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

function Pagination({ links }) {
    if (!links?.length) return null;

    return (
        <nav className="mt-4 flex flex-wrap gap-1">
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

export default function Index({ attributeValues }) {
    const { flash } = usePage().props;

    const destroy = (slug, _value) => {
        router.delete(route('attribute-values.destroy', slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attribute values</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage values like Red, Black, S, M.
                        </p>
                    </div>
                    <Link
                        href={route('attribute-values.create')}
                        className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        New value
                    </Link>
                </div>
            }
        >
            <Head title="Attribute values" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Value
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Attribute
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attributeValues.data.length === 0 ? (
                            <tr>
                                <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                                    No values yet.
                                </td>
                            </tr>
                        ) : (
                            attributeValues.data.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {item.value}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {item.attribute?.name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                (item.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-gray-200 text-gray-700')
                                            }
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={route('attribute-values.show', item.slug)}
                                                className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={route('attribute-values.edit', item.slug)}
                                                className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => destroy(item.slug, item.value)}
                                                className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={attributeValues.links} />
            </div>
        </AuthenticatedLayout>
    );
}
