import React from 'react';
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

export default function LeaveBalanceForm({
    data,
    setData,
    errors,
    employees,
    leaveTypes,
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
    isEdit = false,
}) {
    const onLeaveTypeChange = (e) => {
        const v = e.target.value;
        setData('leave_type_id', v);
        if (isEdit) {
            return;
        }
        const t = leaveTypes.find((x) => String(x.id) === v);
        if (t && t.days_per_year != null) {
            const cur = data.total_days;
            if (cur === '' || cur === 0 || cur === '0') {
                setData('total_days', String(t.days_per_year));
            }
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="lb-employee">
                    Employee <span className="text-red-500">*</span>
                </label>
                <select
                    id="lb-employee"
                    value={String(data.employee_id)}
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
                <label className="block text-sm font-medium text-gray-700" htmlFor="lb-lt">
                    Leave type <span className="text-red-500">*</span>
                </label>
                <select
                    id="lb-lt"
                    value={String(data.leave_type_id)}
                    onChange={onLeaveTypeChange}
                    className={field}
                    required
                >
                    <option value="">Select leave type</option>
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
                    <label className="block text-sm font-medium text-gray-700" htmlFor="lb-total">
                        Total days <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lb-total"
                        type="number"
                        min="0"
                        step="1"
                        value={data.total_days}
                        onChange={(e) => setData('total_days', e.target.value)}
                        className={field}
                    />
                    {errors.total_days && <p className="mt-1 text-sm text-red-600">{errors.total_days}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="lb-used">
                        Used days <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lb-used"
                        type="number"
                        min="0"
                        step="1"
                        value={data.used_days}
                        onChange={(e) => setData('used_days', e.target.value)}
                        className={field}
                    />
                    {errors.used_days && <p className="mt-1 text-sm text-red-600">{errors.used_days}</p>}
                </div>
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
