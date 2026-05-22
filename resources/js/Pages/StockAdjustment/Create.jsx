import React, { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import StockAdjustmentForm from './_Form';

export default function Create({ branches, warehouses, products, variants, batches, prefillProductId }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        warehouse_id: '',
        adjustment_date: new Date().toISOString().split('T')[0],
        reference_number: `ADJ-${Date.now()}`,
        type: 'increase',
        status: 'draft',
        reason: '',
        items: [],
    });

    useEffect(() => {
        if (!prefillProductId) return;
        const pid = Number(prefillProductId);
        if (!pid) return;
        setData('items', [
            {
                id: null,
                product_id: pid,
                product_variant_id: '',
                product_batch_id: '',
                quantity: 1,
                notes: '',
            },
        ]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefillProductId]);

    const submit = (e) => {
        e.preventDefault();
        post(route('stock-adjustments.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Stock Adjustment</h1>
                        <p className="mt-1 text-sm text-gray-500">Draft or complete to update stock</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
            <Head title="Create Stock Adjustment" />

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
                    submitLabel="Create"
                    onSubmit={submit}
                />
            </div>
        </AuthenticatedLayout>
    );
}

