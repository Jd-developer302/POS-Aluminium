import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import StockForm, { stockLengthPairsForForm, transformStockSubmitData } from './_Form';

export default function Edit({ stock, branches, warehouses, products }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors, transform } = useForm({
        branch_id: stock?.warehouse?.branch_id ?? '',
        warehouse_id: stock?.warehouse_id ?? '',
        product_id: stock?.product_id ?? '',
        product_variant_id: stock?.product_variant_id ?? '',
        billing_mode: stock?.billing_mode ?? 'quantity',
        length_pairs: stockLengthPairsForForm(stock),
        quantity: stock?.quantity ?? 0,
        reserved_quantity: stock?.reserved_quantity ?? 0,
        status: stock?.status ?? 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) => transformStockSubmitData(form));
        put(route('stocks.update', stock.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Stock</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Update stock row details
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('stocks.show', stock.id)}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            View
                        </Link>
                        <Link
                            href={route('stocks.index')}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Edit Stock" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
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
                    submitLabel="Save"
                    onSubmit={submit}
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}

