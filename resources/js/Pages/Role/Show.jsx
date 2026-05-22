import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function groupByPrefix(names) {
    const groups = {};
    names.forEach((name) => {
        const key = String(name).includes('.')
            ? String(name).split('.')[0]
            : 'other';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(name);
    });
    return Object.keys(groups)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            items: groups[key].sort((a, b) => a.localeCompare(b)),
        }));
}

export default function Show({ role }) {
    const { flash } = usePage().props;
    const groups = groupByPrefix(role.permissions);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {role.name}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {role.permissions.length} permission
                            {role.permissions.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('roles.edit', role.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Edit
                        </Link>
                        <Link
                            href={route('roles.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={role.name} />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            <div className="space-y-4">
                {groups.length === 0 ? (
                    <p className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                        This role has no permissions assigned.
                    </p>
                ) : (
                    groups.map((group) => (
                        <div
                            key={group.key}
                            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                                {group.label}
                            </h2>
                            <ul className="mt-3 flex flex-wrap gap-2">
                                {group.items.map((name) => (
                                    <li
                                        key={name}
                                        className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand-on-muted"
                                    >
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}
