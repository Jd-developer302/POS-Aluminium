import React, { useCallback, useMemo } from 'react';
import { Link } from '@inertiajs/react';

const field =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

const MONTHS = [
    { v: 1, label: 'January' },
    { v: 2, label: 'February' },
    { v: 3, label: 'March' },
    { v: 4, label: 'April' },
    { v: 5, label: 'May' },
    { v: 6, label: 'June' },
    { v: 7, label: 'July' },
    { v: 8, label: 'August' },
    { v: 9, label: 'September' },
    { v: 10, label: 'October' },
    { v: 11, label: 'November' },
    { v: 12, label: 'December' },
];

function employeeLabel(emp) {
    if (!emp) {
        return '—';
    }
    const br = emp.branch?.name ? ` — ${emp.branch.name}` : '';
    return `${emp.name} (${emp.employee_id})${br}`;
}

function parseMoney(s) {
    if (s === '' || s == null) {
        return 0;
    }
    const n = parseFloat(String(s), 10);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Sums line amounts the same way as the server (allowance vs deduction).
 * @param {Array<{ type?: string, amount?: string }> | undefined} items
 * @returns {[number, number]} [allowanceTotal, deductionTotal]
 */
function sumItemTotals(items) {
    let allow = 0;
    let ded = 0;
    for (const row of items || []) {
        const amt = parseMoney(row?.amount);
        if (row?.type === 'deduction') {
            ded += amt;
        } else {
            allow += amt;
        }
    }
    return [allow, ded];
}

export function formatMoney(n) {
    const v = n == null || n === '' ? 0 : Number(n);
    if (Number.isNaN(v)) {
        return '—';
    }
    return new Intl.NumberFormat('en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(v);
}

function AttendanceSnapshotBlock({
    formMode,
    liveSnapshot,
    liveLoading,
    liveError,
    savedSnapshot,
    savedSyncedAt,
}) {
    const showSaved = formMode === 'edit';
    const showLive = formMode === 'create';

    return (
        <div className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/60 p-4">
            <div>
                <h3 className="text-sm font-semibold text-gray-900">Attendance (this payroll month)</h3>
                <p className="text-xs text-gray-600">
                    Linked from daily attendance records for the selected employee and period. Stored on the payroll when
                    you save.
                </p>
            </div>

            {showSaved && (
                <div className="text-sm text-gray-800">
                    {!savedSnapshot ? (
                        <p className="text-amber-800">No snapshot on file. Save the payroll to capture attendance for this
                            period.</p>
                    ) : (
                        <>
                            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs text-gray-500">Period</dt>
                                    <dd className="font-medium">
                                        {savedSnapshot.period?.start} → {savedSnapshot.period?.end}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Records</dt>
                                    <dd className="font-medium">{savedSnapshot.records ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Status counts</dt>
                                    <dd className="text-xs text-gray-700">
                                        P {savedSnapshot.by_status?.present ?? 0} · A {savedSnapshot.by_status?.absent ?? 0}{' '}
                                        · L {savedSnapshot.by_status?.late ?? 0} · LV {savedSnapshot.by_status?.leave ?? 0}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Working hours (sum)</dt>
                                    <dd className="font-medium">{formatMoney(savedSnapshot.totals?.working_hours)} h</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Late / OT (minutes)</dt>
                                    <dd className="text-xs text-gray-700">
                                        {savedSnapshot.totals?.late_minutes ?? 0} / {savedSnapshot.totals?.overtime_minutes ?? 0}
                                    </dd>
                                </div>
                                {savedSyncedAt && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs text-gray-500">Captured at</dt>
                                        <dd className="text-xs text-gray-600">{String(savedSyncedAt)}</dd>
                                    </div>
                                )}
                            </dl>
                        </>
                    )}
                </div>
            )}

            {showLive && (
                <div className="text-sm text-gray-800">
                    {liveLoading && <p className="text-gray-600">Loading attendance…</p>}
                    {liveError && <p className="text-red-700">{liveError}</p>}
                    {!liveLoading && !liveError && !liveSnapshot && (
                        <p className="text-gray-600">Select an employee to preview attendance for the selected month.</p>
                    )}
                    {!liveLoading && !liveError && liveSnapshot && (
                        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs text-gray-500">Period</dt>
                                <dd className="font-medium">
                                    {liveSnapshot.period?.start} → {liveSnapshot.period?.end}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Records</dt>
                                <dd className="font-medium">{liveSnapshot.records ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Status counts</dt>
                                <dd className="text-xs text-gray-700">
                                    P {liveSnapshot.by_status?.present ?? 0} · A {liveSnapshot.by_status?.absent ?? 0} · L{' '}
                                    {liveSnapshot.by_status?.late ?? 0} · LV {liveSnapshot.by_status?.leave ?? 0}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Working hours (sum)</dt>
                                <dd className="font-medium">{formatMoney(liveSnapshot.totals?.working_hours)} h</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs text-gray-500">Late / OT (minutes)</dt>
                                <dd className="text-xs text-gray-700">
                                    {liveSnapshot.totals?.late_minutes ?? 0} / {liveSnapshot.totals?.overtime_minutes ?? 0}
                                </dd>
                            </div>
                        </dl>
                    )}
                </div>
            )}
        </div>
    );
}

export default function PayrollForm({
    data,
    setData,
    errors,
    employees,
    years = [],
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
    onEmployeeChange,
    formMode = 'create',
    liveAttendance = null,
    liveAttendanceLoading = false,
    liveAttendanceError = null,
    savedAttendanceSnapshot = null,
    savedAttendanceSyncedAt = null,
}) {
    const items = data.items || [];

    const [totalAllow, totalDed] = useMemo(() => sumItemTotals(items), [items]);

    const netPreview = useMemo(() => {
        const b = parseMoney(data.basic_salary);
        return Math.max(0, b + totalAllow - totalDed);
    }, [data.basic_salary, totalAllow, totalDed]);

    const setItems = useCallback(
        (next) => {
            setData('items', next);
        },
        [setData],
    );

    const addItem = useCallback(
        (type) => {
            setItems([...items, { type, name: '', amount: '' }]);
        },
        [items, setItems],
    );

    const updateItem = useCallback(
        (index, patch) => {
            const next = items.map((row, i) => (i === index ? { ...row, ...patch } : row));
            setItems(next);
        },
        [items, setItems],
    );

    const removeItem = useCallback(
        (index) => {
            setItems(items.filter((_, i) => i !== index));
        },
        [items, setItems],
    );

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="pr-emp">
                    Employee <span className="text-red-500">*</span>
                </label>
                <select
                    id="pr-emp"
                    value={String(data.employee_id ?? '')}
                    onChange={(e) => {
                        setData('employee_id', e.target.value);
                        if (onEmployeeChange) {
                            onEmployeeChange(e.target.value, employees);
                        }
                    }}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="pr-month">
                        Month <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="pr-month"
                        value={String(data.month ?? '')}
                        onChange={(e) => setData('month', e.target.value)}
                        className={field}
                        required
                    >
                        {MONTHS.map((m) => (
                            <option key={m.v} value={m.v}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="pr-year">
                        Year <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="pr-year"
                        value={String(data.year ?? '')}
                        onChange={(e) => setData('year', e.target.value)}
                        className={field}
                        required
                    >
                        {years.length ? (
                            years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))
                        ) : (
                            <option value={data.year ?? ''}>{data.year}</option>
                        )}
                    </select>
                    {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
                </div>
            </div>

            <AttendanceSnapshotBlock
                formMode={formMode}
                liveSnapshot={liveAttendance}
                liveLoading={liveAttendanceLoading}
                liveError={liveAttendanceError}
                savedSnapshot={savedAttendanceSnapshot}
                savedSyncedAt={savedAttendanceSyncedAt}
            />

            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="pr-basic">
                    Basic salary <span className="text-red-500">*</span>
                </label>
                <input
                    id="pr-basic"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.basic_salary}
                    onChange={(e) => setData('basic_salary', e.target.value)}
                    className={field}
                />
                {errors.basic_salary && <p className="mt-1 text-sm text-red-600">{errors.basic_salary}</p>}
            </div>

            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Allowances &amp; deductions</h3>
                        <p className="text-xs text-gray-500">Rows with a blank name are ignored when saving.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => addItem('allowance')}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            + Allowance
                        </button>
                        <button
                            type="button"
                            onClick={() => addItem('deduction')}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            + Deduction
                        </button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <p className="text-sm text-gray-500">No lines yet. Add an allowance or deduction line.</p>
                ) : (
                    <ul className="space-y-3">
                        {items.map((row, idx) => (
                            <li
                                key={idx}
                                className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-white p-3 sm:grid-cols-12 sm:items-end"
                            >
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600" htmlFor={`pr-type-${idx}`}>
                                        Type
                                    </label>
                                    <select
                                        id={`pr-type-${idx}`}
                                        value={row.type === 'deduction' ? 'deduction' : 'allowance'}
                                        onChange={(e) => updateItem(idx, { type: e.target.value })}
                                        className={field}
                                    >
                                        <option value="allowance">Allowance</option>
                                        <option value="deduction">Deduction</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-5">
                                    <label className="block text-xs font-medium text-gray-600" htmlFor={`pr-name-${idx}`}>
                                        Name
                                    </label>
                                    <input
                                        id={`pr-name-${idx}`}
                                        type="text"
                                        value={row.name ?? ''}
                                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                                        className={field}
                                        placeholder="e.g. Transport"
                                    />
                                    {errors[`items.${idx}.name`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`items.${idx}.name`]}</p>
                                    )}
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-medium text-gray-600" htmlFor={`pr-amt-${idx}`}>
                                        Amount
                                    </label>
                                    <input
                                        id={`pr-amt-${idx}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.amount}
                                        onChange={(e) => updateItem(idx, { amount: e.target.value })}
                                        className={field}
                                    />
                                    {errors[`items.${idx}.type`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`items.${idx}.type`]}</p>
                                    )}
                                    {errors[`items.${idx}.amount`] && (
                                        <p className="mt-1 text-sm text-red-600">{errors[`items.${idx}.amount`]}</p>
                                    )}
                                </div>
                                <div className="flex sm:col-span-2 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 sm:w-auto"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {errors.items && typeof errors.items === 'string' && (
                    <p className="text-sm text-red-600">{errors.items}</p>
                )}

                <p className="text-xs text-gray-600">
                    Totals from lines: allowance {formatMoney(totalAllow)} / deduction {formatMoney(totalDed)} (also
                    stored on the payroll)
                </p>
            </div>

            <p className="text-sm text-gray-600">
                Net (preview, saved on server):{' '}
                <span className="font-semibold text-gray-900">{formatMoney(netPreview)}</span>
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="pr-status">
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="pr-status"
                        value={data.status}
                        onChange={(e) => {
                            const s = e.target.value;
                            setData('status', s);
                            if (s !== 'paid') {
                                setData('payment_mode', '');
                            }
                        }}
                        className={field}
                    >
                        <option value="unpaid">Unpaid</option>
                        <option value="processed">Processed</option>
                        <option value="paid">Paid</option>
                    </select>
                    {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="pr-pay">
                        Payment date
                    </label>
                    <input
                        id="pr-pay"
                        type="date"
                        value={data.payment_date ?? ''}
                        onChange={(e) => setData('payment_date', e.target.value)}
                        className={field}
                    />
                    {errors.payment_date && <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="pr-pay-mode">
                        Payment method {data.status === 'paid' && <span className="text-red-500">*</span>}
                    </label>
                    <select
                        id="pr-pay-mode"
                        value={data.payment_mode ?? ''}
                        onChange={(e) => setData('payment_mode', e.target.value)}
                        className={field}
                        disabled={data.status !== 'paid'}
                    >
                        <option value="">{data.status === 'paid' ? 'Select…' : '—'}</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank / transfer</option>
                        <option value="cheque">Cheque</option>
                    </select>
                    {errors.payment_mode && (
                        <p className="mt-1 text-sm text-red-600">{errors.payment_mode}</p>
                    )}
                    {data.status === 'paid' && (
                        <p className="mt-1 text-xs text-gray-500">Required when status is Paid.</p>
                    )}
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

export { MONTHS };
