import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useFormatCurrency } from '@/lib/formatCurrency';

const iconStroke = 1.75;

function IconEye({ className }) {
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
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );
}

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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
            />
        </svg>
    );
}

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }

    return (
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Pagination">
            {links.map((link, i) => {
                if (!link.url) {
                    return (
                        <span
                            key={i}
                            className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400"
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
                            'inline-flex min-w-[2.25rem] items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition ' +
                            (link.active
                                ? 'border-brand bg-brand text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
                        }
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

function buildBranchQuery(branchId) {
    if (branchId === '' || branchId == null) {
        return {};
    }
    if (branchId === 'all') {
        return { branch_id: 'all' };
    }
    return { branch_id: branchId };
}

export default function Index({
    expenses,
    expenseTotals = {},
    branches = [],
    filters: filtersProp = {},
    expenseBranchScope = {},
}) {
    const { flash, auth } = usePage().props;
    const perms = auth?.user?.permissions ?? [];

    // Permissions in this project are grouped under accounting.* (see PermissionSeeder).
    // Keep compatibility with older expenses.* keys too.
    const filters = filtersProp ?? {};
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');

    useEffect(() => {
        setBranchId(filters.branch_id ?? '');
    }, [filters.branch_id]);

    const hasPerms = perms.length > 0;
    const hasExpenseAccess =
        !hasPerms ||
        perms.includes('accounting.expenses') ||
        perms.includes('accounting.view') ||
        perms.includes('expenses.view') ||
        perms.includes('expenses.edit') ||
        perms.includes('expenses.delete');

    const canView = hasExpenseAccess;
    const canEdit = hasExpenseAccess;
    const canDelete = hasExpenseAccess;

    const destroy = (id) => {
        if (!window.confirm('Delete this expense?')) {
            return;
        }
        router.delete(route('expenses.destroy', id));
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    const formatCurrency = useFormatCurrency();

    const isSuperAdminScope = expenseBranchScope.is_super_admin === true;

    const applyBranchFilter = (e) => {
        e.preventDefault();
        router.get(route('expenses.index'), buildBranchQuery(branchId), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetBranchFilter = () => {
        setBranchId('');
        router.get(route('expenses.index'), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Track and manage your business expenses
                        </p>
                    </div>
                    {hasExpenseAccess && (
                        <Link
                            href={route('expenses.create')}
                            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            <IconPlus className="h-5 w-5 shrink-0" />
                            New expense
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Expenses" />

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

            {branches.length > 0 && (
                <form
                    className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    onSubmit={applyBranchFilter}
                >
                    <div className="min-w-[12rem] flex-1">
                        <label
                            htmlFor="expense-branch-filter"
                            className="block text-sm font-semibold text-gray-700"
                        >
                            Branch
                        </label>
                        <select
                            id="expense-branch-filter"
                            className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                        >
                            <option value="">Default (header / assigned branch)</option>
                            {isSuperAdminScope && (
                                <option value="all">All branches</option>
                            )}
                            {branches.map((b) => (
                                <option key={b.id} value={String(b.id)}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex h-10 items-center rounded-lg border border-transparent bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={resetBranchFilter}
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Reset
                    </button>
                </form>
            )}

            <p className="mb-4 text-sm text-gray-600">
                {!expenseBranchScope.scoped_branch_id ? (
                    <>
                        List and totals include{' '}
                        <span className="font-semibold text-gray-800">all branches</span>.
                    </>
                ) : (
                    <>
                        List and totals for branch{' '}
                        <span className="font-semibold text-gray-800">
                            {expenseBranchScope.scoped_branch_name ??
                                `Branch #${expenseBranchScope.scoped_branch_id}`}
                        </span>
                        .
                    </>
                )}{' '}
                <span className="text-gray-500">
                    Use the branch filter above to change scope. Week range is Sunday–Saturday.
                </span>
            </p>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Today</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                        {formatCurrency(Number(expenseTotals.today ?? 0))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{expenseTotals.today_label ?? ''}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">This week</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                        {formatCurrency(Number(expenseTotals.week ?? 0))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{expenseTotals.week_label ?? ''}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">This month</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                        {formatCurrency(Number(expenseTotals.month ?? 0))}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{expenseTotals.month_label ?? ''}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Branch
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Reference
                                </th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">
                                    Created By
                                </th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {expenses.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        No expenses yet.
                                    </td>
                                </tr>
                            ) : (
                                expenses.data.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {formatDate(expense.expense_date)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {expense.branch.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {expense.category.name}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {expense.reference_number || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {expense.created_by?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                {canView && (
                                                    <Link
                                                        href={route('expenses.show', expense.id)}
                                                        title="View"
                                                        aria-label="View expense"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-500 shadow-sm transition hover:border-brand/35 hover:bg-brand-muted hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                                                    >
                                                        <IconEye className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {canEdit && (
                                                    <Link
                                                        href={route('expenses.edit', expense.id)}
                                                        title="Edit"
                                                        aria-label="Edit expense"
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-500 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                                                    >
                                                        <IconPencil className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        aria-label="Delete expense"
                                                        onClick={() => destroy(expense.id)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200/70"
                                                    >
                                                        <IconTrash className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-2 flex justify-end">
                <Pagination links={expenses.links} />
            </div>
        </AuthenticatedLayout>
    );
}
