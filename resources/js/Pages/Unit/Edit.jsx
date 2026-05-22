import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Edit({ unit }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: unit.name ?? '',
        symbol: unit.symbol ?? '',
        status: unit.status ?? 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('units.update', unit.slug));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit unit</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Changing the name updates the slug automatically.
                    </p>
                </div>
            }
        >
            <Head title={`Edit ${unit.name}`} />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <div>
                    <InputLabel htmlFor="slug" value="Slug" />
                    <TextInput
                        id="slug"
                        className="mt-1 block w-full bg-gray-50 text-gray-600"
                        value={unit.slug}
                        readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">Read-only; derived from name.</p>
                </div>

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
                    <InputLabel htmlFor="symbol" value="Symbol (optional)" />
                    <TextInput
                        id="symbol"
                        className="mt-1 block w-full"
                        value={data.symbol}
                        onChange={(e) => setData('symbol', e.target.value)}
                        placeholder="e.g. kg, pc"
                    />
                    <InputError className="mt-2" message={errors.symbol} />
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

                <div className="flex justify-end gap-3">
                    <PrimaryButton disabled={processing}>Save changes</PrimaryButton>
                    <Link
                        href={route('units.show', unit.slug)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
