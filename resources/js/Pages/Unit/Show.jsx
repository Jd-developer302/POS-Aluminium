import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Show({ unit }) {
    const { auth, flash } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Unit details</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {unit.name}
                            {unit.symbol ? ` (${unit.symbol})` : ''}
                        </p>
                    </div>
                    {perms.includes('units.edit') && (
                        <Link
                            href={route('units.edit', unit.slug)}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Edit
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={unit.name} />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{unit.name}</p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Slug</p>
                    <p className="mt-1 font-mono text-sm text-gray-800">{unit.slug}</p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Symbol</p>
                    <p className="mt-1 text-sm text-gray-800">{unit.symbol || '—'}</p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                    <p className="mt-1">
                        <span
                            className={
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ' +
                                (unit.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-200 text-gray-700')
                            }
                        >
                            {unit.status}
                        </span>
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Products</p>
                    <p className="mt-1 text-sm text-gray-800">{unit.products_count}</p>
                </div>

                <div className="pt-2">
                    <Link
                        href={route('units.index')}
                        className="text-sm font-medium text-brand hover:text-brand-dark"
                    >
                        Back to units
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
