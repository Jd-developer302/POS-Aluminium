import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-semibold text-gray-700';
const comboboxWrapClass = 'relative mt-1 min-w-[14rem] rounded-md border border-gray-300 bg-white sm:min-w-[18rem]';
const comboboxInputClass =
    'block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand/20';

function customerDisplayLabel(c) {
    if (!c) return '';
    const code = String(c.code ?? '').trim();
    const name = String(c.name ?? '').trim();
    return code ? `${code} — ${name}` : name;
}

function Pagination({ links }) {
    if (!links?.length) return null;
    return (
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Pagination">
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={
                            'inline-flex min-w-[2.25rem] items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition ' +
                            (link.active
                                ? 'border-brand bg-brand text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
                        }
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}

function money(n) {
    const x = Number(n ?? 0);
    return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** @param {unknown} value */
function asStringList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value.map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    if (typeof value === 'object') {
        return Object.values(value).map((v) => (typeof v === 'string' ? v : String(v?.name ?? v ?? '')));
    }
    return [];
}

export default function Index({ dueItems, summary, branches, customers, filters: filtersProp }) {
    const { flash, auth } = usePage().props;
    const filters = filtersProp ?? {};
    const perms = asStringList(auth?.user?.permissions);
    const canEdit = !perms.length || perms.includes('customers.edit');

    const [branchId, setBranchId] = useState(filters.branch_id ? String(filters.branch_id) : '');
    const [customerId, setCustomerId] = useState(filters.customer_id ? String(filters.customer_id) : '');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerFieldFocused, setCustomerFieldFocused] = useState(false);
    const [status, setStatus] = useState(filters.status ?? '');

    const selectedCustomerId = String(customerId ?? '');
    const selectedCustomerRow = useMemo(
        () => (customers ?? []).find((c) => String(c.id) === selectedCustomerId) ?? null,
        [customers, selectedCustomerId],
    );

    const filteredCustomers = useMemo(() => {
        const q = String(customerSearchQuery ?? '').trim().toLowerCase();
        const list = customers ?? [];
        if (!q) return list;
        return list.filter((c) => {
            const name = String(c?.name ?? '').toLowerCase();
            const code = String(c?.code ?? '').toLowerCase();
            return name.includes(q) || code.includes(q) || customerDisplayLabel(c).toLowerCase().includes(q);
        });
    }, [customers, customerSearchQuery]);

    const clearCustomerFilter = () => {
        setCustomerId('');
        setCustomerSearchQuery('');
        setCustomerFieldFocused(false);
    };

    const onCustomerInputChange = (next) => {
        setCustomerSearchQuery(next);
        const typed = String(next ?? '').trim();
        if (typed === '') {
            setCustomerId('');
            return;
        }
        if (
            selectedCustomerRow &&
            typed !== customerDisplayLabel(selectedCustomerRow).trim()
        ) {
            setCustomerId('');
        }
    };

    const applyFilters = (e) => {
        e.preventDefault();
        const q = {};
        if (branchId) q.branch_id = branchId;
        if (customerId) q.customer_id = customerId;
        if (status) q.status = status;
        router.get(route('customer-receivables.index'), q, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Customer balances</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Old or manual dues, receipts (recovery), and FIFO allocation to open lines.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('customer-receivables.ledger', {
                                customer_id: customerId || undefined,
                                branch_id: branchId || undefined,
                            })}
                            className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            Account statement
                        </Link>
                        {canEdit && (
                            <>
                            <Link
                                href={route('customer-receivables.due-items.create')}
                                className="inline-flex rounded-lg border border-transparent bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                            >
                                Add due line
                            </Link>
                            <Link
                                href={route('customer-receivables.receipts.create')}
                                className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Record receipt
                            </Link>
                            <Link
                                href={route('customer-receivables.adjustments.create', {
                                    branch_id: branchId || undefined,
                                    customer_id: customerId || undefined,
                                })}
                                className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                Adjustment
                            </Link>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Customer balances" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {flash.error}
                </div>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding balance</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{money(summary?.total_balance)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recovered (allocated)</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">{money(summary?.total_recovered)}</p>
                </div>
            </div>

            <form
                onSubmit={applyFilters}
                className="mb-6 flex flex-wrap items-end gap-4 overflow-visible rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
                <div>
                    <label className={labelClass}>Branch</label>
                    <select
                        className={inputClass}
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                    >
                        <option value="">All</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClass} htmlFor="receivables_customer_search">
                        Customer
                    </label>
                    <div className={comboboxWrapClass}>
                        <div className="flex items-stretch">
                            <input
                                id="receivables_customer_search"
                                type="text"
                                autoComplete="off"
                                className={comboboxInputClass}
                                placeholder="Search customer..."
                                value={
                                    String(customerSearchQuery ?? '').trim() !== ''
                                        ? customerSearchQuery
                                        : customerDisplayLabel(selectedCustomerRow)
                                }
                                onChange={(e) => onCustomerInputChange(e.target.value)}
                                onFocus={() => setCustomerFieldFocused(true)}
                            />
                            {(selectedCustomerId || String(customerSearchQuery ?? '').trim() !== '') && (
                                <button
                                    type="button"
                                    title="Clear"
                                    onClick={clearCustomerFilter}
                                    className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                                    aria-label="Clear customer"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {(customerFieldFocused || String(customerSearchQuery ?? '').trim() !== '') && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={clearCustomerFilter}
                                    className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    All customers
                                </button>
                                {filteredCustomers.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-400">No customer found</div>
                                ) : (
                                    filteredCustomers.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setCustomerId(String(c.id));
                                                setCustomerSearchQuery('');
                                                setCustomerFieldFocused(false);
                                            }}
                                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <span className="font-medium">{customerDisplayLabel(c)}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">All</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="written_off">Written off</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                    Apply
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Date</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Customer</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Branch</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Source</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Product</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Original</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Paid</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Adjusted</th>
                                <th className="px-4 py-3 text-end font-semibold text-gray-700">Balance</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Status</th>
                                <th className="px-4 py-3 text-start font-semibold text-gray-700">Files</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {dueItems.data.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                                        No due lines for this filter.
                                    </td>
                                </tr>
                            ) : (
                                dueItems.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {row.transaction_date
                                                ? new Date(row.transaction_date).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800">
                                            {row.customer ? `${row.customer.code} — ${row.customer.name}` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{row.branch?.name ?? '—'}</td>
                                        <td className="px-4 py-3 capitalize text-gray-700">{row.source_type}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            <div className="font-medium">{row.product_name || '—'}</div>
                                            {row.variant_name ? (
                                                <div className="text-xs text-gray-500">{row.variant_name}</div>
                                            ) : null}
                                            {row.reference_no ? (
                                                <div className="text-xs text-gray-400">Ref: {row.reference_no}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-end font-medium text-gray-900">
                                            {money(row.original_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-end text-gray-800">{money(row.paid_amount)}</td>
                                        <td className="px-4 py-3 text-end text-gray-800">{money(row.adjusted_amount)}</td>
                                        <td className="px-4 py-3 text-end font-semibold text-gray-900">
                                            {money(row.balance_amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-800">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            <div className="flex flex-wrap gap-2">
                                                {row.supporting_image_url ? (
                                                    <a
                                                        href={row.supporting_image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-brand hover:underline"
                                                    >
                                                        Image
                                                    </a>
                                                ) : null}
                                                {row.supporting_pdf_url ? (
                                                    <a
                                                        href={row.supporting_pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-brand hover:underline"
                                                    >
                                                        PDF
                                                    </a>
                                                ) : null}
                                                {!row.supporting_image_url && !row.supporting_pdf_url ? (
                                                    <span className="text-xs text-gray-400">—</span>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination links={dueItems.links} />
            </div>
        </AuthenticatedLayout>
    );
}
