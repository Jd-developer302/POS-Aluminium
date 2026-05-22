import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmployeeForm from './_Form';

function toDateString(v) {
    if (v == null || v === '') {
        return '';
    }
    if (typeof v === 'string') {
        return v.slice(0, 10);
    }
    return '';
}

function appRolesForForm(employee, assignableAppRoles) {
    const names = (employee.user?.roles ?? []).map((r) => (typeof r === 'string' ? r : r.name));
    return names.filter((n) => assignableAppRoles.includes(n));
}

export default function Edit({ employee, branches, departments, designations, users, assignableAppRoles = [] }) {
    const { flash } = usePage().props;
    const { data, setData, put, post, processing, errors, transform } = useForm({
        branch_id: String(employee.branch_id),
        department_id: employee.department_id != null ? String(employee.department_id) : '',
        designation_id: employee.designation_id != null ? String(employee.designation_id) : '',
        user_id: employee.user_id != null ? String(employee.user_id) : '',
        app_roles: appRolesForForm(employee, assignableAppRoles),
        employee_id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone ?? '',
        photo: null,
        remove_photo: false,
        salary: employee.salary != null && employee.salary !== '' ? String(employee.salary) : '',
        joining_date: toDateString(employee.joining_date),
        gender: employee.gender ?? '',
        birth_date: toDateString(employee.birth_date),
        address: employee.address ?? '',
        status: employee.status,
    });

    /**
     * PUT + multipart/form-data is not parsed by PHP (empty $request). When a new photo file is
     * present we must POST with _method=PUT (Laravel method spoofing) so the body is parsed.
     * When there is no file, JSON PUT works and avoids FormData entirely.
     */
    transform((form) => {
        if (form.photo instanceof File) {
            return { ...form, _method: 'put' };
        }
        const { _method: _m, ...rest } = form;
        return rest;
    });

    const submit = (e) => {
        e.preventDefault();
        const url = route('employees.update', employee.employee_id);
        if (data.photo instanceof File) {
            post(url, { forceFormData: true });
        } else {
            put(url);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit employee</h1>
                        <p className="mt-1 text-sm text-gray-500">Update details and assignment</p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${employee.name}`} />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <EmployeeForm
                    isEdit
                    employee={employee}
                    data={data}
                    setData={setData}
                    errors={errors}
                    branches={branches}
                    departments={departments}
                    designations={designations}
                    users={users}
                    assignableAppRoles={assignableAppRoles}
                    onSubmit={submit}
                    processing={processing}
                    submitLabel="Save changes"
                    cancelHref={route('employees.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
