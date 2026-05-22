import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveBalanceForm from './_Form';

export default function Edit({ leaveBalance, employees, leaveTypes }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        employee_id: String(leaveBalance.employee_id),
        leave_type_id: String(leaveBalance.leave_type_id),
        total_days: String(leaveBalance.total_days ?? 0),
        used_days: String(leaveBalance.used_days ?? 0),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('leave-balances.update', leaveBalance.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit leave balance</h1>
                        <p className="mt-1 text-sm text-gray-500">Update totals and used days</p>
                    </div>
                </div>
            }
        >
            <Head title="Edit leave balance" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <LeaveBalanceForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    employees={employees}
                    leaveTypes={leaveTypes}
                    onSubmit={submit}
                    processing={processing}
                    submitLabel="Save"
                    cancelHref={route('leave-balances.index')}
                    isEdit
                />
            </div>
        </AuthenticatedLayout>
    );
}
