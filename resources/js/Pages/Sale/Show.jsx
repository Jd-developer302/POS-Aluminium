import React, { useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    buildSaleDetailRows,
    formatSaleMoney,
    saleDetailBillingLayout,
    saleDetailCutsColumnHeader,
    saleDetailOnHandColumnHeader,
    saleSummaryTotals,
} from '@/lib/saleDetailTableRows';

function asStringList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value.map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    if (typeof value === 'object') {
        return Object.values(value).map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    return [];
}

export default function Show({ sale }) {
    const { flash, auth } = usePage().props;
    const perms = asStringList(auth?.user?.permissions);
    const canDeleteSale = !perms.length || perms.includes('sales.delete');
    const paymentForm = useForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
    });

    const returnForm = useForm({ confirm: true });
    const completeDraftForm = useForm({});

    const saleItems = sale.items ?? [];
    const billingCols = saleDetailBillingLayout(saleItems);
    const cutsColumnHeader = saleDetailCutsColumnHeader(saleItems);
    const onHandColumnHeader = saleDetailOnHandColumnHeader(saleItems);

    const detailRows = useMemo(() => buildSaleDetailRows(saleItems), [saleItems]);
    const totals = useMemo(() => saleSummaryTotals(sale), [sale]);

    const addPayment = (e) => {
        e.preventDefault();
        paymentForm.post(route('sales.payments.store', sale.id));
    };

    const returnSale = () => {
        returnForm.post(route('sales.return', sale.id));
    };

    const deleteSale = () => {
        router.delete(route('sales.destroy', sale.id));
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-2xl font-bold text-gray-900">Sale Details</h1>}
        >
            <Head title="Sale Details" />

            <div className="mx-auto max-w-7xl space-y-6">
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Sale #</p>
                                <p className="mt-1 text-gray-900">{sale.sale_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Date</p>
                                <p className="mt-1 text-gray-900">
                                    {new Date(sale.sale_date).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Branch</p>
                                <p className="mt-1 text-gray-900">{sale.branch?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Warehouse</p>
                                <p className="mt-1 text-gray-900">{sale.warehouse?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Customer</p>
                                <p className="mt-1 text-gray-900">
                                    {sale.customer ? (
                                        <>
                                            <span className="font-medium">{sale.customer.name}</span>
                                            <span className="block text-xs font-normal text-gray-600">
                                                {sale.customer.code}
                                                {sale.customer.phone
                                                    ? ` · ${sale.customer.phone}`
                                                    : ''}
                                            </span>
                                        </>
                                    ) : (
                                        'Walk-in'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm text-gray-900">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/90">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Variant</th>
                                        {billingCols === 'qty' ? (
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                                {cutsColumnHeader}
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual' || billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                                {onHandColumnHeader}
                                            </th>
                                        ) : null}
                                        {billingCols === 'length_actual_qty' ? (
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Qty</th>
                                        ) : null}
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                            Unit price
                                        </th>
                                        <th className="px-4 py-3 text-end font-semibold text-gray-700">Disc. %</th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailRows.map((row) => (
                                        <tr key={row.key} className="border-b border-gray-100">
                                            <td className="px-4 py-3 font-medium">{row.product}</td>
                                            <td className="px-4 py-3 text-gray-700">{row.variant}</td>
                                            {billingCols === 'qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual' ||
                                            billingCols === 'length_actual_qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.lengthsSummary}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual' ||
                                            billingCols === 'length_actual_qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.actualFt}
                                                </td>
                                            ) : null}
                                            {billingCols === 'length_actual_qty' ? (
                                                <td className="px-4 py-3 tabular-nums text-gray-800">
                                                    {row.qtyUnits}
                                                </td>
                                            ) : null}
                                            <td className="px-4 py-3 tabular-nums text-gray-800">{row.unitPrice}</td>
                                            <td className="px-4 py-3 text-end tabular-nums text-gray-800">
                                                {row.discountPercent}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900">
                                                {row.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-0 flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="text-sm text-gray-600">
                                <div>
                                    Status:{' '}
                                    <span className="font-semibold text-gray-900 capitalize">
                                        {sale.status}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full max-w-xs shrink-0 space-y-1.5 text-sm sm:text-right">
                                <div className="flex justify-between gap-8 sm:ml-auto sm:max-w-xs">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.grossSubtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-8 sm:ml-auto sm:max-w-xs">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.taxAmount)}
                                    </span>
                                </div>
                                {/* <div className="flex justify-between gap-8 sm:ml-auto sm:max-w-xs">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(sale.shipping_cost)}
                                    </span>
                                </div> */}
                                <div className="flex justify-between gap-8 sm:ml-auto sm:max-w-xs">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.discountAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-8 border-t border-gray-200 pt-2 text-base font-bold sm:ml-auto sm:max-w-xs">
                                    <span className="text-gray-900">Total</span>
                                    <span className="tabular-nums text-gray-900">
                                        {formatSaleMoney(totals.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`mt-6 rounded-xl border p-5 shadow-sm ${
                                sale.status === 'draft'
                                    ? 'border-amber-200 bg-amber-50/60'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <h2 className="text-base font-semibold text-gray-900">Update sale status</h2>
                            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-2 text-sm text-gray-700">
                                    <p>
                                        Current status:{' '}
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                                sale.status === 'draft'
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : sale.status === 'completed'
                                                      ? 'bg-emerald-100 text-emerald-900'
                                                      : sale.status === 'returned'
                                                        ? 'bg-orange-100 text-orange-900'
                                                        : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {sale.status}
                                        </span>
                                    </p>
                                    {sale.status === 'draft' && (
                                        <p className="text-xs text-gray-600">
                                            Draft means stock has <span className="font-semibold">not</span> been
                                            deducted yet. Press the button → status becomes{' '}
                                            <span className="font-semibold">completed</span> and stock is updated
                                            for this sale.
                                        </p>
                                    )}
                                    {sale.status === 'completed' && (
                                        <p className="text-xs text-gray-600">
                                            This sale is finalized. To reverse stock, use{' '}
                                            <span className="font-semibold">Return (restore stock)</span> in Actions
                                            if your process allows it.
                                        </p>
                                    )}
                                    {(sale.status === 'returned' || sale.status === 'cancelled') && (
                                        <p className="text-xs text-gray-600">
                                            No further status change is available from this screen.
                                        </p>
                                    )}
                                </div>
                                {sale.status === 'draft' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            completeDraftForm.post(route('sales.complete', sale.id))
                                        }
                                        disabled={completeDraftForm.processing}
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                    >
                                        {completeDraftForm.processing
                                            ? 'Updating status…'
                                            : 'Mark completed & update stock'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <h2 className="text-base font-semibold text-gray-900">Payments</h2>
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Paid</span>
                                        <span className="font-semibold text-gray-900">{sale.paid_amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Due</span>
                                        <span className="font-semibold text-gray-900">{sale.due_amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment status</span>
                                        <span className="font-semibold text-gray-900">{sale.payment_status}</span>
                                    </div>
                                </div>

                                <form onSubmit={addPayment} className="mt-4 space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={paymentForm.data.payment_date}
                                                onChange={(e) => paymentForm.setData('payment_date', e.target.value)}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                            />
                                            {paymentForm.errors.payment_date && (
                                                <p className="mt-1 text-sm text-red-600">{paymentForm.errors.payment_date}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={paymentForm.data.amount}
                                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                            />
                                            {paymentForm.errors.amount && (
                                                <p className="mt-1 text-sm text-red-600">{paymentForm.errors.amount}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Method
                                            </label>
                                            <select
                                                value={paymentForm.data.payment_method}
                                                onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="bank_transfer">Bank transfer</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {paymentForm.errors.payment_method && (
                                                <p className="mt-1 text-sm text-red-600">{paymentForm.errors.payment_method}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">
                                                Reference (optional)
                                            </label>
                                            <input
                                                value={paymentForm.data.reference_number}
                                                onChange={(e) => paymentForm.setData('reference_number', e.target.value)}
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={paymentForm.processing}
                                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                                    >
                                        Add payment
                                    </button>
                                </form>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-5">
                                <h2 className="text-base font-semibold text-gray-900">Actions</h2>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link
                                        href={route('sales.receipt', sale.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                                    >
                                        Print receipt
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={returnSale}
                                        disabled={returnForm.processing || sale.status !== 'completed'}
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                                        title={sale.status !== 'completed' ? 'Only completed sales can be returned' : undefined}
                                    >
                                        Return (restore stock)
                                    </button>
                                    {canDeleteSale ? (
                                        <button
                                            type="button"
                                            onClick={deleteSale}
                                            className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                        >
                                            Delete sale
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Link
                                href={route('sales.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Back
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

