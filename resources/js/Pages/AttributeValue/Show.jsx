import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ attributeValue }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Attribute value details
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Review selected attribute and value.
                        </p>
                    </div>
                    <Link
                        href={route('attribute-values.edit', attributeValue.slug)}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Edit
                    </Link>
                </div>
            }
        >
            <Head title={attributeValue.value} />

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Attribute</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                        {attributeValue.attribute?.name ?? '—'}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Value</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                        {attributeValue.value}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Slug</p>
                    <p className="mt-1 font-mono text-sm text-gray-800">{attributeValue.slug}</p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                    <p className="mt-1">
                        <span
                            className={
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                (attributeValue.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-200 text-gray-700')
                            }
                        >
                            {attributeValue.status}
                        </span>
                    </p>
                </div>

                <div className="pt-2">
                    <Link
                        href={route('attribute-values.index')}
                        className="text-sm font-medium text-brand hover:text-brand-dark"
                    >
                        Back to attribute values
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
