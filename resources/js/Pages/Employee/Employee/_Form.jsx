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

export default function EmployeeForm({
    isEdit = false,
    employee = null,
    data,
    setData,
    errors,
    branches,
    departments,
    designations,
    users = [],
    assignableAppRoles = [],
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
    onCancel,
    userLinkRequired = false,
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
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900">Assignment</h3>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="branch_id">
                        Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="branch_id"
                        value={data.branch_id}
                        onChange={onBranchChange}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="">Select branch</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    {errors.branch_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="department_id">
                        Department
                    </label>
                    <select
                        id="department_id"
                        value={data.department_id}
                        onChange={onDepartmentChange}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="">None</option>
                        {departmentOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.branch?.name ? `${d.name} — ${d.branch.name}` : d.name}
                            </option>
                        ))}
                    </select>
                    {errors.department_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="designation_id">
                        Designation
                    </label>
                    <select
                        id="designation_id"
                        value={data.designation_id}
                        onChange={(e) => setData('designation_id', e.target.value)}
                        disabled={!data.department_id}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                        <option value="">None</option>
                        {designationOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                    {errors.designation_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.designation_id}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="user_id">
                        {userLinkRequired ? 'App user' : 'Link app user'}{' '}
                        {userLinkRequired && <span className="text-red-500">*</span>}
                    </label>
                    <p className="mb-1 text-xs text-gray-500">
                        {userLinkRequired
                            ? 'Pick a user without an employee record yet. Name and email follow the user; branch must match the user’s branch (when the user has a branch). Roles are assigned below.'
                            : 'Optional. Link a user; roles are set below.'}
                    </p>
                    <select
                        id="user_id"
                        name="user_id"
                        value={data.user_id}
                        required={userLinkRequired}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                                setData('user_id', '');
                                return;
                            }
                            const u = users.find(
                                (x) => String(x.id) === String(v),
                            );
                            if (u) {
                                setData({
                                    user_id: v,
                                    name: u.name,
                                    email: u.email,
                                });
                            } else {
                                setData('user_id', v);
                            }
                        }}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        {!userLinkRequired && <option value="">None</option>}
                        {userLinkRequired && <option value="">Select a user…</option>}
                        {users.map((u) => {
                            const roleBits =
                                u.roles && u.roles.length
                                    ? u.roles
                                          .map((r) => (typeof r === 'string' ? r : r.name))
                                          .join(', ')
                                    : 'No role';
                            return (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email}) — {roleBits}
                                </option>
                            );
                        })}
                    </select>
                    {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>}
                </div>
            </div>

            <div className="rounded-lg border border-amber-100/80 bg-amber-50/50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">App roles</h3>
                <p className="mt-0.5 text-xs text-gray-600">
                    Select at least one. These apply to the app login (e.g. Branch Manager, Cashier). Super Admin cannot
                    be assigned here.
                </p>
                {assignableAppRoles.length === 0 ? (
                    <p className="mt-2 text-sm text-amber-800">
                        No assignable roles found. Run role seeders and ensure roles exist besides Super Admin.
                    </p>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {assignableAppRoles.map((role) => (
                            <li key={role}>
                                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand"
                                        checked={(data.app_roles ?? []).includes(role)}
                                        onChange={() => toggleRoleInData(setData, data, role)}
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

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="employee_id">
                        Employee code{' '}
                        {!employeeIdAuto && <span className="text-red-500">*</span>}
                    </label>
                    {employeeIdAuto && (
                        <p className="mb-1 text-xs text-gray-500">
                            Leave blank to auto-generate (e.g. EMP00001, EMP00002).
                        </p>
                    )}
                    <input
                        id="employee_id"
                        name="employee_id"
                        type="text"
                        value={data.employee_id ?? ''}
                        onChange={(e) => setData('employee_id', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        placeholder={employeeIdAuto ? 'Auto (EMP00001…)' : 'e.g. EMP00001'}
                    />
                    {errors.employee_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                        Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
                        Phone
                    </label>
                    <input
                        id="phone"
                        type="text"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="salary">
                        Current salary
                    </label>
                    <p className="mt-0.5 text-xs text-gray-500">Optional — latest monthly amount</p>
                    <input
                        id="salary"
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.salary}
                        onChange={(e) => setData('salary', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        placeholder="Leave blank if not set"
                    />
                    {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="joining_date">
                        Joining date <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="joining_date"
                        type="date"
                        value={dateInputValue(data.joining_date)}
                        onChange={(e) => setData('joining_date', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {errors.joining_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.joining_date}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="gender">
                        Gender
                    </label>
                    <select
                        id="gender"
                        value={data.gender}
                        onChange={(e) => setData('gender', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="">Unspecified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="birth_date">
                        Birth date
                    </label>
                    <input
                        id="birth_date"
                        type="date"
                        value={dateInputValue(data.birth_date)}
                        onChange={(e) => setData('birth_date', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {errors.birth_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="status">
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                    </select>
                    {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="address">
                    Address
                </label>
                <textarea
                    id="address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="photo">
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
                        if (isEdit && data.remove_photo) {
                            setData('remove_photo', false);
                        }
                    }}
                    className="mt-1 block w-full text-sm text-gray-600 file:me-2 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                />
                {isEdit && employee?.photo_url && !data.remove_photo && (
                    <div className="mt-2 flex items-start gap-3">
                        <img
                            src={employee.photo_url}
                            alt=""
                            className="h-20 w-20 rounded-lg object-cover ring-1 ring-gray-200"
                        />
                        <label className="mt-0 flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={data.remove_photo}
                                onChange={(e) => setData('remove_photo', e.target.checked)}
                                className="rounded border-gray-300 text-brand focus:ring-brand"
                            />
                            Remove current photo
                        </label>
                    </div>
                )}
                {errors.photo && <p className="mt-1 text-sm text-red-600">{errors.photo}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-6">
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                ) : (
                    <Link
                        href={cancelHref}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                )}
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
