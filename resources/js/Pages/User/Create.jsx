import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import RoleCheckboxList from './RoleCheckboxList';

const selectClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

export default function Create({ roles, branches }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        branch_id: '',
        password: '',
        password_confirmation: '',
        roles: [],
    });

    const toggleRole = (name) => {
        setData(
            'roles',
            data.roles.includes(name)
                ? data.roles.filter((r) => r !== name)
                : [...data.roles, name],
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New user</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Account details and role assignment
                    </p>
                </div>
            }
        >
            <Head title="New user" />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
                <div>
                    <InputLabel htmlFor="name" value="Full name" />
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

                <div>
                    <InputLabel htmlFor="phone" value="Phone (optional)" />
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
                    <InputLabel htmlFor="branch_id" value="Branch" />
                    <select
                        id="branch_id"
                        className={selectClass}
                        value={data.branch_id === null || data.branch_id === '' ? '' : data.branch_id}
                        onChange={(e) =>
                            setData(
                                'branch_id',
                                e.target.value === '' ? '' : Number(e.target.value),
                            )
                        }
                    >
                        <option value="">None (Super Admin only)</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        Required for all roles except Super Admin.
                    </p>
                    <InputError className="mt-2" message={errors.branch_id} />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError className="mt-2" message={errors.password} />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm password"
                    />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                    />
                </div>

                <RoleCheckboxList
                    roles={roles}
                    selected={data.roles}
                    onToggle={toggleRole}
                    errors={errors}
                />

                <div className="flex flex-wrap gap-3">
                    <PrimaryButton
                        disabled={processing}
                        className="bg-brand hover:bg-brand-dark"
                    >
                        Create user
                    </PrimaryButton>
                    <Link
                        href={route('users.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition duration-150 ease-in-out hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
