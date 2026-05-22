import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DepartmentForm from './_Form';

export default function Edit({ department, branches }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        branch_id: String(department.branch_id),
        name: department.name,
        status: department.status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('departments.update', department.slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit department</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Update branch, name, or status (slug is generated from the name)
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${department.name}`} />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <span className="font-medium text-gray-700">URL slug: </span>
                <code className="rounded bg-white px-1.5 py-0.5 text-gray-800">{department.slug}</code>
            </div>

            {branches.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
                    No active branches are available.
                </div>
            ) : (
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <DepartmentForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        branches={branches}
                        onSubmit={submit}
                        processing={processing}
                        submitLabel="Save changes"
                        cancelHref={route('departments.index')}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
