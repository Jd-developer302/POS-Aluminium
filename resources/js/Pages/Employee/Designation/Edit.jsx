import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DesignationForm from './_Form';

export default function Edit({ designation, departments }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        department_id: String(designation.department_id),
        name: designation.name,
        status: designation.status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('designations.update', designation.slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit designation</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Update department, title, or status (slug follows the name)
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${designation.name}`} />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <span className="font-medium text-gray-700">URL slug: </span>
                <code className="rounded bg-white px-1.5 py-0.5 text-gray-800">
                    {designation.slug}
                </code>
            </div>

            {departments.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
                    No active departments are available.
                </div>
            ) : (
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <DesignationForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        departments={departments}
                        onSubmit={submit}
                        processing={processing}
                        submitLabel="Save changes"
                        cancelHref={route('designations.index')}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
