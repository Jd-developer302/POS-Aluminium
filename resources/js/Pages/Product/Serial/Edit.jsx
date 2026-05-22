import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import SerialForm from './_Form';

export default function Edit({ product, serial, batches, warehouses }) {
    const { flash } = usePage().props;

    const { data, setData, put, processing, errors } = useForm({
        product_batch_id: serial?.product_batch_id ?? '',
        warehouse_id: serial?.warehouse_id ?? '',
        serial_number: serial?.serial_number ?? '',
        status: serial?.status ?? 'available',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('products.serials.update', [product.slug, serial.id]));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Serial</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {product?.name}
                        </p>
                    </div>
                    <Link
                        href={route('products.serials.index', product.slug)}
                        className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title="Edit Serial" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <SerialForm
                    product={product}
                    batches={batches}
                    warehouses={warehouses}
                    data={data}
                    setData={(k, v) => setData(k, v)}
                    errors={errors}
                    processing={processing}
                    submitLabel="Save"
                    onSubmit={submit}
                />
            </div>
        </AuthenticatedLayout>
    );
}

