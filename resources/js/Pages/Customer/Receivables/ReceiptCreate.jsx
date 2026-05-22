import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

export default function ReceiptCreate({ branches, customers }) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id: branches[0]?.id ? String(branches[0].id) : '',
        customer_id: '',
        receipt_date: new Date().toISOString().slice(0, 10),
        receipt_type: 'recovery',
        amount: '',
        payment_method: 'cash',
        payment_reference: '',
        notes: '',
        auto_allocate: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('customer-receivables.receipts.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Record receipt</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Payment from customer; when auto-allocate is on, oldest open due lines are paid first
                            (FIFO).
                        </p>
                    </div>
                    <Link
                        href={route('customer-receivables.index')}
                        className="text-sm font-semibold text-brand hover:underline"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Record receipt" />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Branch</label>
                        <select
                            className={inputClass}
                            value={data.branch_id}
                            onChange={(e) => setData('branch_id', e.target.value)}
                            required
                        >
                            <option value="">Select branch</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        {errors.branch_id && <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Customer</label>
                        <select
                            className={inputClass}
                            value={data.customer_id}
                            onChange={(e) => setData('customer_id', e.target.value)}
                            required
                        >
                            <option value="">Select customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} — {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Receipt date</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={data.receipt_date}
                            onChange={(e) => setData('receipt_date', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Receipt type</label>
                        <select
                            className={inputClass}
                            value={data.receipt_type}
                            onChange={(e) => setData('receipt_type', e.target.value)}
                        >
                            <option value="recovery">Recovery</option>
                            <option value="sale_payment">Sale payment</option>
                            <option value="advance">Advance</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={inputClass}
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            required
                        />
                        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Payment method</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={data.payment_method}
                            onChange={(e) => setData('payment_method', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Payment reference</label>
                    <input
                        type="text"
                        className={inputClass}
                        value={data.payment_reference}
                        onChange={(e) => setData('payment_reference', e.target.value)}
                    />
                </div>

                <div>
                    <label className={labelClass}>Notes</label>
                    <textarea
                        rows={3}
                        className={inputClass}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="auto_allocate"
                        type="checkbox"
                        checked={Boolean(data.auto_allocate)}
                        onChange={(e) => setData('auto_allocate', e.target.checked)}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <label htmlFor="auto_allocate" className="text-sm text-gray-700">
                        Auto-allocate to open due lines (FIFO by transaction date)
                    </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                    <Link
                        href={route('customer-receivables.index')}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        Save receipt
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
