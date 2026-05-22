import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        rate: '0',
        type: 'percentage',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('taxes.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New tax</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Slug is generated from the name; code must be unique (e.g.
                        GST, VAT)
                    </p>
                </div>
            }
        >
            <Head title="New tax" />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        isFocused
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="code" value="Code" />
                    <TextInput
                        id="code"
                        className="mt-1 block w-full font-mono uppercase"
                        value={data.code}
                        onChange={(e) =>
                            setData('code', e.target.value.toUpperCase())
                        }
                    />
                    <InputError className="mt-2" message={errors.code} />
                </div>

                <div>
                    <InputLabel htmlFor="rate" value="Rate" />
                    <TextInput
                        id="rate"
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full"
                        value={data.rate}
                        onChange={(e) => setData('rate', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Percentage: e.g. 15 for 15%. Fixed: amount in same currency
                        unit.
                    </p>
                    <InputError className="mt-2" message={errors.rate} />
                </div>

                <div>
                    <InputLabel htmlFor="type" value="Type" />
                    <select
                        id="type"
                        className={selectClass}
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                    >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed</option>
                    </select>
                    <InputError className="mt-2" message={errors.type} />
                </div>

                <div>
                    <InputLabel htmlFor="status" value="Status" />
                    <select
                        id="status"
                        className={selectClass}
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <InputError className="mt-2" message={errors.status} />
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <PrimaryButton
                        disabled={processing}
                        className="bg-brand hover:bg-brand-dark"
                    >
                        Create tax
                    </PrimaryButton>
                    <Link
                        href={route('taxes.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
