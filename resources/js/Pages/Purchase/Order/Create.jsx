import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { transformPurchaseOrderItems } from '@/lib/purchaseOrderSubmitItems';
import PurchaseOrderForm from './_Form';

function defaultPurchaseOrderNumber(prefix) {
    const p = prefix && String(prefix).trim() ? String(prefix).trim() : 'INV';
    return `${p}-PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
}

export default function Create({
    suppliers,
    branches,
    warehouses,
    products,
    variants,
    invoice_prefix = 'INV',
}) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, transform } = useForm({
        supplier_id: '',
        branch_id: '',
        warehouse_id: '',
        order_number: defaultPurchaseOrderNumber(invoice_prefix),
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        notes: '',
        shipping_cost: 0,
        discount_amount: 0,
        paid_amount: 0,
        items: [],
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: transformPurchaseOrderItems(form.items),
        }));
        post(route('purchase-orders.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New purchase order</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Placeholder order to supplier — convert to a purchase invoice when stock arrives.
                        </p>
                    </div>
                    <Link
                        href={route('purchase-orders.index')}
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="New purchase order" />

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
                    submitLabel="Save order"
                    onSubmit={submit}
                    showReceivedQty={false}
                />
            </div>
        </AuthenticatedLayout>
    );
}
