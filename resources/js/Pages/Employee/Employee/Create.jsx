import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmployeeFormCreatePage from './_FormCreatePage';

export default function Create({ branches, departments, designations, assignableAppRoles = [] }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        app_roles: [],
        password: '',
        password_confirmation: '',
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_id: '',
        name: '',
        email: '',
        phone: '',
        photo: null,
        salary: '',
        joining_date: new Date().toISOString().slice(0, 10),
        gender: '',
        birth_date: '',
        address: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        // Multipart is required only for file uploads. JSON post avoids FormData edge cases
        // and keeps the request smaller when no image is selected.
        const url = route('employees.store');
        if (data.photo instanceof File) {
            post(url, { forceFormData: true });
        } else {
            post(url);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Employee" />

            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <Link
                        href={route('employees.index')}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-brand"
                    >
                        <span aria-hidden>←</span> Back
                    </Link>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        Create Employee
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 sm:text-base">
                        Creates a new user account and employee profile in one step.
                    </p>
                </div>

                {flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {branches.length === 0 ? (
                    <div className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-6 text-sm text-amber-900 shadow-sm">
                        No branches available. Create a branch first.
                    </div>
                ) : (
                    <EmployeeFormCreatePage
                        data={data}
                        setData={setData}
                        errors={errors}
                        branches={branches}
                        departments={departments}
                        designations={designations}
                        assignableAppRoles={assignableAppRoles}
                        onSubmit={submit}
                        processing={processing}
                        submitLabel="Save"
                        cancelHref={route('employees.index')}
                        employeeIdAuto
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
