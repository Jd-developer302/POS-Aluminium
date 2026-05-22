import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const REPORTS = [
    { type: 'sales', label: 'Sales', description: 'Invoices, payment status, totals' },
    { type: 'profit-margin', label: 'Profit margin', description: 'Net revenue minus estimated COGS (cost-aware)' },
    { type: 'tax-summary', label: 'Tax summary', description: 'Monthly sales vs purchase tax by branch' },
    { type: 'discount-analysis', label: 'Discount analysis', description: 'Line vs invoice discounts by branch, cashier, product, month' },
    { type: 'returns-analysis', label: 'Returns analysis', description: 'Completed returns by branch, user, product, month' },
    { type: 'expense-vs-sales', label: 'Expense vs sales', description: 'Monthly sales versus expenses by branch' },
    { type: 'sale-returns', label: 'Sale returns', description: 'Returns and refunds' },
    { type: 'customer-receivables', label: 'Customer receivables (detail)', description: 'Per customer & invoice: dues, payments, dates, grand totals' },
    {
        type: 'customer-ledger',
        label: 'Customer account statement',
        description: 'Printable ledger (Credit / Debit / running Balance) — use Customer balances → Account statement',
        href: 'customer-receivables.ledger',
    },
    {
        type: 'customer-due-register',
        label: 'Customer balances register',
        description: 'Due lines from Customer balances: branch, amounts, status, source (opening / sale / manual)',
    },
    { type: 'customer-aging', label: 'Customer outstanding', description: 'Credit sales due & aging buckets' },
    { type: 'expenses', label: 'Expenses', description: 'By branch, category, date' },
    { type: 'purchase-invoices', label: 'Purchase invoices', description: 'Supplier purchases' },
    {
        type: 'purchase-order-notifications',
        label: 'PO supplier notifications',
        description: 'Email & WhatsApp logs when orders are marked sent',
    },
    { type: 'purchase-orders', label: 'Purchase orders', description: 'PO lines ordered vs received' },
    { type: 'quotations', label: 'Quotations', description: 'Quote headers: customer, dates, status, totals, converted sale' },
    { type: 'quotation-lines', label: 'Quotation lines', description: 'Each line: product, qty, pricing, billing mode, lengths (L×Q)' },
    { type: 'supplier-aging', label: 'Supplier outstanding', description: 'AP due & aging by invoice' },
    { type: 'product-sales-summary', label: 'Product sales summary', description: 'Fast / slow movers by period' },
    { type: 'stock-valuation', label: 'Stock valuation', description: 'Qty × unit cost by warehouse' },
    { type: 'inventory-movements', label: 'Inventory movements', description: 'Stock audit trail' },
    { type: 'stock-transfers', label: 'Stock transfers', description: 'Inter-branch / warehouse' },
    { type: 'stocks', label: 'Stocks', description: 'Current levels & availability' },
    { type: 'stock-adjustments', label: 'Stock adjustments', description: 'Adjustments & corrections' },
];

export default function Index() {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Filter data, preview on screen, then download CSV or PDF.
                    </p>
                </div>
            }
        >
            <Head title="Reports" />

            <div className="mx-auto max-w-7xl">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {REPORTS.map((r) => (
                        <Link
                            key={r.type}
                            href={r.href ? route(r.href) : route('reports.show', { type: r.type })}
                            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md"
                        >
                            <h2 className="text-base font-semibold text-gray-900">{r.label}</h2>
                            <p className="mt-1 text-sm text-gray-600">{r.description}</p>
                            <p className="mt-3 text-sm font-semibold text-brand">Open report →</p>
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
