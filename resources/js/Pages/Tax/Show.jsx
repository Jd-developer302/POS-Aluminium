import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function rateLabel(tax) {
    if (tax.type === 'percentage') {
        return `${tax.rate}%`;
    }
    return tax.rate;
}

export default function Show({ tax }) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    const canEdit =
        perms.includes('taxes.edit') || perms.includes('settings.taxes');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{tax.name}</h1>
                        <p className="mt-1 font-mono text-sm text-gray-500">{tax.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canEdit && (
                            <Link
                                href={route('taxes.edit', tax.slug)}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Edit
                            </Link>
                        )}
                        <Link
                            href={route('taxes.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={tax.name} />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Code
                        </dt>
                        <dd className="mt-1 font-mono text-sm text-gray-900">
                            {tax.code}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Type
                        </dt>
                        <dd className="mt-1 capitalize text-gray-900">{tax.type}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Rate
                        </dt>
                        <dd className="mt-1 text-gray-900">{rateLabel(tax)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Status
                        </dt>
                        <dd className="mt-1">
                            <span
                                className={
                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                                    (tax.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-gray-200 text-gray-700')
                                }
                            >
                                {tax.status}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>
        </AuthenticatedLayout>
    );
}
