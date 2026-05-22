import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';

const iconStroke = 1.75;

const inField =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

function IconPencil({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.697.395l-4.62.951 1.027-4.622a4.5 4.5 0 0 1 .395-1.697L16.862 4.487Zm0 0L19.5 7.125"
            />
        </svg>
    );
}

function IconTrash({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

function IconPlus({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}

function timeToInput(v) {
    if (v == null || v === '') {
        return '';
    }
    if (typeof v === 'string') {
        return v.length >= 5 ? v.slice(0, 5) : v;
    }
    return '';
}

function dateToInput(v) {
    if (v == null || v === '') {
        return '';
    }
    if (typeof v === 'string') {
        return v.slice(0, 10);
    }
    return '';
}

/** Table display: no trailing .00, suffix "hours" (e.g. 10 hours, 7.5 hours). */
function formatWorkingHoursLabel(v) {
    if (v == null || v === '') {
        return '0 hours';
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
        return `${v} hours`;
    }
    const t = new Intl.NumberFormat('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(n);
    return `${t} hours`;
}

function Pagination({ links }) {
    if (!links?.length) {
        return null;
    }
    return (
        <nav className="mt-6 flex flex-wrap justify-end gap-1" aria-label="Pagination">
            {links.map((link, i) => {
                if (!link.url) {
                    return (
                        <span
                            key={i}
                            className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }
                return (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={
                            'inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ' +
                            (link.active
                                ? 'border-brand bg-brand text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50')
                        }
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}

const statusOptions = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'leave', label: 'Leave' },
];

function employeeLabel(emp) {
    if (!emp) {
        return '—';
    }
    const br = emp.branch?.name ? ` — ${emp.branch.name}` : '';
    return `${emp.name} (${emp.employee_id})${br}`;
}

function AttendanceFormFields({ data, setData, errors, employees }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="att-employee">
                    Employee <span className="text-red-500">*</span>
                </label>
                <select
                    id="att-employee"
                    value={data.employee_id}
                    onChange={(e) => setData('employee_id', e.target.value)}
                    className={inField}
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
                <label className="block text-sm font-medium text-gray-700" htmlFor="att-date">
                    Date <span className="text-red-500">*</span>
                </label>
                <input
                    id="att-date"
                    type="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    className={inField}
                    required
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="att-in">
                        Check in
                    </label>
                    <input
                        id="att-in"
                        type="time"
                        value={data.check_in}
                        onChange={(e) => setData('check_in', e.target.value)}
                        className={inField}
                    />
                    {errors.check_in && <p className="mt-1 text-sm text-red-600">{errors.check_in}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="att-out">
                        Check out
                    </label>
                    <input
                        id="att-out"
                        type="time"
                        value={data.check_out}
                        onChange={(e) => setData('check_out', e.target.value)}
                        className={inField}
                    />
                    {errors.check_out && <p className="mt-1 text-sm text-red-600">{errors.check_out}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="att-wh">
                        Working hours
                    </label>
                    <input
                        id="att-wh"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.working_hours}
                        onChange={(e) => setData('working_hours', e.target.value)}
                        className={inField}
                    />
                    {errors.working_hours && <p className="mt-1 text-sm text-red-600">{errors.working_hours}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="att-late">
                        Late (min)
                    </label>
                    <input
                        id="att-late"
                        type="number"
                        min="0"
                        value={data.late_minutes}
                        onChange={(e) => setData('late_minutes', e.target.value)}
                        className={inField}
                    />
                    {errors.late_minutes && <p className="mt-1 text-sm text-red-600">{errors.late_minutes}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="att-ot">
                        Overtime (min)
                    </label>
                    <input
                        id="att-ot"
                        type="number"
                        min="0"
                        value={data.overtime_minutes}
                        onChange={(e) => setData('overtime_minutes', e.target.value)}
                        className={inField}
                    />
                    {errors.overtime_minutes && (
                        <p className="mt-1 text-sm text-red-600">{errors.overtime_minutes}</p>
                    )}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="att-status">
                    Status <span className="text-red-500">*</span>
                </label>
                <select
                    id="att-status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className={inField}
                >
                    {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
            </div>
        </div>
    );
}

const emptyForm = {
    employee_id: '',
    date: new Date().toISOString().slice(0, 10),
    check_in: '',
    check_out: '',
    working_hours: '',
    late_minutes: '',
    overtime_minutes: '',
    status: 'present',
};

export default function Index({ attendances, employees, branches, filters: filtersProp }) {
    const { flash } = usePage().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data: fData, setData: setFData, get, processing: filterProcessing } = useForm({
        branch_id: filtersProp?.branch_id ?? '',
        employee_id: filtersProp?.employee_id ?? '',
        date_from: filtersProp?.date_from ?? '',
        date_to: filtersProp?.date_to ?? '',
        status: filtersProp?.status ?? '',
        q: filtersProp?.q ?? '',
    });

    const createForm = useForm({ ...emptyForm });
    const editForm = useForm({ ...emptyForm });

    const applyFilters = (e) => {
        e.preventDefault();
        get(route('attendances.index'), { preserveState: true });
    };

    const clearFilters = () => {
        setFData({
            branch_id: '',
            employee_id: '',
            date_from: '',
            date_to: '',
            status: '',
            q: '',
        });
        router.get(route('attendances.index'));
    };

    const openCreate = () => {
        createForm.clearErrors();
        createForm.reset({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
        setCreateOpen(true);
    };

    const openEdit = (row) => {
        editForm.clearErrors();
        setEditingId(row.id);
        editForm.reset({
            employee_id: String(row.employee_id),
            date: dateToInput(row.date),
            check_in: timeToInput(row.check_in),
            check_out: timeToInput(row.check_out),
            working_hours: row.working_hours != null && row.working_hours !== '' ? String(row.working_hours) : '',
            late_minutes: row.late_minutes != null ? String(row.late_minutes) : '',
            overtime_minutes: row.overtime_minutes != null ? String(row.overtime_minutes) : '',
            status: row.status ?? 'present',
        });
        setEditOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('attendances.store'), {
            preserveScroll: true,
            onSuccess: () => setCreateOpen(false),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (editingId == null) {
            return;
        }
        editForm.put(route('attendances.update', editingId), {
            preserveScroll: true,
            onSuccess: () => {
                setEditOpen(false);
                setEditingId(null);
            },
        });
    };

    const destroy = (id, dateLabel) => {
        if (!window.confirm(`Remove attendance for ${dateLabel}?`)) {
            return;
        }
        router.delete(route('attendances.destroy', id), { preserveScroll: true });
    };

    const employeesForFilter = useMemo(() => {
        if (!fData.branch_id) {
            return employees;
        }
        return employees.filter((e) => String(e.branch_id) === String(fData.branch_id));
    }, [employees, fData.branch_id]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Daily check-in, hours, and status by employee
                        </p>
                    </div>
                    {employees.length > 0 && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        >
                            <IconPlus className="h-5 w-5 shrink-0" />
                            Record attendance
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Attendance" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            {employees.length === 0 && (
                <div className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-6 text-sm text-amber-900 shadow-sm">
                    Add employees first before recording attendance.
                </div>
            )}

            <form
                onSubmit={applyFilters}
                className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
            >
                <div className="min-w-0 sm:max-w-[11rem]">
                    <label className="block text-xs font-medium text-gray-600">Branch</label>
                    <select
                        value={fData.branch_id}
                        onChange={(e) => {
                            setFData('branch_id', e.target.value);
                            if (fData.employee_id) {
                                const still = employees.some(
                                    (x) =>
                                        String(x.id) === String(fData.employee_id) &&
                                        String(x.branch_id) === String(e.target.value),
                                );
                                if (e.target.value && !still) {
                                    setFData('employee_id', '');
                                }
                            }
                        }}
                        className={inField + ' mt-1'}
                    >
                        <option value="">All</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-0 sm:max-w-[14rem]">
                    <label className="block text-xs font-medium text-gray-600">Employee</label>
                    <select
                        value={fData.employee_id}
                        onChange={(e) => setFData('employee_id', e.target.value)}
                        className={inField + ' mt-1'}
                    >
                        <option value="">All</option>
                        {employeesForFilter.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.name} ({e.employee_id})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600">From</label>
                    <input
                        type="date"
                        value={fData.date_from}
                        onChange={(e) => setFData('date_from', e.target.value)}
                        className={inField + ' mt-1'}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600">To</label>
                    <input
                        type="date"
                        value={fData.date_to}
                        onChange={(e) => setFData('date_to', e.target.value)}
                        className={inField + ' mt-1'}
                    />
                </div>
                <div className="min-w-0 sm:w-36">
                    <label className="block text-xs font-medium text-gray-600">Status</label>
                    <select
                        value={fData.status}
                        onChange={(e) => setFData('status', e.target.value)}
                        className={inField + ' mt-1'}
                    >
                        <option value="">All</option>
                        {statusOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-0 flex-1 sm:max-w-xs">
                    <label className="block text-xs font-medium text-gray-600">Search</label>
                    <input
                        type="search"
                        value={fData.q}
                        onChange={(e) => setFData('q', e.target.value)}
                        className={inField + ' mt-1'}
                        placeholder="Name, code, email"
                    />
                </div>
                <div className="flex flex-wrap gap-2 sm:ms-auto">
                    <button
                        type="submit"
                        disabled={filterProcessing}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50"
                    >
                        Clear
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">In / Out</th>
                            <th className="px-4 py-3">Hours</th>
                            <th className="px-4 py-3">Late</th>
                            <th className="px-4 py-3">OT</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="w-1 px-4 py-3 text-right"> </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attendances.data?.length ? (
                            attendances.data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/80">
                                    <td className="px-4 py-3 text-gray-900">{dateToInput(row.date)}</td>
                                    <td className="px-4 py-3 text-gray-900">
                                        <span className="font-medium">{row.employee?.name}</span>
                                        <span className="text-gray-500"> — {row.employee?.employee_id}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {timeToInput(row.check_in) || '—'} / {timeToInput(row.check_out) || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {formatWorkingHoursLabel(row.working_hours)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{row.late_minutes ?? '0'}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.overtime_minutes ?? '0'}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(row)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand hover:bg-brand/10"
                                                title="Edit"
                                            >
                                                <IconPencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroy(row.id, dateToInput(row.date))}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <IconTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                >
                                    No attendance rows for these filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={attendances.links} />

            <Modal show={createOpen} onClose={() => setCreateOpen(false)} maxWidth="lg" closeable>
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Record attendance</h2>
                    <p className="mt-0.5 text-sm text-gray-500">One row per employee per day</p>
                    <div className="mt-4">
                        <AttendanceFormFields
                            data={createForm.data}
                            setData={createForm.setData}
                            errors={createForm.errors}
                            employees={employees}
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={editOpen} onClose={() => setEditOpen(false)} maxWidth="lg" closeable>
                <form onSubmit={submitEdit} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Edit attendance</h2>
                    <p className="mt-0.5 text-sm text-gray-500">Update day record</p>
                    <div className="mt-4">
                        <AttendanceFormFields
                            data={editForm.data}
                            setData={editForm.setData}
                            errors={editForm.errors}
                            employees={employees}
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setEditOpen(false);
                                setEditingId(null);
                            }}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
