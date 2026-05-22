import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Edit({ category }) {
    const { data, setData, put, errors, processing } = useForm({
        name: category.name,
        description: category.description || '',
        status: category.status,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('expense-categories.update', category.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Edit Expense Category
                </h2>
            }
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    />
                                    {errors.name && (
                                        <span className="text-red-600 text-sm">{errors.name}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                                        rows="4"
                                    ></textarea>
                                    {errors.description && (
                                        <span className="text-red-600 text-sm">{errors.description}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && (
                                        <span className="text-red-600 text-sm">{errors.status}</span>
                                    )}
                                </div>

                                <div className="flex gap-4 justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Update
                                    </button>
                                    <Link
                                        href={route('expense-categories.index')}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
