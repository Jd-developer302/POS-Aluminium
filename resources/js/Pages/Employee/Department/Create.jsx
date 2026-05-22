import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DepartmentForm from './_Form';

export default function Create({ branches }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        name: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('departments.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New department</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Add a department under a branch
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Create Department" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            {branches.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
                    No active branches are available. Create a branch first before adding departments.
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
                        submitLabel="Create"
                        cancelHref={route('departments.index')}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
