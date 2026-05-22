import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Show({ user }) {
    const { flash } = usePage().props;
    const verified = Boolean(user.email_verified_at);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user.name}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('users.edit', user.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Edit
                        </Link>
                        <Link
                            href={route('users.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={user.name} />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Phone
                        </dt>
                        <dd className="mt-1 text-gray-900">{user.phone || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Branch
                        </dt>
                        <dd className="mt-1 text-gray-900">{user.branch || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Email status
                        </dt>
                        <dd className="mt-1">
                            <span
                                className={
                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                                    (verified
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800')
                                }
                            >
                                {verified ? 'Verified' : 'Unverified'}
                            </span>
                        </dd>
                    </div>
                </dl>

                <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Roles
                    </h2>
                    {user.roles?.length ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                            {user.roles.map((r) => (
                                <li
                                    key={r}
                                    className="rounded-full bg-brand-muted px-3 py-1 text-sm font-medium text-brand-on-muted"
                                >
                                    {r}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500">No roles assigned.</p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
