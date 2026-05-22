import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Edit({ tax }) {
    const { data, setData, put, processing, errors } = useForm({
        name: tax.name,
        code: tax.code,
        rate: tax.rate,
        type: tax.type,
        status: tax.status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('taxes.update', tax.slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit tax</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        <span className="font-mono text-gray-700">{tax.slug}</span>
                        <span className="text-gray-400"> · </span>
                        Slug updates when you change the name
                    </p>
                </div>
            }
        >
            <Head title={`Edit ${tax.name}`} />

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
                    <InputLabel value="Slug (read-only)" />
                    <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                        {tax.slug}
                    </p>
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
                        Save changes
                    </PrimaryButton>
                    <Link
                        href={route('taxes.show', tax.slug)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
