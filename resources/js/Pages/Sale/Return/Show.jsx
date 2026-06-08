import React, { useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    saleReturnCutsSummary,
    saleReturnQtyLabel,
    saleReturnTableHeaders,
    saleReturnUnitPriceLabel,
    saleReturnVariantLabel,
} from '@/lib/saleReturnLineDisplay';

const btn =
    'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition';
const fieldLabel = 'text-sm font-semibold text-gray-700';

function lineDisplaySource(it) {
    const saleItem = it.sale_item ?? it.saleItem;
    if (!saleItem) {
        return {
            billing_mode: 'quantity',
            length_pairs: [],
            unit_price: it.unit_price,
            variant_label: null,
            product_variant_id: it.product_variant_id,
        };
    }
    const pv = it.product_varient ?? it.productVarient;
    const sku = String(pv?.sku ?? '').trim();
    const name = String(pv?.name ?? '').trim();
    const variantLabel = sku && name ? `${sku} — ${name}` : sku || name || null;

    return {
        billing_mode: saleItem.billing_mode ?? 'quantity',
        length_pairs: saleItem.length_pairs ?? [],
        unit_price: it.unit_price ?? saleItem.unit_price,
        variant_label: variantLabel,
        product_variant_id: it.product_variant_id,
    };
}

export default function Show({ saleReturn: r }) {
    const { flash } = usePage().props;
    const completeForm = useForm({});

    const displayLines = useMemo(
        () =>
            (r.items || []).map((it) => {
                const src = lineDisplaySource(it);
                return {
                    id: it.id,
                    product_name: it.product?.name ?? it.product_id,
                    ...src,
                    quantity: it.quantity,
                    subtotal: it.subtotal,
                };
            }),
        [r.items],
    );

    const tableHeaders = useMemo(() => saleReturnTableHeaders(displayLines), [displayLines]);

    const onComplete = () => {
        completeForm.post(route('sale-returns.complete', r.id));
    };

    const onDelete = () => {
        router.delete(route('sale-returns.destroy', r.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Return {r.return_number}</h1>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('sale-returns.index')}
                            className={btn + ' border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}
                        >
                            All returns
                        </Link>
                        {r.sale_id && (
                            <Link
                                href={route('sales.show', r.sale_id)}
                                className={btn + ' border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}
                            >
                                View sale
                            </Link>
                        )}
                        {r.status === 'pending' && (
                            <>
                                <button
                                    type="button"
                                    onClick={onComplete}
                                    disabled={completeForm.processing}
                                    className={
                                        btn +
                                        ' border-transparent bg-sky-900 text-white hover:bg-sky-950 disabled:opacity-50'
                                    }
                                >
                                    Complete (restock)
                                </button>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={completeForm.processing}
                                    className={
                                        btn +
                                        ' border-red-200 bg-red-50 text-red-800 hover:bg-red-100 disabled:opacity-50'
                                    }
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={r.return_number} />

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

            <div className="mx-auto max-w-5xl space-y-6">
                <div className="grid gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:grid-cols-2">
                    <div>
                        <p className={fieldLabel}>Date</p>
                        <p className="mt-1 text-gray-900">
                            {r.return_date ? String(r.return_date).slice(0, 10) : '—'}
                        </p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Status</p>
                        <p className="mt-1 capitalize text-gray-900">{r.status}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Sale</p>
                        <p className="mt-1 text-gray-900">{r.sale?.sale_number ?? '—'}</p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Warehouse</p>
                        <p className="mt-1 text-gray-900">{r.warehouse?.name ?? '—'}</p>
                    </div>
                    {r.customer && (
                        <div>
                            <p className={fieldLabel}>Customer</p>
                            <p className="mt-1 text-gray-900">{r.customer.name}</p>
                        </div>
                    )}
                    <div>
                        <p className={fieldLabel}>Subtotal / Total</p>
                        <p className="mt-1 text-gray-900">
                            {r.subtotal} / {r.total}
                        </p>
                    </div>
                    <div>
                        <p className={fieldLabel}>Refund</p>
                        <p className="mt-1 text-gray-900">
                            {r.refund_amount} {r.refund_method ? `(${r.refund_method})` : ''}
                        </p>
                    </div>
                    {r.creator && (
                        <div>
                            <p className={fieldLabel}>Created by</p>
                            <p className="mt-1 text-gray-900">{r.creator.name}</p>
                        </div>
                    )}
                </div>

                {r.reason && (
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <p className={fieldLabel}>Reason</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{r.reason}</p>
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Lines</h2>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">Product</th>
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
                                        {tableHeaders.returnHeader}
                                    </th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">Unit price</th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayLines.map((it) => (
                                    <tr key={it.id}>
                                        <td className="px-3 py-2 font-medium text-gray-900">
                                            {it.product_name}
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
                                        <td className="px-3 py-2 text-end tabular-nums">
                                            {saleReturnQtyLabel(it.quantity, it.billing_mode)}
                                        </td>
                                        <td className="px-3 py-2 text-end">{saleReturnUnitPriceLabel(it)}</td>
                                        <td className="px-3 py-2 text-end font-medium">{it.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {r.status === 'pending' && (
                    <p className="text-sm text-amber-800">
                        Pending: click <strong>Complete (restock)</strong> to add stock for this return.
                    </p>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
