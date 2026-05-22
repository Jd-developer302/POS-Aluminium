import React from 'react';
import { Link } from '@inertiajs/react';

const field =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export default function LeaveTypeForm({
    data,
    setData,
    errors,
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                </label>
                <input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={field}
                    placeholder="e.g. Annual leave"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor="days_per_year" className="block text-sm font-medium text-gray-700">
                    Days per year <span className="text-red-500">*</span>
                </label>
                <input
                    id="days_per_year"
                    type="number"
                    min="0"
                    step="1"
                    value={data.days_per_year}
                    onChange={(e) => setData('days_per_year', e.target.value)}
                    className={field}
                />
                {errors.days_per_year && (
                    <p className="mt-1 text-sm text-red-600">{errors.days_per_year}</p>
                )}
            </div>

            <div className="flex items-start gap-3">
                <input
                    id="is_paid"
                    type="checkbox"
                    checked={Boolean(data.is_paid)}
                    onChange={(e) => setData('is_paid', e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <div>
                    <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">
                        Paid leave
                    </label>
                    <p className="text-xs text-gray-500">If unchecked, treated as unpaid leave</p>
                </div>
            </div>
            {errors.is_paid && <p className="text-sm text-red-600">{errors.is_paid}</p>}

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                </label>
                <select
                    id="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className={field}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
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
