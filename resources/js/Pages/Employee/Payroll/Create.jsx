import React, { useCallback, useEffect, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PayrollForm from './_Form';

export default function Create({ employees, defaultYear, defaultMonth }) {
    const { flash } = usePage().props;
    const [liveAttendance, setLiveAttendance] = useState(null);
    const [liveAttendanceLoading, setLiveAttendanceLoading] = useState(false);
    const [liveAttendanceError, setLiveAttendanceError] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        month: String(defaultMonth),
        year: String(defaultYear),
        basic_salary: '',
        items: [],
        status: 'unpaid',
        payment_date: '',
        payment_mode: '',
    });

    const onEmployeeChange = useCallback(
        (empId, emps) => {
            if (!empId) {
                return;
            }
            const e = emps.find((x) => String(x.id) === String(empId));
            if (e && e.salary != null && e.salary !== '') {
                setData('basic_salary', String(e.salary));
            }
        },
        [setData],
    );

    useEffect(() => {
        if (!data.employee_id) {
            setLiveAttendance(null);
            setLiveAttendanceError(null);
            setLiveAttendanceLoading(false);
            return undefined;
        }

        setLiveAttendanceLoading(true);
        setLiveAttendanceError(null);

        const t = window.setTimeout(async () => {
            try {
                const u = new URL(route('payrolls.attendance-summary'), window.location.origin);
                u.searchParams.set('employee_id', String(data.employee_id));
                u.searchParams.set('year', String(data.year));
                u.searchParams.set('month', String(data.month));

                const res = await fetch(u.toString(), {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || 'Request failed');
                }

                const json = await res.json();
                setLiveAttendance(json.snapshot ?? null);
            } catch {
                setLiveAttendance(null);
                setLiveAttendanceError('Could not load attendance summary.');
            } finally {
                setLiveAttendanceLoading(false);
            }
        }, 400);

        return () => window.clearTimeout(t);
    }, [data.employee_id, data.month, data.year]);

    const years = (() => {
        const a = [defaultYear - 2, defaultYear - 1, defaultYear, defaultYear + 1];
        return [...new Set(a)].sort((x, f) => x - f);
    })();

    const submit = (e) => {
        e.preventDefault();
        post(route('payrolls.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New payroll</h1>
                        <p className="mt-1 text-sm text-gray-500">Monthly pay for one employee (unique per month/year)</p>
                    </div>
                </div>
            }
        >
            <Head title="Create payroll" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            {employees.length === 0 ? (
                <div className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-6 text-sm text-amber-900 shadow-sm">
                    Add active employees first.
                </div>
            ) : (
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <PayrollForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        employees={employees}
                        years={years}
                        onSubmit={submit}
                        processing={processing}
                        submitLabel="Save"
                        cancelHref={route('payrolls.index')}
                        onEmployeeChange={onEmployeeChange}
                        formMode="create"
                        liveAttendance={liveAttendance}
                        liveAttendanceLoading={liveAttendanceLoading}
                        liveAttendanceError={liveAttendanceError}
                    />
                </div>
            )}
        </AuthenticatedLayout>
    );
}
