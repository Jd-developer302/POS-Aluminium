import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { emptyLengthPairs } from '@/lib/saleLengthBilling';
import StockForm, { transformStockSubmitData } from './_Form';

export default function Create({ branches, warehouses, products }) {
    const { flash } = usePage().props;
    const existingStockId = flash?.existing_stock_id;

    const { data, setData, post, processing, errors, transform } = useForm({
        branch_id: '',
        warehouse_id: '',
        product_id: '',
        product_variant_id: '',
        billing_mode: 'quantity',
        length_pairs: emptyLengthPairs(4),
        quantity: 0,
        reserved_quantity: 0,
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) => transformStockSubmitData(form));
        post(route('stocks.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Stock</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Add a manual stock row
                        </p>
                    </div>
                    <Link
                        href={route('stocks.index')}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title="Create Stock" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            {(errors.warehouse_id || existingStockId) && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {errors.warehouse_id ? (
                        <p>{errors.warehouse_id}</p>
                    ) : (
                        <p>Stock already exists for this product, variant, and warehouse.</p>
                    )}
                    {existingStockId ? (
                        <p className="mt-2">
                            <Link
                                href={route('stocks.edit', existingStockId)}
                                className="font-semibold text-brand hover:underline"
                            >
                                Edit existing stock →
                            </Link>
                        </p>
                    ) : null}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <StockForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    branches={branches}
                    warehouses={warehouses}
                    products={products}
                    submitLabel="Create"
                    onSubmit={submit}
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}

