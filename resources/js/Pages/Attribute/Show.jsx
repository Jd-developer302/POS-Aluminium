import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ attribute }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Attribute details
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Review attribute and linked values.
                        </p>
                    </div>
                    <Link
                        href={route('attributes.edit', attribute.slug)}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={attribute.name} />

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                        {attribute.name}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Slug</p>
                    <p className="mt-1 font-mono text-sm text-gray-800">{attribute.slug}</p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                    <p className="mt-1">
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
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                        Values
                    </p>
                    {attribute.values.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-500">
                            No values linked yet.
                        </p>
                    ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {attribute.values.map((item) => (
                                <span
                                    key={item.id}
                                    className="rounded-full bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand-on-muted"
                                >
                                    {item.value}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <Link
                        href={route('attributes.index')}
                        className="text-sm font-medium text-brand hover:text-brand-dark"
                    >
                        Back to attributes
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
