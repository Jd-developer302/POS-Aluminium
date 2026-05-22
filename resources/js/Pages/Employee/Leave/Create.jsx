import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LeaveForm from './_Form';

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function Create({ employees, leaveTypes }) {
    const { flash } = usePage().props;
    const d = today();
    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        leave_type_id: '',
        start_date: d,
        end_date: d,
        reason: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('leaves.store'));
    };

    const empty = employees.length === 0 || leaveTypes.length === 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New leave request</h1>
                        <p className="mt-1 text-sm text-gray-500">Submits as pending for approval</p>
                    </div>
                </div>
            }
        >
            <Head title="Create leave request" />

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
                    <LeaveForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        employees={employees}
                        leaveTypes={leaveTypes}
                        onSubmit={submit}
                        processing={processing}
                        submitLabel="Submit"
                        cancelHref={route('leaves.index')}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
