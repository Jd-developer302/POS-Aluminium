import React from 'react';
import { Link } from '@inertiajs/react';

export default function DesignationForm({
    data,
    setData,
    errors,
    departments,
    onSubmit,
    processing,
    submitLabel,
    cancelHref,
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <label
                    htmlFor="department_id"
                    className="block text-sm font-medium text-gray-700"
                >
                    Department <span className="text-red-500">*</span>
                </label>
                <select
                    id="department_id"
                    value={data.department_id}
                    onChange={(e) => setData('department_id', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.branch?.name
                                ? `${d.name} — ${d.branch.name}`
                                : d.name}
                        </option>
                    ))}
                </select>
                {errors.department_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.department_id}</p>
                )}
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Designation title <span className="text-red-500">*</span>
                </label>
                <input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="e.g. Store Manager"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                </label>
                <select
                    id="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
