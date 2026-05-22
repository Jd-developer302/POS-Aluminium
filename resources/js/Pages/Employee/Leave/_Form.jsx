import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';

const field =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

function employeeLabel(emp) {
    if (!emp) {
        return '—';
    }
    const br = emp.branch?.name ? ` — ${emp.branch.name}` : '';
    return `${emp.name} (${emp.employee_id})${br}`;
}

function inclusiveDayHint(start, end) {
    if (!start || !end) {
        return null;
    }
    const s = new Date(start + (start.length === 10 ? 'T12:00:00' : ''));
    const e = new Date(end + (end.length === 10 ? 'T12:00:00' : ''));
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) {
        return null;
    }
    const n = Math.round((e - s) / 86400000) + 1;
    return n;
}

export default function LeaveForm({
    data,
    setData,
    errors,
    employees,
    leaveTypes,
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
}) {
    const dayHint = useMemo(
        () => inclusiveDayHint(data.start_date, data.end_date),
        [data.start_date, data.end_date],
    );

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="lv-emp">
                    Employee <span className="text-red-500">*</span>
                </label>
                <select
                    id="lv-emp"
                    value={String(data.employee_id ?? '')}
                    onChange={(e) => setData('employee_id', e.target.value)}
                    className={field}
                    required
                >
                    <option value="">Select employee</option>
                    {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                            {employeeLabel(e)}
                        </option>
                    ))}
                </select>
                {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="lv-lt">
                    Leave type <span className="text-red-500">*</span>
                </label>
                <select
                    id="lv-lt"
                    value={String(data.leave_type_id ?? '')}
                    onChange={(e) => setData('leave_type_id', e.target.value)}
                    className={field}
                    required
                >
                    <option value="">Select type</option>
                    {leaveTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
                {errors.leave_type_id && <p className="mt-1 text-sm text-red-600">{errors.leave_type_id}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="lv-start">
                        Start date <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lv-start"
                        type="date"
                        value={data.start_date ?? ''}
                        onChange={(e) => setData('start_date', e.target.value)}
                        className={field}
                        required
                    />
                    {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="lv-end">
                        End date <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lv-end"
                        type="date"
                        value={data.end_date ?? ''}
                        onChange={(e) => setData('end_date', e.target.value)}
                        className={field}
                        required
                    />
                    {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                </div>
            </div>
            {dayHint != null && (
                <p className="text-sm text-gray-600">
                    Inclusive span: <span className="font-medium text-gray-900">{dayHint} days</span> (saved on submit)
                </p>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="lv-reason">
                    Reason
                </label>
                <textarea
                    id="lv-reason"
                    rows={3}
                    value={data.reason ?? ''}
                    onChange={(e) => setData('reason', e.target.value)}
                    className={field + ' resize-y'}
                    placeholder="Optional"
                />
                {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-6">
                <Link
                    href={cancelHref}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
