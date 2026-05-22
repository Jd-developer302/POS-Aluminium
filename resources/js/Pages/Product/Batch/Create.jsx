import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import BatchForm from './_Form';

export default function Create({ product, variants }) {
    const { flash } = usePage().props;
    const hasVariants = (variants?.length ?? 0) > 0 && product?.type === 'variable';

    const { data, setData, post, processing, errors } = useForm({
        product_variant_id: '',
        batch_number: '',
        manufacture_date: '',
        expiry_date: '',
        cost_price: '',
        selling_price: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('products.batches.store', product.slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Batch</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {product?.name}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('products.batches.index', product.slug)}
                            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Create Batch" />

            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <BatchForm
                    product={product}
                    variants={variants}
                    data={data}
                    setData={(k, v) => setData(k, v)}
                    errors={errors}
                    processing={processing}
                    submitLabel={hasVariants ? 'Create (variant batch)' : 'Create'}
                    onSubmit={submit}
                />
            </div>
        </AuthenticatedLayout>
    );
}

