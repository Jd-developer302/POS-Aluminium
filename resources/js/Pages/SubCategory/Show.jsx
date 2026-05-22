import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Show({ subCategory }) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {subCategory.name}
                        </h1>
                        <p className="mt-1 font-mono text-sm text-gray-500">
                            {subCategory.slug}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {perms.includes('sub_categories.edit') && (
                            <Link
                                href={route(
                                    'sub-categories.edit',
                                    subCategory.slug,
                                )}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        <Link
                            href={route('sub-categories.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={subCategory.name} />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <dl className="grid gap-4 sm:grid-cols-2 sm:items-start">
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Category
                        </dt>
                        <dd className="mt-1 text-gray-900">
                            {subCategory.category ? (
                                perms.includes('categories.view') ? (
                                    <Link
                                        href={route(
                                            'categories.show',
                                            subCategory.category.slug,
                                        )}
                                        className="font-medium text-brand hover:underline"
                                    >
                                        {subCategory.category.name}
                                    </Link>
                                ) : (
                                    <span className="font-medium">
                                        {subCategory.category.name}
                                    </span>
                                )
                            ) : (
                                <span className="text-gray-500">—</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Image
                        </dt>
                        <dd className="mt-1 inline-block">
                            {subCategory.image_url ? (
                                <img
                                    src={subCategory.image_url}
                                    alt=""
                                    className="h-20 max-h-20 w-auto max-w-[10rem] rounded-lg border border-gray-200 object-contain object-left"
                                />
                            ) : (
                                <span className="text-gray-500">—</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Status
                        </dt>
                        <dd className="mt-1">
                            <span
                                className={
                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                                    (subCategory.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-gray-200 text-gray-700')
                                }
                            >
                                {subCategory.status}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>
        </AuthenticatedLayout>
    );
}
