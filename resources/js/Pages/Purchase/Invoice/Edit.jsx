import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { emptyLengthPairs } from '@/lib/saleLengthBilling';
import { transformPurchaseInvoiceItems } from '@/lib/purchaseInvoiceSubmitItems';
import PurchaseInvoiceForm from './_Form';

function pairsFromInvoice(raw) {
    const base = emptyLengthPairs();
    const arr = Array.isArray(raw) ? raw : [];
    for (let i = 0; i < base.length; i++) {
        const row = arr[i];
        if (row && typeof row === 'object') {
            base[i] = {
                length:
                    row.length != null && row.length !== '' ? String(row.length) : '',
                qty: row.qty != null && row.qty !== '' ? String(row.qty) : '',
            };
        }
    }
    return base;
}

function toDateInput(value) {
    if (value == null || value === '') {
        return '';
    }
    const s = String(value);
    return s.includes('T') ? s.slice(0, 10) : s.length >= 10 ? s.slice(0, 10) : s;
}

export default function Edit({
    invoice,
    suppliers,
    branches,
    warehouses,
    products,
    variants,
    batches,
    invoice_prefix = 'INV',
}) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors, transform } = useForm({
        supplier_id: String(invoice.supplier_id ?? ''),
        branch_id: String(invoice.branch_id ?? ''),
        warehouse_id: String(invoice.warehouse_id ?? ''),
        invoice_number: invoice.invoice_number ?? '',
        invoice_date: toDateInput(invoice.invoice_date),
        due_date: toDateInput(invoice.due_date),
        notes: invoice.notes ?? '',
        shipping_cost: invoice.shipping_cost ?? 0,
        discount_amount: invoice.discount_amount ?? 0,
        items: (invoice.items ?? []).map((it) => ({
            product_id: it.product_id,
            product_variant_id: it.product_variant_id != null ? String(it.product_variant_id) : '',
            product_batch_id: it.product_batch_id != null ? String(it.product_batch_id) : '',
            billing_mode: it.billing_mode ?? 'quantity',
            length_pairs: pairsFromInvoice(it.length_pairs),
            rate_per_ft:
                (it.billing_mode ?? 'quantity') === 'length_ft'
                    ? String(it.unit_cost ?? '')
                    : '',
            quantity: it.quantity,
            unit_cost: it.unit_cost,
            discount: it.discount ?? 0,
            tax_rate: it.tax_rate ?? 0,
        })),
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: transformPurchaseInvoiceItems(form.items),
        }));
        put(route('purchase-invoices.update', invoice.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit purchase invoice</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Draft only — prefix from Settings: <span className="font-semibold">{invoice_prefix}</span>
                        </p>
                    </div>
                    <Link
                        href={route('purchase-invoices.show', invoice.id)}
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title={`Edit ${invoice.invoice_number}`} />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <PurchaseInvoiceForm
                    suppliers={suppliers}
                    branches={branches}
                    warehouses={warehouses}
                    products={products}
                    variants={variants}
                    batches={batches}
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submitLabel="Update invoice"
                    onSubmit={submit}
                />
            </div>
        </AuthenticatedLayout>
    );
}
