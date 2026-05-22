import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Show({ warehouse }) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            <span className="font-mono text-gray-700">{warehouse.code}</span>
                            <span className="text-gray-400"> · </span>
                            {warehouse.branch?.name ?? '—'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {perms.includes('warehouses.edit') && (
                            <Link
                                href={route('warehouses.edit', warehouse.id)}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        <Link
                            href={route('warehouses.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={warehouse.name} />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Branch
                        </dt>
                        <dd className="mt-1 text-gray-900">
                            {warehouse.branch?.name ?? '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Code
                        </dt>
                        <dd className="mt-1 font-mono text-gray-900">{warehouse.code}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Address
                        </dt>
                        <dd className="mt-1 text-gray-900">{warehouse.address || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Phone
                        </dt>
                        <dd className="mt-1 text-gray-900">{warehouse.phone || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Default
                        </dt>
                        <dd className="mt-1">
                            {warehouse.is_default ? (
                                <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                                    Yes
                                </span>
                            ) : (
                                <span className="text-gray-500">No</span>
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
                                    (warehouse.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-gray-200 text-gray-700')
                                }
                            >
                                {warehouse.status}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>
        </AuthenticatedLayout>
    );
}
