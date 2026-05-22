import BranchLogoDropzone from '@/Components/BranchLogoDropzone';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Create({ categories }) {
    const firstId = categories?.[0]?.id ?? '';

    const { data, setData, post, processing, errors } = useForm({
        category_id: firstId,
        name: '',
        image: null,
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('sub-categories.store'));
    };

    const hasCategories = categories && categories.length > 0;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        New subcategory
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Slug is generated automatically from the name
                    </p>
                </div>
            }
        >
            <Head title="New subcategory" />

            {!hasCategories ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    <p className="font-medium">Create a category first</p>
                    <p className="mt-1 text-amber-800/90">
                        Subcategories must belong to a category.
                    </p>
                    <Link
                        href={route('categories.create')}
                        className="mt-3 inline-flex text-sm font-semibold text-brand hover:underline"
                    >
                        Go to new category
                    </Link>
                </div>
            ) : (
                <form
                    onSubmit={submit}
                    className="mx-auto max-w-7xl space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
                >
                    <div>
                        <InputLabel htmlFor="category_id" value="Category" />
                        <select
                            id="category_id"
                            className={selectClass}
                            value={data.category_id}
                            onChange={(e) =>
                                setData(
                                    'category_id',
                                    Number(e.target.value) || '',
                                )
                            }
                        >
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <InputError
                            className="mt-2"
                            message={errors.category_id}
                        />
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

                    <BranchLogoDropzone
                        id="image"
                        label="Image"
                        file={data.image}
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
                            onChange={(e) =>
                                setData('status', e.target.value)
                            }
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
                            Create subcategory
                        </PrimaryButton>
                        <Link
                            href={route('sub-categories.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            )}
        </AuthenticatedLayout>
    );
}
