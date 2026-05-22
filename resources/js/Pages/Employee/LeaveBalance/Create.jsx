import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveBalanceForm from './_Form';

export default function Create({ employees, leaveTypes }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        leave_type_id: '',
        total_days: '',
        used_days: '0',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('leave-balances.store'));
    };

    const empty = employees.length === 0 || leaveTypes.length === 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New leave balance</h1>
                        <p className="mt-1 text-sm text-gray-500">Allocate days per leave type for an employee</p>
                    </div>
                </div>
            }
        >
            <Head title="Create leave balance" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            {empty ? (
                <div className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-6 text-sm text-amber-900 shadow-sm">
                    {employees.length === 0
                        ? 'Add active employees first.'
                        : 'Add active leave types first.'}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <LeaveBalanceForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        employees={employees}
                        leaveTypes={leaveTypes}
                        onSubmit={submit}
                        processing={processing}
                        submitLabel="Create"
                        cancelHref={route('leave-balances.index')}
                        isEdit={false}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
