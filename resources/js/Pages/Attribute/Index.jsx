import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }

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

export default function Index({ attributes }) {
    const { flash } = usePage().props;

    const destroy = (slug, _name) => {
        router.delete(route('attributes.destroy', slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attributes</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage variant attributes like Color and Size.
                        </p>
                    </div>
                    <Link
                        href={route('attributes.create')}
                        className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                        New attribute
                    </Link>
                </div>
            }
        >
            <Head title="Attributes" />

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
                                Name
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                Values
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
                        {attributes.data.length === 0 ? (
                            <tr>
                                <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                                    No attributes yet.
                                </td>
                            </tr>
                        ) : (
                            attributes.data.map((attribute) => (
                                <tr key={attribute.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {attribute.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {attribute.values_count}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={
                                                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                                (attribute.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-gray-200 text-gray-700')
                                            }
                                        >
                                            {attribute.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={route('attributes.show', attribute.slug)}
                                                className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={route('attributes.edit', attribute.slug)}
                                                className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    destroy(attribute.slug, attribute.name)
                                                }
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
                <Pagination links={attributes.links} />
            </div>
        </AuthenticatedLayout>
    );
}
