import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ branches, categories }) {
    const { data, setData, post, errors, processing } = useForm({
        branch_id: '',
        category_id: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('expenses.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-2xl font-bold text-gray-900">Create Expense</h1>
            }
        >
            <Head title="Create Expense" />

            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Branch
                                </label>
                                <select
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.branch_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Category
                                </label>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700">
                                    Expense Date
                                </label>
                                <input
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) => setData('expense_date', e.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                />
                                {errors.expense_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">
                                Reference Number
                            </label>
                            <input
                                type="text"
                                value={data.reference_number}
                                onChange={(e) => setData('reference_number', e.target.value)}
                                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                            />
                            {errors.reference_number && (
                                <p className="mt-1 text-sm text-red-600">{errors.reference_number}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">
                                Notes
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows="4"
                                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                            ></textarea>
                            {errors.notes && (
                                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
                            >
                                Create
                            </button>
                            <Link
                                href={route('expenses.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
