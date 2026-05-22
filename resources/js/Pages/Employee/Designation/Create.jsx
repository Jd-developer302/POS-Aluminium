import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DesignationForm from './_Form';

export default function Create({ departments }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        department_id: '',
        name: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('designations.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New designation</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Add a job title or role under a department
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Create Designation" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            {departments.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
                    No active departments are available. Create a department first before adding
                    designations.
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
                        submitLabel="Create"
                        cancelHref={route('designations.index')}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
