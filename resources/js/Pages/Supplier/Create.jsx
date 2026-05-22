import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SupplierForm from './_Form';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        business_name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        tax_number: '',
        opening_balance: '0',
        credit_limit: '0',
        current_balance: '0',
        status: 'active',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('suppliers.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New supplier</h1>
                    <p className="mt-1 text-sm text-gray-500">Slug is generated from the name automatically.</p>
                </div>
            }
        >
            <Head title="New supplier" />

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <SupplierForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    submitLabel="Create supplier"
                    cancelHref={route('suppliers.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
