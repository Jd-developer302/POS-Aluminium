import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Import() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null,
        add_for_sync: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('products.import.store'));
    };

    const rowErrors = flash?.import_row_errors ?? [];
    const summary = flash?.import_summary;

    return (
        <AuthenticatedLayout>
            <Head title="Import product" />

            <div className="mx-auto max-w-7xl">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="text-2xl font-semibold text-brand-dark">
                        Import product
                    </h1>

                    <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-gray-700">
                        <li>
                            <a
                                href={route('products.import.template')}
                                className="font-medium text-brand hover:text-brand-dark"
                            >
                                Download
                            </a>{' '}
                            the template (CSV with headers and one example row you
                            can delete).
                        </li>
                        <li>Add products to the downloaded template.</li>
                        <li>Select your import file below, then click import.</li>
                    </ol>

                    {flash?.success && (
                        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            {flash.success}
                            {summary != null && (
                                <p className="mt-2 text-xs text-emerald-900/90">
                                    Created: {summary.created} · Updated:{' '}
                                    {summary.updated} · Skipped (duplicate SKU):{' '}
                                    {summary.skipped}
                                </p>
                            )}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {flash.error}
                        </div>
                    )}

                    {rowErrors.length > 0 && (
                        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-900">
                                Row issues
                            </p>
                            <ul className="mt-2 max-h-48 list-inside list-disc space-y-1 overflow-y-auto text-xs text-amber-950">
                                {rowErrors.map((err, i) => (
                                    <li key={i}>
                                        Line {err.line}: {err.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-8 space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
                            <div>
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.add_for_sync}
                                        onChange={(e) =>
                                            setData(
                                                'add_for_sync',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span className="text-sm font-medium text-gray-800">
                                        Add for sync
                                    </span>
                                </label>
                                <p className="mt-2 text-xs text-gray-500">
                                    On: update products that share the same SKU.
                                    Off: skip rows whose SKU already exists.
                                </p>
                            </div>
                            <div>
                                <label
                                    htmlFor="import_file"
                                    className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                    Select import file
                                </label>
                                <input
                                    id="import_file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-muted file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-dark hover:file:bg-brand-muted/80"
                                    onChange={(e) =>
                                        setData(
                                            'file',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.file}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <PrimaryButton
                                type="submit"
                                disabled={processing || !data.file}
                                className="bg-brand hover:bg-brand-dark"
                            >
                                <span className="lowercase">import</span>
                            </PrimaryButton>
                            <Link
                                href={route('products.index')}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-200"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
