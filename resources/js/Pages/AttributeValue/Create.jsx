import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Create({ attributes }) {
    const { data, setData, post, processing, errors } = useForm({
        attribute_id: attributes?.[0]?.id ?? '',
        value: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('attribute-values.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New attribute value</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Add value under an attribute.
                    </p>
                </div>
            }
        >
            <Head title="New attribute value" />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <div>
                    <InputLabel htmlFor="attribute_id" value="Attribute" />
                    <select
                        id="attribute_id"
                        className={selectClass}
                        value={data.attribute_id}
                        onChange={(e) => setData('attribute_id', e.target.value)}
                    >
                        {attributes.map((attribute) => (
                            <option key={attribute.id} value={attribute.id}>
                                {attribute.name}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-2" message={errors.attribute_id} />
                </div>

                <div>
                    <InputLabel htmlFor="value" value="Value" />
                    <TextInput
                        id="value"
                        className="mt-1 block w-full"
                        value={data.value}
                        onChange={(e) => setData('value', e.target.value)}
                        isFocused
                    />
                    <InputError className="mt-2" message={errors.value} />
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
                    <PrimaryButton disabled={processing}>Create value</PrimaryButton>
                    <Link
                        href={route('attribute-values.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
