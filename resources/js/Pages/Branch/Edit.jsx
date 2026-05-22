import BranchLogoDropzone from '@/Components/BranchLogoDropzone';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Edit({ branch }) {
    const { data, setData, put, post, processing, errors, transform } = useForm({
        name: branch.name,
        address: branch.address ?? '',
        phone: branch.phone ?? '',
        email: branch.email ?? '',
        website: branch.website ?? '',
        logo: null,
        status: branch.status,
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) =>
            form.logo instanceof File ? { ...form, _method: 'put' } : form,
        );
        if (data.logo instanceof File) {
            post(route('branches.update', branch.id));
        } else {
            put(route('branches.update', branch.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit branch</h1>
                    <p className="mt-1 text-sm text-gray-500">{branch.name}</p>
                </div>
            }
        >
            <Head title={`Edit ${branch.name}`} />

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
                <div className="grid gap-4 sm:grid-cols-2 mt-4">
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
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="website" value="Website" />
                    <TextInput
                        id="website"
                        className="mt-1 block w-full"
                        value={data.website}
                        onChange={(e) => setData('website', e.target.value)}
                    />
                    <InputError className="mt-2" message={errors.website} />
                </div>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:items-stretch">
                    <div className="flex min-h-0 min-w-0 flex-col sm:h-full">
                        <InputLabel htmlFor="address" value="Address" />
                        <textarea
                            id="address"
                            rows={5}
                            className={`${selectClass} min-h-[9.5rem] flex-1 resize-y sm:min-h-0`}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                        <div className="mt-2 shrink-0 space-y-2">
                            <div className="min-h-8" aria-hidden />
                            <InputError message={errors.address} />
                        </div>
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-col sm:h-full">
                        <BranchLogoDropzone
                            id="logo"
                            label="Logo"
                            file={data.logo}
                            existingUrl={branch.logo_url}
                            onFileChange={(file) => setData('logo', file)}
                            error={errors.logo}
                            disabled={processing}
                            className="flex flex-1 flex-col"
                        />
                    </div>
                </div>

                <div className="mt-4">
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

                <div className="flex flex-wrap gap-3 mt-4 justify-end">
                    <PrimaryButton
                        disabled={processing}
                        className="bg-brand hover:bg-brand-dark"
                    >
                        Save changes
                    </PrimaryButton>
                    <Link
                        href={route('branches.show', branch.id)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
