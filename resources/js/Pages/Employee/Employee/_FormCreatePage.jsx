import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';

function dateInputValue(v) {
    if (v == null || v === '') {
        return '';
    }
    if (typeof v === 'string') {
        return v.slice(0, 10);
    }
    return '';
}

function toggleRoleInData(setData, data, roleName) {
    const current = data.app_roles ?? [];
    if (current.includes(roleName)) {
        setData(
            'app_roles',
            current.filter((r) => r !== roleName),
        );
    } else {
        setData('app_roles', [...current, roleName]);
    }
}

const inField =
    'mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelC = 'block text-sm font-medium text-gray-700';
const card = 'overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm';

/**
 * Full-page create employee: always new user + employee (no "existing user" link).
 */
export default function EmployeeFormCreatePage({
    data,
    setData,
    errors,
    branches,
    departments,
    designations,
    assignableAppRoles = [],
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
    employeeIdAuto = false,
}) {
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
            return [];
        }
        return designations.filter(
            (d) => String(d.department_id) === String(data.department_id),
        );
    }, [designations, data.department_id]);

    const onBranchChange = (e) => {
        setData('branch_id', e.target.value);
        setData('department_id', '');
        setData('designation_id', '');
    };

    const onDepartmentChange = (e) => {
        setData('department_id', e.target.value);
        setData('designation_id', '');
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6" encType="multipart/form-data">
            <section className={card}>
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <h2 className="text-base font-semibold text-gray-900">User account</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        New login and app roles (Super Admin is not available here).
                    </p>
                </div>
                <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelC} htmlFor="name">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={inField}
                            />
                            {errors.name && (
                                <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className={labelC} htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={inField}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className={labelC} htmlFor="phone">
                            Phone
                        </label>
                        <input
                            id="phone"
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className={inField}
                        />
                        {errors.phone && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                        )}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelC} htmlFor="password">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                value={data.password ?? ''}
                                onChange={(e) => setData('password', e.target.value)}
                                className={inField}
                            />
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelC} htmlFor="password_confirmation">
                                Confirm password <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                value={data.password_confirmation ?? ''}
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                className={inField}
                            />
                        </div>
                    </div>

                    <div>
                        <p className={labelC}>
                            App roles <span className="text-red-500">*</span>
                        </p>
                        <p className="mb-2 text-xs text-gray-500">
                            At least one (e.g. Cashier, Branch Manager). Super Admin cannot be set here.
                        </p>
                        {assignableAppRoles.length === 0 ? (
                            <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-900">
                                No assignable roles. Run database seeders.
                            </p>
                        ) : (
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {assignableAppRoles.map((role) => (
                                    <li key={role}>
                                        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2.5 text-sm text-gray-800 transition hover:border-brand/30 hover:bg-white">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-brand focus:ring-brand"
                                                checked={(data.app_roles ?? []).includes(role)}
                                                onChange={() =>
                                                    toggleRoleInData(setData, data, role)
                                                }
                                            />
                                            <span>{role}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {errors.app_roles && (
                            <p className="mt-2 text-sm text-red-600">{errors.app_roles}</p>
                        )}
                    </div>
                </div>
            </section>

            <section className={card}>
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <h2 className="text-base font-semibold text-gray-900">Employee profile</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Branch, job details, and personal information.
                    </p>
                </div>
                <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                    <div>
                        <label className={labelC} htmlFor="branch_id">
                            Branch <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="branch_id"
                            value={data.branch_id}
                            onChange={onBranchChange}
                            className={inField}
                        >
                            <option value="">Select branch</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        {errors.branch_id && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.branch_id}</p>
                        )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelC} htmlFor="department_id">
                                Department
                            </label>
                            <select
                                id="department_id"
                                value={data.department_id}
                                onChange={onDepartmentChange}
                                className={inField}
                            >
                                <option value="">None</option>
                                {departmentOptions.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.branch?.name
                                            ? `${d.name} — ${d.branch.name}`
                                            : d.name}
                                    </option>
                                ))}
                            </select>
                            {errors.department_id && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.department_id}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelC} htmlFor="designation_id">
                                Designation
                            </label>
                            <select
                                id="designation_id"
                                value={data.designation_id}
                                onChange={(e) => setData('designation_id', e.target.value)}
                                disabled={!data.department_id}
                                className={
                                    inField + ' disabled:cursor-not-allowed disabled:bg-slate-50'
                                }
                            >
                                <option value="">None</option>
                                {designationOptions.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                            {errors.designation_id && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.designation_id}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelC} htmlFor="employee_id">
                                Employee ID {!employeeIdAuto && <span className="text-red-500">*</span>}
                            </label>
                            {employeeIdAuto && (
                                <p className="mb-1 text-xs text-gray-500">Auto if empty (e.g. EMP00001)</p>
                            )}
                            <input
                                id="employee_id"
                                name="employee_id"
                                type="text"
                                value={data.employee_id ?? ''}
                                onChange={(e) => setData('employee_id', e.target.value)}
                                className={inField}
                                placeholder="Auto if empty"
                            />
                            {errors.employee_id && (
                                <p className="mt-1.5 text-sm text-red-600">{errors.employee_id}</p>
                            )}
                        </div>
                        <div>
                            <label className={labelC} htmlFor="status">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className={inField}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelC} htmlFor="joining_date">
                                Joining date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="joining_date"
                                type="date"
                                value={dateInputValue(data.joining_date)}
                                onChange={(e) => setData('joining_date', e.target.value)}
                                className={inField}
                            />
                            {errors.joining_date && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.joining_date}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelC} htmlFor="salary">
                                Basic salary
                            </label>
                            <p className="mb-1 text-xs text-gray-500">Optional — current monthly</p>
                            <input
                                id="salary"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.salary}
                                onChange={(e) => setData('salary', e.target.value)}
                                className={inField}
                            />
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className={labelC} htmlFor="gender">
                                Gender
                            </label>
                            <select
                                id="gender"
                                value={data.gender}
                                onChange={(e) => setData('gender', e.target.value)}
                                className={inField}
                            >
                                <option value="">Unspecified</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelC} htmlFor="birth_date">
                                Birth date
                            </label>
                            <input
                                id="birth_date"
                                type="date"
                                value={dateInputValue(data.birth_date)}
                                onChange={(e) => setData('birth_date', e.target.value)}
                                className={inField}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelC} htmlFor="address">
                            Address
                        </label>
                        <textarea
                            id="address"
                            rows={3}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className={inField + ' resize-y'}
                        />
                        {errors.address && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.address}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelC} htmlFor="photo">
                            Photo
                        </label>
                        <input
                            id="photo"
                            name="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setData('photo', file);
                            }}
                            className="mt-1.5 block w-full text-sm text-gray-600 file:me-2 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                        />
                        {errors.photo && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.photo}</p>
                        )}
                    </div>
                </div>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200/80 pt-6">
                <Link
                    href={cancelHref}
                    className="inline-flex min-h-11 min-w-[6.5rem] items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex min-h-11 min-w-[6.5rem] items-center justify-center gap-2 rounded-xl border border-transparent bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.75}
                        stroke="currentColor"
                        aria-hidden
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                    </svg>
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
