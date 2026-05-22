import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useFormatCurrency } from '@/lib/formatCurrency';

export default function Show({ expense }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    const formatCurrency = useFormatCurrency();

    return (
        <AuthenticatedLayout
            header={
                <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
            }
        >
            <Head title="Expense Details" />

            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Branch</p>
                                    <p className="mt-1 text-gray-900">{expense.branch.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Category</p>
                                    <p className="mt-1 text-gray-900">{expense.category.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Amount</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Expense Date</p>
                                    <p className="mt-1 text-gray-900">{formatDate(expense.expense_date)}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700">Reference Number</p>
                                <p className="mt-1 text-gray-900">{expense.reference_number || '—'}</p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700">Created By</p>
                                <p className="mt-1 text-gray-900">{expense.created_by?.name || '—'}</p>
                            </div>

                            {expense.notes && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Notes</p>
                                    <p className="mt-1 whitespace-pre-wrap text-gray-900">{expense.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-3 border-t border-gray-200 pt-6">
                                <Link
                                    href={route('expenses.edit', expense.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                                >
                                    Edit
                                </Link>
                                <Link
                                    href={route('expenses.index')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                                >
                                    Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
