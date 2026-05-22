import React, { useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const iconStroke = 1.75;

const inField =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

function IconPencil({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.697.395l-4.62.951 1.027-4.622a4.5 4.5 0 0 1 .395-1.697L16.862 4.487Zm0 0L19.5 7.125"
            />
        </svg>
    );
}

function IconTrash({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

function IconPlus({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }
    return (
        <nav className="mt-6 flex flex-wrap justify-end gap-1" aria-label="Pagination">
            {links.map((link, i) => {
                if (!link.url) {
                    return (
                        <span
                            key={i}
                            className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400"
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
                            'inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ' +
                            (link.active
                                ? 'border-brand bg-brand text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50')
                        }
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

export default function Index({ leaveBalances, employees, leaveTypes, branches, filters: filtersProp }) {
    const { flash } = usePage().props;
    const { data, setData, get, processing } = useForm({
        branch_id: filtersProp?.branch_id ?? '',
        employee_id: filtersProp?.employee_id ?? '',
        leave_type_id: filtersProp?.leave_type_id ?? '',
        q: filtersProp?.q ?? '',
    });

    const employeesForFilter = useMemo(() => {
        if (!data.branch_id) {
            return employees;
        }
        return employees.filter((e) => String(e.branch_id) === String(data.branch_id));
    }, [employees, data.branch_id]);

    const applyFilters = (e) => {
        e.preventDefault();
        get(route('leave-balances.index'), { preserveState: true });
    };

    const clearFilters = () => {
        setData({ branch_id: '', employee_id: '', leave_type_id: '', q: '' });
        router.get(route('leave-balances.index'));
    };

    const onBranchFilterChange = (e) => {
        const v = e.target.value;
        setData('branch_id', v);
        if (v && data.employee_id) {
            const still = employees.some(
                (x) =>
                    String(x.id) === String(data.employee_id) && String(x.branch_id) === String(v),
            );
            if (!still) {
                setData('employee_id', '');
            }
        }
    };

    const hasRows = leaveBalances.data?.length > 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Leave balances</h1>
                        <p className="mt-1 text-sm text-gray-500">Total, used, and remaining days by employee &amp; type</p>
                    </div>
                    <Link
                        href={route('leave-balances.create')}
                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                    >
                        <IconPlus className="h-5 w-5 shrink-0" />
                        New balance
                    </Link>
                </div>
            }
        >
            <Head title="Leave balances" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <form
                onSubmit={applyFilters}
                className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
            >
                <div className="min-w-0 sm:max-w-[11rem]">
                    <label className="block text-xs font-medium text-gray-600">Branch</label>
                    <select
                        value={data.branch_id}
                        onChange={onBranchFilterChange}
                        className={inField}
                    >
                        <option value="">All</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-0 sm:max-w-[14rem]">
                    <label className="block text-xs font-medium text-gray-600">Employee</label>
                    <select
                        value={data.employee_id}
                        onChange={(e) => setData('employee_id', e.target.value)}
                        className={inField}
                    >
                        <option value="">All</option>
                        {employeesForFilter.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.name} ({e.employee_id})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-0 sm:max-w-[12rem]">
                    <label className="block text-xs font-medium text-gray-600">Leave type</label>
                    <select
                        value={data.leave_type_id}
                        onChange={(e) => setData('leave_type_id', e.target.value)}
                        className={inField}
                    >
                        <option value="">All</option>
                        {leaveTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-0 flex-1 sm:max-w-sm">
                    <label className="block text-xs font-medium text-gray-600">Search</label>
                    <input
                        type="search"
                        value={data.q}
                        onChange={(e) => setData('q', e.target.value)}
                        className={inField}
                        placeholder="Employee or leave type"
                    />
                </div>
                <div className="flex flex-wrap gap-2 sm:ms-auto">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50"
                    >
                        Clear
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">Leave type</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Used</th>
                            <th className="px-4 py-3">Remaining</th>
                            <th className="w-1 px-4 py-3 text-right"> </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {hasRows ? (
                            leaveBalances.data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/80">
                                    <td className="px-4 py-3 text-gray-900">
                                        <span className="font-medium">{row.employee?.name}</span>
                                        <span className="text-gray-500"> — {row.employee?.employee_id}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800">{row.leave_type?.name}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.total_days}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.used_days}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {row.remaining_days ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center justify-end gap-1">
                                            <Link
                                                href={route('leave-balances.edit', row.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand hover:bg-brand/10"
                                                title="Edit"
                                            >
                                                <IconPencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!window.confirm('Remove this leave balance?')) {
                                                        return;
                                                    }
                                                    router.delete(route('leave-balances.destroy', row.id), {
                                                        preserveScroll: true,
                                                    });
                                                }}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <IconTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                >
                                    No leave balances for these filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={leaveBalances.links} />
        </AuthenticatedLayout>
    );
}
