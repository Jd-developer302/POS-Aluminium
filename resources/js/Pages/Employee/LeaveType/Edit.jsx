import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveTypeForm from './_Form';

export default function Edit({ leaveType }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        name: leaveType.name,
        days_per_year: leaveType.days_per_year ?? 0,
        is_paid: Boolean(leaveType.is_paid),
        status: leaveType.status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('leave-types.update', leaveType.slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit leave type</h1>
                        <p className="mt-1 text-sm text-gray-500">Update name, allowance, and status</p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${leaveType.name}`} />

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
                    submitLabel="Save"
                    cancelHref={route('leave-types.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
