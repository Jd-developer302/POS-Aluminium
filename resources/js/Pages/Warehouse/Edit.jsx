import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Edit({ warehouse, branches }) {
    const { data, setData, put, processing, errors } = useForm({
        branch_id: warehouse.branch_id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address ?? '',
        phone: warehouse.phone ?? '',
        is_default: warehouse.is_default,
        status: warehouse.status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('warehouses.update', warehouse.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit warehouse</h1>
                    <p className="mt-1 text-sm text-gray-500">{warehouse.name}</p>
                </div>
            }
        >
            <Head title={`Edit ${warehouse.name}`} />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
                <div>
                    <InputLabel htmlFor="branch_id" value="Branch" />
                    <select
                        id="branch_id"
                        className={selectClass}
                        value={data.branch_id}
                        onChange={(e) =>
                            setData('branch_id', e.target.value ? Number(e.target.value) : '')
                        }
                        required
                    >
                        {(branches ?? []).map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-2" message={errors.branch_id} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                            className="mt-1 block w-full font-mono"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.code} />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="address" value="Address" />
                    <textarea
                        id="address"
                        rows={3}
                        className={selectClass}
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                    />
                    <InputError className="mt-2" message={errors.address} />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Phone" />
                    <TextInput
                        id="phone"
                        type="tel"
                        className="mt-1 block w-full"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                        <Checkbox
                            id="is_default"
                            checked={data.is_default}
                            onChange={(e) => setData('is_default', e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">
                            Default warehouse for this branch
                        </span>
                    </label>
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
                        href={route('warehouses.show', warehouse.id)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
