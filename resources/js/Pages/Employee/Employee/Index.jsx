import React, { useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const iconStroke = 1.75;

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

function IconUsersGroup({ className }) {
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-2.022M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        </svg>
    );
}

function IconSearch({ className }) {
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
        </svg>
    );
}

function IconFilter({ className }) {
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
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
            />
        </svg>
    );
}

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }
    return (
        <nav className="flex flex-wrap justify-end gap-1" aria-label="Pagination">
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

const statusClass = (s) => {
    if (s === 'active') {
        return 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200/50';
    }
    if (s === 'terminated') {
        return 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200/50';
    }
    return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/60';
};

const fieldClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

function formatAppRoles(user) {
    if (!user?.roles?.length) {
        return '—';
    }
    return user.roles
        .map((r) => (typeof r === 'string' ? r : r.name))
        .filter(Boolean)
        .join(', ');
}

export default function Index({ employees, branches, departments, designations, filters: filtersProp }) {
    const { flash } = usePage().props;
    const { data, setData, get, processing } = useForm({
        branch_id: filtersProp?.branch_id ?? '',
        department_id: filtersProp?.department_id ?? '',
        designation_id: filtersProp?.designation_id ?? '',
        status: filtersProp?.status ?? '',
        q: filtersProp?.q ?? '',
    });

    const departmentOptions = useMemo(() => {
        if (!data.branch_id) {
            return departments;
        }
        return departments.filter(
            (d) => String(d.branch_id) === String(data.branch_id),
        );
    }, [departments, data.branch_id]);

    const designationOptions = useMemo(() => {
        if (!data.department_id) {
            return designations;
        }
        return designations.filter(
            (d) => String(d.department_id) === String(data.department_id),
        );
    }, [designations, data.department_id]);

    const applyFilters = (e) => {
        e.preventDefault();
        get(route('employees.index'), { preserveState: true });
    };

    const clearFilters = () => {
        setData({
            branch_id: '',
            department_id: '',
            designation_id: '',
            status: '',
            q: '',
        });
        router.get(route('employees.index'));
    };

    const destroy = (employeeId, name) => {
        if (!window.confirm(`Delete employee "${name}"?`)) {
            return;
        }
        router.delete(route('employees.destroy', employeeId));
    };

    const total = employees?.total ?? 0;
    const from = employees?.from;
    const to = employees?.to;
    const hasRows = employees.data.length > 0;
    const rangeText =
        hasRows && from != null && to != null
            ? `Showing ${from}–${to} of ${total}`
            : total === 0
              ? 'No records'
              : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Employees</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Staff directory — roles, branch, and contact in one place
                        </p>
                    </div>
                    {branches.length > 0 && (
                        <Link
                            href={route('employees.create')}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            <IconPlus className="h-5 w-5 shrink-0" />
                            New
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Employees" />

            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
                    {flash.error}
                </div>
            )}

            <section className="mb-5 rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-1 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5 text-gray-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <IconFilter className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold">Filters</h2>
                            <p className="text-xs text-gray-500">Match branch, department, status, or search by name and code</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={applyFilters} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
                        <div className="min-w-0">
                            <label className={labelClass} htmlFor="f-branch">
                                Branch
                            </label>
                            <select
                                id="f-branch"
                                value={data.branch_id}
                                onChange={(e) => {
                                    setData('branch_id', e.target.value);
                                    setData('department_id', '');
                                    setData('designation_id', '');
                                }}
                                className={fieldClass}
                            >
                                <option value="">All branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-0">
                            <label className={labelClass} htmlFor="f-dept">
                                Department
                            </label>
                            <select
                                id="f-dept"
                                value={data.department_id}
                                onChange={(e) => {
                                    setData('department_id', e.target.value);
                                    setData('designation_id', '');
                                }}
                                className={fieldClass}
                            >
                                <option value="">All departments</option>
                                {departmentOptions.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-0 min-[480px]:col-span-2 lg:col-span-1">
                            <label className={labelClass} htmlFor="f-des">
                                Designation
                            </label>
                            <select
                                id="f-des"
                                value={data.designation_id}
                                onChange={(e) => setData('designation_id', e.target.value)}
                                className={fieldClass}
                            >
                                <option value="">All designations</option>
                                {designationOptions.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="-mx-1 flex min-w-0 flex-row flex-nowrap items-end gap-2 overflow-x-auto px-1 pb-0.5 sm:gap-3">
                        <div className="min-w-[8rem] flex-1 basis-0 sm:min-w-0">
                            <label className={labelClass} htmlFor="f-st">
                                Status
                            </label>
                            <select
                                id="f-st"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className={fieldClass}
                            >
                                <option value="">All statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                        <div className="min-w-[8rem] flex-1 basis-0 sm:min-w-0">
                            <label className={labelClass} htmlFor="f-q">
                                Search
                            </label>
                            <div className="relative">
                                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="f-q"
                                    type="search"
                                    value={data.q}
                                    onChange={(e) => setData('q', e.target.value)}
                                    placeholder="Name, code, email, phone…"
                                    className={`${fieldClass} pl-10`}
                                />
                            </div>
                        </div>
                        <div className="shrink-0">
                            <span className={`${labelClass} text-transparent`} aria-hidden>
                                ·
                            </span>
                            <div className="flex flex-nowrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    title="Clear all filters"
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                >
                                    Clear all
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    title="Apply filters"
                                    className="inline-flex min-w-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                >
                                    {processing ? '…' : 'Apply'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </section>

            <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-4 py-3 sm:px-5">
                    <h2 className="text-sm font-semibold text-gray-900">Directory</h2>
                    {hasRows && (
                        <p className="mt-0.5 text-xs text-gray-500">Team members matching your filters</p>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/90">
                                <th
                                    scope="col"
                                    className="w-12 px-3 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    <span className="sm:hidden" aria-hidden>
                                        ·
                                    </span>
                                    <span className="hidden sm:inline">Photo</span>
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Name
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Code
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Email
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell"
                                >
                                    Branch
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell"
                                >
                                    Dept
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell"
                                >
                                    Designation
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell"
                                >
                                    App role
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-end text-xs font-semibold uppercase tracking-wider text-gray-500"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!hasRows ? (
                                <tr>
                                    <td colSpan={10} className="p-0">
                                        <div className="flex flex-col items-center justify-center px-4 py-16 sm:py-20">
                                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 text-brand ring-1 ring-brand/15">
                                                <IconUsersGroup className="h-10 w-10" />
                                            </div>
                                            <h3 className="text-base font-semibold text-gray-900">No employees yet</h3>
                                            <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
                                                Add your first team member to see them here, or adjust filters if you
                                                expect results.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="transition-colors hover:bg-brand/[0.02] odd:bg-white even:bg-gray-50/30"
                                    >
                                        <td className="w-12 px-3 py-3">
                                            {row.photo_url ? (
                                                <img
                                                    src={row.photo_url}
                                                    alt=""
                                                    className="h-9 w-9 rounded-lg object-cover ring-1 ring-gray-200/80 sm:h-10 sm:w-10"
                                                />
                                            ) : (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 text-[10px] font-bold text-gray-600 ring-1 ring-gray-200/80 sm:h-10 sm:w-10 sm:text-xs">
                                                    {row.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                            {row.employee_id}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 break-all sm:break-normal">
                                            {row.email}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                                            {row.branch?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                                            {row.department?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                                            {row.designation?.name ?? '—'}
                                        </td>
                                        <td className="hidden max-w-[10rem] px-4 py-3 text-gray-600 lg:table-cell" title={formatAppRoles(row.user)}>
                                            <span className="line-clamp-2 break-words text-xs">
                                                {formatAppRoles(row.user)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ' +
                                                    statusClass(row.status)
                                                }
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="inline-flex items-center justify-end gap-1">
                                                <Link
                                                    href={route('employees.edit', row.employee_id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                                                    title="Edit"
                                                >
                                                    <IconPencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(row.employee_id, row.name)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition hover:border-red-200 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {hasRows && (employees?.links?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {rangeText && (
                        <p className="order-2 text-center text-xs text-gray-500 sm:order-1 sm:text-start">{rangeText}</p>
                    )}
                    <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
                        <Pagination links={employees.links} />
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
