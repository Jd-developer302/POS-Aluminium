import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

export default function DueItemCreate({ branches, customers, products }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        branch_id: branches[0]?.id ? String(branches[0].id) : '',
        customer_id: '',
        source_type: 'old_balance',
        sale_id: '',
        product_id: '',
        product_variant_id: '',
        product_name: '',
        variant_name: '',
        reference_no: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        due_date: '',
        original_amount: '',
        notes: '',
        supporting_image: null,
        supporting_pdf: null,
    });

    transform((raw) => ({
        ...raw,
        sale_id: raw.source_type === 'sale' ? raw.sale_id : null,
        product_id: raw.product_id || null,
        product_variant_id: raw.product_variant_id || null,
    }));

    const product = useMemo(() => {
        if (!data.product_id) return null;
        return products.find((p) => String(p.id) === String(data.product_id)) ?? null;
    }, [data.product_id, products]);

    const showVariants = product?.type === 'variable';

    const submit = (e) => {
        e.preventDefault();
        post(route('customer-receivables.due-items.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add due line</h1>
                        <p className="mt-1 text-sm text-gray-500">Old balance or manual line — original = balance when unpaid.</p>
                    </div>
                    <Link
                        href={route('customer-receivables.index')}
                        className="text-sm font-semibold text-brand hover:underline"
                    >
                        Back to list
                    </Link>
                </div>
            }
        >
            <Head title="Add due line" />

            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Branch</label>
                        <select
                            className={inputClass}
                            value={data.branch_id}
                            onChange={(e) => setData('branch_id', e.target.value)}
                            required
                        >
                            <option value="">Select branch</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        {errors.branch_id && <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>}
                    </div>
                    <div>
                        <label className={labelClass}>Customer</label>
                        <select
                            className={inputClass}
                            value={data.customer_id}
                            onChange={(e) => setData('customer_id', e.target.value)}
                            required
                        >
                            <option value="">Select customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.code} — {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Source type</label>
                        <select
                            className={inputClass}
                            value={data.source_type}
                            onChange={(e) => setData('source_type', e.target.value)}
                        >
                            <option value="old_balance">Old balance</option>
                            <option value="manual">Manual</option>
                            <option value="sale">Sale</option>
                        </select>
                        {errors.source_type && <p className="mt-1 text-sm text-red-600">{errors.source_type}</p>}
                    </div>
                    {data.source_type === 'sale' && (
                        <div>
                            <label className={labelClass}>Sale ID</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={data.sale_id}
                                onChange={(e) => setData('sale_id', e.target.value)}
                                min={1}
                            />
                            {errors.sale_id && <p className="mt-1 text-sm text-red-600">{errors.sale_id}</p>}
                        </div>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Product (optional)</label>
                        <select
                            className={inputClass}
                            value={data.product_id}
                            onChange={(e) => {
                                setData('product_id', e.target.value);
                                setData('product_variant_id', '');
                            }}
                        >
                            <option value="">—</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {showVariants && (
                        <div>
                            <label className={labelClass}>Variant</label>
                            <select
                                className={inputClass}
                                value={data.product_variant_id}
                                onChange={(e) => setData('product_variant_id', e.target.value)}
                            >
                                <option value="">—</option>
                                {(product?.variants ?? []).map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.sku} — {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Product name snapshot (optional)</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={data.product_name}
                            onChange={(e) => setData('product_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Variant name snapshot (optional)</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={data.variant_name}
                            onChange={(e) => setData('variant_name', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Reference</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={data.reference_no}
                            onChange={(e) => setData('reference_no', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Original amount</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={inputClass}
                            value={data.original_amount}
                            onChange={(e) => setData('original_amount', e.target.value)}
                            required
                        />
                        {errors.original_amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.original_amount}</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Transaction date</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={data.transaction_date}
                            onChange={(e) => setData('transaction_date', e.target.value)}
                            required
                        />
                        {errors.transaction_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Due date (optional)</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelClass}>Invoice / scan image (optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            className={inputClass}
                            onChange={(e) =>
                                setData('supporting_image', e.target.files?.[0] ? e.target.files[0] : null)
                            }
                        />
                        <p className="mt-1 text-xs text-gray-500">JPEG, PNG, WebP, etc. Max ~10 MB.</p>
                        {errors.supporting_image && (
                            <p className="mt-1 text-sm text-red-600">{errors.supporting_image}</p>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Supporting PDF (optional)</label>
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className={inputClass}
                            onChange={(e) =>
                                setData('supporting_pdf', e.target.files?.[0] ? e.target.files[0] : null)
                            }
                        />
                        <p className="mt-1 text-xs text-gray-500">PDF only. Max ~15 MB.</p>
                        {errors.supporting_pdf && (
                            <p className="mt-1 text-sm text-red-600">{errors.supporting_pdf}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Notes</label>
                    <textarea
                        rows={3}
                        className={inputClass}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                    <Link
                        href={route('customer-receivables.index')}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        Save
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
