import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import StockAdjustmentForm from './_Form';

export default function Edit({ adjustment, branches, warehouses, products, variants, batches }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        branch_id: adjustment?.branch_id ?? '',
        warehouse_id: adjustment?.warehouse_id ?? '',
        adjustment_date: (adjustment?.adjustment_date ?? '').toString().slice(0, 10),
        reference_number: adjustment?.reference_number ?? '',
        type: adjustment?.type ?? 'increase',
        status: adjustment?.status ?? 'draft',
        reason: adjustment?.reason ?? '',
        items: (adjustment?.items ?? []).map((it) => ({
            id: it.id,
            product_id: it.product_id,
            product_variant_id: it.product_variant_id ?? '',
            product_batch_id: it.product_batch_id ?? '',
            quantity: it.quantity ?? 1,
            notes: it.notes ?? '',
        })),
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('stock-adjustments.update', adjustment.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Stock Adjustment</h1>
                        <p className="mt-1 text-sm text-gray-500">#{adjustment.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('stock-adjustments.show', adjustment.id)}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            View
                        </Link>
                        <Link
                            href={route('products.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Products List
                        </Link>
                        <Link
                            href={route('stock-adjustments.index')}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Edit Stock Adjustment" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <StockAdjustmentForm
                    branches={branches}
                    warehouses={warehouses}
                    products={products}
                    variants={variants}
                    batches={batches}
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submitLabel="Save"
                    onSubmit={submit}
                />
            </div>
        </AuthenticatedLayout>
    );
}

