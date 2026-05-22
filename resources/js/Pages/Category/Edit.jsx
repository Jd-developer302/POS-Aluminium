import BranchLogoDropzone from '@/Components/BranchLogoDropzone';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Edit({ category }) {
    const { data, setData, put, post, processing, errors, transform } = useForm({
        name: category.name,
        image: null,
        status: category.status,
    });

    const submit = (e) => {
        e.preventDefault();
        transform((form) =>
            form.image instanceof File ? { ...form, _method: 'put' } : form,
        );
        if (data.image instanceof File) {
            post(route('categories.update', category.slug));
        } else {
            put(route('categories.update', category.slug));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit category</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        <span className="font-mono text-gray-700">{category.slug}</span>
                        <span className="text-gray-400"> · </span>
                        Slug updates when you change the name
                    </p>
                </div>
            }
        >
            <Head title={`Edit ${category.name}`} />

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
                    <InputLabel value="Slug (read-only)" />
                    <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                        {category.slug}
                    </p>
                </div>

                <BranchLogoDropzone
                    id="image"
                    label="Image"
                    file={data.image}
                    existingUrl={category.image_url}
                    onFileChange={(file) => setData('image', file)}
                    error={errors.image}
                    disabled={processing}
                />

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
                        href={route('categories.show', category.slug)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
