import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SupplierForm from './_Form';

export default function Edit({ supplier }) {
    const { data, setData, put, processing, errors } = useForm({
        name: supplier.name ?? '',
        business_name: supplier.business_name ?? '',
        code: supplier.code ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        address: supplier.address ?? '',
        city: supplier.city ?? '',
        state: supplier.state ?? '',
        country: supplier.country ?? '',
        postal_code: supplier.postal_code ?? '',
        tax_number: supplier.tax_number ?? '',
        opening_balance: String(supplier.opening_balance ?? '0'),
        credit_limit: String(supplier.credit_limit ?? '0'),
        current_balance: String(supplier.current_balance ?? '0'),
        status: supplier.status ?? 'active',
        notes: supplier.notes ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit supplier</h1>
                    <p className="mt-1 text-sm text-gray-500">{supplier.code}</p>
                </div>
            }
        >
            <Head title={`Edit ${supplier.name}`} />

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <SupplierForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    submitLabel="Save changes"
                    cancelHref={route('suppliers.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
