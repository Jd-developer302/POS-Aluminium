import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveTypeForm from './_Form';

export default function Create() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        days_per_year: 0,
        is_paid: true,
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('leave-types.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New leave type</h1>
                        <p className="mt-1 text-sm text-gray-500">Define a leave policy and yearly allowance</p>
                    </div>
                </div>
            }
        >
            <Head title="Create leave type" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <LeaveTypeForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    onSubmit={submit}
                    processing={processing}
                    submitLabel="Create"
                    cancelHref={route('leave-types.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
