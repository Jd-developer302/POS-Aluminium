import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { transformPurchaseOrderItems } from '@/lib/purchaseOrderSubmitItems';
import PurchaseOrderForm, {
    purchaseAreaPairsForForm,
    purchaseLengthPairsForForm,
} from './_Form';

function toDateInput(value) {
    if (value == null || value === '') {
        return '';
    }
    const s = String(value);
    return s.includes('T') ? s.slice(0, 10) : s.length >= 10 ? s.slice(0, 10) : s;
}

export default function Edit({
    order,
    suppliers,
    branches,
    warehouses,
    products,
    variants,
    invoice_prefix = 'INV',
}) {
    const { flash } = usePage().props;

    const showReceivedQty = order.status !== 'pending';

    const { data, setData, put, processing, errors, transform } = useForm({
        supplier_id: String(order.supplier_id ?? ''),
        branch_id: String(order.branch_id ?? ''),
        warehouse_id: String(order.warehouse_id ?? ''),
        order_number: order.order_number ?? '',
        order_date: toDateInput(order.order_date),
        expected_date: toDateInput(order.expected_date),
        notes: order.notes ?? '',
        shipping_cost: order.shipping_cost ?? 0,
        discount_amount: order.discount_amount ?? 0,
        paid_amount: order.paid_amount ?? 0,
        items: (order.items ?? []).map((it) => {
            const billingMode = it.billing_mode ?? 'quantity';
            return {
            product_id: it.product_id,
            product_variant_id: it.product_variant_id != null ? String(it.product_variant_id) : '',
            billing_mode: billingMode,
            length_pairs:
                billingMode === 'area_sqft'
                    ? purchaseAreaPairsForForm(it.length_pairs)
                    : purchaseLengthPairsForForm(it.length_pairs),
            rate_per_ft: billingMode === 'length_ft' ? String(it.unit_cost ?? '') : '',
            rate_per_sqft: billingMode === 'area_sqft' ? String(it.unit_cost ?? '') : '',
            quantity: it.quantity,
            received_quantity: it.received_quantity ?? 0,
            unit_cost: it.unit_cost,
            discount: it.discount ?? 0,
            tax_rate: it.tax_rate ?? 0,
        };
        }),
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: transformPurchaseOrderItems(form.items),
        }));
        put(route('purchase-orders.update', order.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit purchase order</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Prefix hint from Settings: <span className="font-semibold">{invoice_prefix}</span>
                            {showReceivedQty ? (
                                <span className="block text-gray-500">
                                    Received quantities apply after the order is marked sent.
                                </span>
                            ) : null}
                        </p>
                    </div>
                    <Link
                        href={route('purchase-orders.show', order.id)}
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title={`Edit ${order.order_number}`} />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <PurchaseOrderForm
                    suppliers={suppliers}
                    branches={branches}
                    warehouses={warehouses}
                    products={products}
                    variants={variants}
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submitLabel="Update order"
                    onSubmit={submit}
                    showReceivedQty={showReceivedQty}
                />
            </div>
        </AuthenticatedLayout>
    );
}
