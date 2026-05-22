import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';

export default function Create({ branches, warehouses, products }) {
    const [selectedProduct, setSelectedProduct] = useState('');

    const whByBranch = useMemo(() => {
        const m = new Map();
        (warehouses ?? []).forEach((w) => {
            const bid = String(w.branch_id);
            if (!m.has(bid)) m.set(bid, []);
            m.get(bid).push(w);
        });
        return m;
    }, [warehouses]);

    const { data, setData, post, processing, errors } = useForm({
        from_branch_id: '',
        to_branch_id: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        reference_number: `TRF-${Date.now()}`,
        status: 'draft',
        notes: '',
        items: [],
    });

    const fromWarehouses = whByBranch.get(String(data.from_branch_id)) ?? [];
    const toWarehouses = whByBranch.get(String(data.to_branch_id)) ?? [];

    const addItem = () => {
        if (!selectedProduct) return;
        setData('items', [
            ...data.items,
            { product_id: Number(selectedProduct), product_variant_id: null, quantity: 1 },
        ]);
        setSelectedProduct('');
    };

    const updateItem = (idx, key, value) => {
        setData(
            'items',
            data.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
        );
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        post(route('stock-transfers.store'));
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-gray-900">Create Transfer</h1>}>
            <Head title="Create Transfer" />

            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <form onSubmit={onSubmit} className="space-y-6 p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className={labelClass}>From Branch</label>
                                <select
                                    value={data.from_branch_id}
                                    onChange={(e) => {
                                        setData('from_branch_id', e.target.value);
                                        setData('from_warehouse_id', '');
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.from_branch_id && <p className="mt-1 text-sm text-red-600">{errors.from_branch_id}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>To Branch</label>
                                <select
                                    value={data.to_branch_id}
                                    onChange={(e) => {
                                        setData('to_branch_id', e.target.value);
                                        setData('to_warehouse_id', '');
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.to_branch_id && <p className="mt-1 text-sm text-red-600">{errors.to_branch_id}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>From Warehouse</label>
                                <select
                                    value={data.from_warehouse_id}
                                    onChange={(e) => setData('from_warehouse_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {fromWarehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.from_warehouse_id && <p className="mt-1 text-sm text-red-600">{errors.from_warehouse_id}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>To Warehouse</label>
                                <select
                                    value={data.to_warehouse_id}
                                    onChange={(e) => setData('to_warehouse_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {toWarehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.to_warehouse_id && <p className="mt-1 text-sm text-red-600">{errors.to_warehouse_id}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Transfer Date</label>
                                <input
                                    type="date"
                                    value={data.transfer_date}
                                    onChange={(e) => setData('transfer_date', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.transfer_date && <p className="mt-1 text-sm text-red-600">{errors.transfer_date}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Reference</label>
                                <input
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    className={inputClass}
                                />
                                {errors.reference_number && <p className="mt-1 text-sm text-red-600">{errors.reference_number}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>Status</label>
                                <select value={data.status} onChange={(e) => setData('status', e.target.value)} className={inputClass}>
                                    <option value="draft">Draft</option>
                                    <option value="completed">Completed (move stock)</option>
                                </select>
                                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Notes</label>
                                <input value={data.notes} onChange={(e) => setData('notes', e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200">
                            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                    <label className={labelClass}>Add product</label>
                                    <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className={inputClass}>
                                        <option value="">Select product</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="button" onClick={addItem} className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
                                    Add
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">Product</th>
                                            <th className="px-4 py-3 text-start font-semibold text-gray-700">Qty</th>
                                            <th className="px-4 py-3 text-end font-semibold text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {data.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">Add at least one item.</td>
                                            </tr>
                                        ) : (
                                            data.items.map((it, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-gray-900">
                                                        {products.find((p) => p.id === Number(it.product_id))?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            value={it.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-end">
                                                        <button type="button" onClick={() => removeItem(idx)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50">
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href={route('stock-transfers.index')} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                                Cancel
                            </Link>
                            <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

