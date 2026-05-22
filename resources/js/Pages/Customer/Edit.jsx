import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CustomerForm from './_Form';

export default function Edit({ customer }) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name ?? '',
        code: customer.code ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        address: customer.address ?? '',
        city: customer.city ?? '',
        state: customer.state ?? '',
        country: customer.country ?? '',
        postal_code: customer.postal_code ?? '',
        tax_number: customer.tax_number ?? '',
        opening_balance: String(customer.opening_balance ?? '0'),
        loyalty_points: String(customer.loyalty_points ?? '0'),
        customer_group: customer.customer_group ?? 'regular',
        credit_limit: String(customer.credit_limit ?? '0'),
        status: customer.status ?? 'active',
        notes: customer.notes ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('customers.update', customer.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit customer</h1>
                    <p className="mt-1 text-sm text-gray-500">{customer.code}</p>
                </div>
            }
        >
            <Head title={`Edit ${customer.name}`} />

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <CustomerForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    onSubmit={submit}
                    submitLabel="Save changes"
                    cancelHref={route('customers.index')}
                />
            </div>
        </AuthenticatedLayout>
    );
}
