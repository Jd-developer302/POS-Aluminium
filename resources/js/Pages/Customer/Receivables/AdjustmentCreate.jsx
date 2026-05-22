import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

function money(n) {
    const x = Number(n ?? 0);
    return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdjustmentCreate({ branches, customers, openDueItems, prefill }) {
    const { data, setData, post, processing, errors } = useForm({
        branch_id:
            prefill?.branch_id != null
                ? String(prefill.branch_id)
                : branches[0]?.id
                  ? String(branches[0].id)
                  : '',
        customer_id: prefill?.customer_id != null ? String(prefill.customer_id) : '',
        customer_due_item_id: '',
        adjustment_date: new Date().toISOString().slice(0, 10),
        adjustment_type: 'discount',
        amount: '',
        reason: '',
    });

    const loadLines = () => {
        if (!data.branch_id || !data.customer_id) {
            return;
        }
        router.get(
            route('customer-receivables.adjustments.create'),
            { branch_id: data.branch_id, customer_id: data.customer_id },
            { preserveState: false },
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('customer-receivables.adjustments.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Due adjustment</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Discount, write-off, or correction updates adjusted amount and balance.
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
            <Head title="Due adjustment" />

            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
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
                    </div>
                    <button
                        type="button"
                        onClick={loadLines}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Load due lines
                    </button>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Due line</label>
                            <select
                                className={inputClass}
                                value={data.customer_due_item_id}
                                onChange={(e) => setData('customer_due_item_id', e.target.value)}
                                required
                                disabled={!openDueItems?.length}
                            >
                                <option value="">
                                    {openDueItems?.length ? 'Select line' : 'Load lines first'}
                                </option>
                                {(openDueItems ?? []).map((d) => (
                                    <option key={d.id} value={d.id}>
                                        #{d.id} — {d.transaction_date} — bal {money(d.balance_amount)} —{' '}
                                        {d.product_name || '—'}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_due_item_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.customer_due_item_id}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>Adjustment date</label>
                            <input
                                type="date"
                                className={inputClass}
                                value={data.adjustment_date}
                                onChange={(e) => setData('adjustment_date', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Type</label>
                            <select
                                className={inputClass}
                                value={data.adjustment_type}
                                onChange={(e) => setData('adjustment_type', e.target.value)}
                            >
                                <option value="discount">Discount</option>
                                <option value="write_off">Write-off</option>
                                <option value="correction">Correction (±)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            className={inputClass}
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            required
                        />
                        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Reason</label>
                        <textarea
                            rows={3}
                            className={inputClass}
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                        />
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
                            disabled={processing || !openDueItems?.length}
                            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                        >
                            Save adjustment
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
