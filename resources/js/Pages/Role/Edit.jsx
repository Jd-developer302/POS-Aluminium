import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PermissionPicker from './PermissionPicker';

export default function Edit({ role, permissions }) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: [...role.permissions],
    });

    const togglePermission = (name) => {
        setData(
            'permissions',
            data.permissions.includes(name)
                ? data.permissions.filter((p) => p !== name)
                : [...data.permissions, name],
        );
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit role</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Update name and permissions for this role
                    </p>
                </div>
            }
        >
            <Head title={`Edit ${role.name}`} />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
                <div>
                    <InputLabel htmlFor="name" value="Role name" />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        isFocused
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <PermissionPicker
                    permissions={permissions}
                    selected={data.permissions}
                    onToggle={togglePermission}
                    error={errors.permissions}
                />

                <div className="flex flex-wrap gap-3">
                    <PrimaryButton disabled={processing} className="bg-brand hover:bg-brand-dark">
                        Save changes
                    </PrimaryButton>
                    <Link
                        href={route('roles.show', role.id)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
