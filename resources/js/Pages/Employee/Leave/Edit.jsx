import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveForm from './_Form';

function dateStr(v) {
    if (v == null || v === '') {
        return '';
    }
    if (typeof v === 'string') {
        return v.slice(0, 10);
    }
    return String(v).slice(0, 10);
}

export default function Edit({ leave, employees, leaveTypes }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        employee_id: String(leave.employee_id),
        leave_type_id: String(leave.leave_type_id),
        start_date: dateStr(leave.start_date),
        end_date: dateStr(leave.end_date),
        reason: leave.reason ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('leaves.update', leave.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit leave request</h1>
                        <p className="mt-1 text-sm text-gray-500">Only pending requests can be changed</p>
                    </div>
                </div>
            }
        >
            <Head title="Edit leave request" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <LeaveForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    employees={employees}
                    leaveTypes={leaveTypes}
                    onSubmit={submit}
                    processing={processing}
                    submitLabel="Save"
                    cancelHref={route('leaves.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
