import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Show({ branch }) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {branch.users?.length ? (
                                <>
                                    <span className="text-gray-700">
                                        {branch.users.map((u) => u.name).join(', ')}
                                    </span>
                                    <span className="text-gray-400"> · </span>
                                </>
                            ) : (
                                <>
                                    <span className="italic text-gray-400">No users</span>
                                    <span className="text-gray-400"> · </span>
                                </>
                            )}
                            {branch.warehouses_count}{' '}
                            warehouse
                            {branch.warehouses_count === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {perms.includes('branches.edit') && (
                            <Link
                                href={route('branches.edit', branch.id)}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        <Link
                            href={route('branches.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={branch.name} />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Address
                        </dt>
                        <dd className="mt-1 text-gray-900">{branch.address || '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Users
                        </dt>
                        <dd className="mt-1 text-gray-900">
                            {branch.users?.length
                                ? branch.users.map((u) => u.name).join(', ')
                                : '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Phone
                        </dt>
                        <dd className="mt-1 text-gray-900">{branch.phone || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Email
                        </dt>
                        <dd className="mt-1 text-gray-900">{branch.email || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Website
                        </dt>
                        <dd className="mt-1 text-gray-900">{branch.website || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Logo
                        </dt>
                        <dd className="mt-1 text-gray-900">
                            {branch.logo_url ? (
                                <img
                                    src={branch.logo_url}
                                    alt=""
                                    className="h-20 w-20 rounded-lg border border-gray-200 object-contain bg-white"
                                />
                            ) : (
                                '—'
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
                                    (branch.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-gray-200 text-gray-700')
                                }
                            >
                                {branch.status}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>
        </AuthenticatedLayout>
    );
}
