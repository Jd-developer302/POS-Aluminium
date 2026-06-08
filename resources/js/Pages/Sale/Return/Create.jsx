import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    saleReturnCutsSummary,
    saleReturnQtyLabel,
    saleReturnTableHeaders,
    saleReturnUnitPriceLabel,
    saleReturnVariantLabel,
} from '@/lib/saleReturnLineDisplay';

function useErrors() {
    return usePage().props.errors ?? {};
}

const field =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export default function Create({ sales, selectedSale, warehouses }) {
    const { flash } = usePage().props;
    const errors = useErrors();

    const [sending, setSending] = useState(false);

    const { data, setData } = useForm({
        sale_id: selectedSale ? String(selectedSale.id) : '',
        warehouse_id: selectedSale ? String(selectedSale.warehouse_id) : '',
        return_date: new Date().toISOString().slice(0, 10),
        refund_amount: '',
        refund_method: '',
        reason: '',
        items: [],
    });

    const saleLines = selectedSale?.items ?? [];
    const tableHeaders = useMemo(() => saleReturnTableHeaders(saleLines), [saleLines]);

    useEffect(() => {
        if (!selectedSale) {
            setData((d) => ({
                ...d,
                sale_id: '',
                warehouse_id: '',
                items: [],
            }));
            return;
        }
        setData((d) => ({
            ...d,
            sale_id: String(selectedSale.id),
            warehouse_id: String(selectedSale.warehouse_id),
            items: (selectedSale.items || []).map((it) => ({
                sale_item_id: it.id,
                quantity: '',
            })),
        }));
    }, [selectedSale, setData]);

    const onSaleSelect = (e) => {
        const v = e.target.value;
        if (v) {
            router.get(route('sale-returns.create'), { sale_id: v }, { preserveState: true, replace: true });
        } else {
            router.get(route('sale-returns.create'), {}, { preserveState: true, replace: true });
        }
    };

    const whOptions = (warehouses || []).filter((w) => {
        if (!selectedSale) {
            return true;
        }
        return String(w.branch_id) === String(selectedSale.branch_id);
    });

    const updateItemQty = (index, value) => {
        const next = [...(data.items || [])];
        if (!next[index]) {
            return;
        }
        next[index] = { ...next[index], quantity: value };
        setData('items', next);
    };

    const submit = (e) => {
        e.preventDefault();
        const items = (data.items || [])
            .map((row) => ({
                sale_item_id: row.sale_item_id,
                quantity: row.quantity === '' || row.quantity == null ? 0 : Number(row.quantity),
            }))
            .filter((r) => r.quantity > 0);
        if (items.length < 1) {
            window.alert('Return quantity: enter at least one line greater than zero.');
            return;
        }
        setSending(true);
        router.post(
            route('sale-returns.store'),
            {
                sale_id: data.sale_id,
                warehouse_id: data.warehouse_id,
                return_date: data.return_date,
                refund_amount: data.refund_amount === '' ? null : data.refund_amount,
                refund_method: data.refund_method === '' ? null : data.refund_method,
                reason: data.reason || null,
                items,
            },
            {
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={<h1 className="text-2xl font-bold text-gray-900">New sale return</h1>}
        >
            <Head title="New sale return" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="sr-sale">
                                Sale (completed only) <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="sr-sale"
                                value={data.sale_id}
                                onChange={onSaleSelect}
                                className={field}
                                required
                            >
                                <option value="">— Select sale —</option>
                                {(sales || []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.sale_number} — {s.total} (
                                        {s.sale_date ? String(s.sale_date).slice(0, 10) : ''})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedSale && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700" htmlFor="sr-date">
                                            Return date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="sr-date"
                                            type="date"
                                            value={data.return_date}
                                            onChange={(e) => setData('return_date', e.target.value)}
                                            className={field}
                                            required
                                        />
                                        {errors.return_date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.return_date}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label
                                            className="block text-sm font-medium text-gray-700"
                                            htmlFor="sr-wh"
                                        >
                                            Warehouse (restock) <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="sr-wh"
                                            value={data.warehouse_id}
                                            onChange={(e) => setData('warehouse_id', e.target.value)}
                                            className={field}
                                            required
                                        >
                                            {whOptions.map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.warehouse_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.warehouse_id}</p>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600">
                                    Sale: <span className="font-semibold">{selectedSale.sale_number}</span> — return
                                    cannot exceed &quot;remaining&quot; per line (units, ft, or sq ft by product type).
                                </p>

                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                    Product
                                                </th>
                                                {tableHeaders.showVariant ? (
                                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                        Variant
                                                    </th>
                                                ) : null}
                                                {tableHeaders.showCuts ? (
                                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                                        {tableHeaders.cutsHeader}
                                                    </th>
                                                ) : null}
                                                <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                                    {tableHeaders.soldHeader}
                                                </th>
                                                <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                                    {tableHeaders.remainingHeader}
                                                </th>
                                                <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                                    Unit price
                                                </th>
                                                <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                                    {tableHeaders.returnHeader}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(data.items || []).map((row, idx) => {
                                                const it = saleLines.find((x) => x.id === row.sale_item_id);
                                                if (!it) {
                                                    return null;
                                                }
                                                const mode = it.billing_mode ?? 'quantity';
                                                return (
                                                    <tr key={row.sale_item_id}>
                                                        <td className="px-3 py-2 font-medium text-gray-900">
                                                            {it.product_name ?? it.product_id}
                                                        </td>
                                                        {tableHeaders.showVariant ? (
                                                            <td className="px-3 py-2 text-gray-700">
                                                                {saleReturnVariantLabel(it)}
                                                            </td>
                                                        ) : null}
                                                        {tableHeaders.showCuts ? (
                                                            <td className="px-3 py-2 font-mono text-xs text-gray-700">
                                                                {saleReturnCutsSummary(it)}
                                                            </td>
                                                        ) : null}
                                                        <td className="px-3 py-2 text-end tabular-nums text-gray-600">
                                                            {saleReturnQtyLabel(it.quantity_sold, mode)}
                                                        </td>
                                                        <td className="px-3 py-2 text-end font-medium tabular-nums text-amber-800">
                                                            {saleReturnQtyLabel(it.remaining, mode)}
                                                        </td>
                                                        <td className="px-3 py-2 text-end text-gray-700">
                                                            {saleReturnUnitPriceLabel(it)}
                                                        </td>
                                                        <td className="px-3 py-2 text-end">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.0001"
                                                                max={it.remaining}
                                                                value={row.quantity}
                                                                onChange={(e) => updateItemQty(idx, e.target.value)}
                                                                className="w-28 rounded border border-gray-300 px-2 py-1 text-end text-sm"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700" htmlFor="sr-refund">
                                            Refund amount
                                        </label>
                                        <input
                                            id="sr-refund"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.refund_amount}
                                            onChange={(e) => setData('refund_amount', e.target.value)}
                                            className={field}
                                        />
                                        {errors.refund_amount && (
                                            <p className="mt-1 text-sm text-red-600">{errors.refund_amount}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label
                                            className="block text-sm font-medium text-gray-700"
                                            htmlFor="sr-refund-m"
                                        >
                                            Refund method (if amount &gt; 0)
                                        </label>
                                        <select
                                            id="sr-refund-m"
                                            value={data.refund_method}
                                            onChange={(e) => setData('refund_method', e.target.value)}
                                            className={field}
                                        >
                                            <option value="">—</option>
                                            <option value="cash">Cash</option>
                                            <option value="bank_transfer">Bank transfer</option>
                                            <option value="credit_note">Credit note</option>
                                        </select>
                                        {errors.refund_method && (
                                            <p className="mt-1 text-sm text-red-600">{errors.refund_method}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700" htmlFor="sr-reason">
                                        Reason
                                    </label>
                                    <textarea
                                        id="sr-reason"
                                        value={data.reason}
                                        onChange={(e) => setData('reason', e.target.value)}
                                        rows={3}
                                        className={field}
                                    />
                                </div>
                            </>
                        )}

                        {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}

                        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
                            <Link
                                href={route('sale-returns.index')}
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={sending || !selectedSale}
                                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save as pending
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
