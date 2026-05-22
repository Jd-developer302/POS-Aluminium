import React, { useMemo } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PayrollForm from './_Form';

function moneyStr(v) {
    if (v == null || v === '') {
        return '0';
    }
    return String(v);
}

export default function Edit({ payroll, employees }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing, errors } = useForm({
        employee_id: String(payroll.employee_id),
        month: String(payroll.month),
        year: String(payroll.year),
        basic_salary: moneyStr(payroll.basic_salary),
        items: (payroll.items ?? []).map((i) => ({
            type: i.type,
            name: i.name,
            amount: i.amount != null && i.amount !== '' ? String(i.amount) : '',
        })),
        status: payroll.status,
        payment_date: payroll.payment_date
            ? String(payroll.payment_date).slice(0, 10)
            : '',
        payment_mode: payroll.payment_mode ?? '',
    });

    const years = useMemo(() => {
        const y = parseInt(payroll.year, 10) || new Date().getFullYear();
        return [y - 2, y - 1, y, y + 1].sort((a, b) => a - b);
    }, [payroll.year]);

    const submit = (e) => {
        e.preventDefault();
        put(route('payrolls.update', payroll.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit payroll</h1>
                        <p className="mt-1 text-sm text-gray-500">Adjust amounts and status</p>
                    </div>
                </div>
            }
        >
            <Head title="Edit payroll" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <PayrollForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    employees={employees}
                    years={years}
                    onSubmit={submit}
                    processing={processing}
                    submitLabel="Update"
                    cancelHref={route('payrolls.index')}
                    formMode="edit"
                    savedAttendanceSnapshot={payroll.attendance_snapshot}
                    savedAttendanceSyncedAt={payroll.attendance_synced_at}
                />
            </div>
        </AuthenticatedLayout>
    );
}
