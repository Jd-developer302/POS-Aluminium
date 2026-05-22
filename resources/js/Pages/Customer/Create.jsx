import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CustomerForm from './_Form';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
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
        loyalty_points: '0',
        customer_group: 'regular',
        credit_limit: '0',
        status: 'active',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('customers.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New customer</h1>
                    <p className="mt-1 text-sm text-gray-500">Unique code is used on sales and reports.</p>
                </div>
            }
        >
            <Head title="New customer" />

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <CustomerForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    submitLabel="Create customer"
                    cancelHref={route('customers.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
