import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CustomerFilterCombobox from '@/Components/CustomerFilterCombobox';
import ProductFilterCombobox from '@/Components/ProductFilterCombobox';
import SupplierFilterCombobox from '@/Components/SupplierFilterCombobox';

const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-600';
const iconStroke = 1.75;

function IconEye({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
        </svg>
    );
}

function IconTrash({ className }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={iconStroke}
            stroke="currentColor"
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}

function Pagination({ links }) {
    if (!links?.length) return null;
    return (
        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Pagination">
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

function buildQuery(obj) {
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v == null || v === '') return;
        out[k] = v;
    });
    return out;
}

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

const SELECTABLE_ROW_REPORTS = new Set([
    'sales',
    'profit-margin',
    'quotations',
    'quotation-lines',
    'inventory-movements',
    'purchase-order-notifications',
    'purchase-invoices',
    'stock-valuation',
]);

function reportRowNumericId(row) {
    const n = Number(row?.id ?? row?.line_id ?? 0);
    return n > 0 ? n : 0;
}

function buildRowExportUrl(reportType, format, filters, selectedIds) {
    const qs = new URLSearchParams();
    Object.entries(buildQuery({ ...filters, format })).forEach(([k, v]) => qs.set(k, String(v)));
    selectedIds.forEach((id) => qs.append('ids[]', String(id)));
    return `${route('reports.export', { type: reportType })}?${qs.toString()}`;
}

export default function Show({
    reportType,
    title,
    columns,
    rows,
    filters: filtersProp,
    filterOptions = {},
}) {
    const { flash, auth } = usePage().props;
    const filters = filtersProp ?? {};
    const isSalesReport = reportType === 'sales';
    const isQuotationsReport = reportType === 'quotations';
    const isInventoryMovementsReport = reportType === 'inventory-movements';
    const isQuotationLinesReport = reportType === 'quotation-lines';
    const isPoNotificationsReport = reportType === 'purchase-order-notifications';
    const isPurchaseInvoicesReport = reportType === 'purchase-invoices';
    const hasRowSelection = SELECTABLE_ROW_REPORTS.has(reportType);
    const hasRowView = isSalesReport || isQuotationsReport;
    const hasRowDelete =
        isSalesReport ||
        isQuotationsReport ||
        isQuotationLinesReport ||
        isInventoryMovementsReport ||
        isPoNotificationsReport ||
        isPurchaseInvoicesReport;
    const perms = asStringList(auth?.user?.permissions);
    const canDeleteSale = !perms.length || perms.includes('sales.delete');
    const canDeleteMovement = !perms.length || perms.includes('inventory.movement');
    const canDeletePoNotification = !perms.length || perms.includes('reports.view');
    const canDeletePurchaseInvoice = !perms.length || perms.includes('purchases.delete');

    const [local, setLocal] = useState(() => ({ ...filters }));
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    useEffect(() => {
        if (hasRowSelection) {
            setSelectedIds(new Set());
        }
    }, [hasRowSelection, rows?.current_page]);

    const apply = (e) => {
        e?.preventDefault?.();
        router.get(route('reports.show', { type: reportType }), buildQuery(local), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const exportHref = (format) => {
        const q = new URLSearchParams(buildQuery({ ...local, format }));
        return `${route('reports.export', { type: reportType })}?${q.toString()}`;
    };

    const openRowExport = (format) => {
        const ids = Array.from(selectedIds);
        window.location.href = buildRowExportUrl(reportType, format, local, ids);
    };

    const tableData = rows?.data ?? [];

    const pageRowIds = useMemo(
        () =>
            hasRowSelection
                ? tableData.map((row) => reportRowNumericId(row)).filter((id) => id > 0)
                : [],
        [hasRowSelection, tableData],
    );

    const allPageSelected =
        hasRowSelection && pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.has(id));

    const toggleAllPageRows = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageRowIds.forEach((id) => next.delete(id));
            } else {
                pageRowIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const toggleRow = (id) => {
        const n = Number(id);
        if (!n) return;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(n)) {
                next.delete(n);
            } else {
                next.add(n);
            }
            return next;
        });
    };

    const deleteSaleRow = (row) => {
        const saleNumber = row.sale_number ?? row.id;
        if (
            !window.confirm(
                `Delete invoice ${saleNumber}? If it was completed, stock will be restored to the warehouse.`,
            )
        ) {
            return;
        }
        router.delete(route('sales.destroy', row.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(Number(row.id));
                    return next;
                });
            },
        });
    };

    const deleteQuotationRow = (row) => {
        if (String(row.status ?? '') === 'converted') {
            return;
        }
        const quotationNo = row.quotation_no ?? row.id;
        if (!window.confirm(`Delete quotation ${quotationNo}?`)) {
            return;
        }
        router.delete(route('quotations.destroy', row.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(Number(row.id));
                    return next;
                });
            },
        });
    };

    const deleteInventoryMovementRow = (row) => {
        const rowId = reportRowNumericId(row);
        const ref = row.reference || rowId;
        if (!window.confirm(`Delete inventory movement #${rowId}${ref ? ` (${ref})` : ''}?`)) {
            return;
        }
        router.delete(route('inventory-movements.destroy', rowId), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(rowId);
                    return next;
                });
            },
        });
    };

    const deletePurchaseInvoiceRow = (row) => {
        const rowId = reportRowNumericId(row);
        const invoiceNo = row.invoice_number ?? rowId;
        if (String(row.status ?? '') === 'received') {
            window.alert(
                `Purchase invoice ${invoiceNo} cannot be deleted because it is already received (stock was updated).`,
            );
            return;
        }
        if (!window.confirm(`Delete purchase invoice ${invoiceNo}? This cannot be undone.`)) {
            return;
        }
        router.delete(route('purchase-invoices.destroy', rowId), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(rowId);
                    return next;
                });
            },
        });
    };

    const deletePoNotificationRow = (row) => {
        const rowId = reportRowNumericId(row);
        const orderNo = row.order_number ?? rowId;
        if (!window.confirm(`Delete notification log #${rowId} for order ${orderNo}?`)) {
            return;
        }
        router.delete(route('purchase-order-notification-logs.destroy', rowId), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(rowId);
                    return next;
                });
            },
        });
    };

    const deleteQuotationLineRow = (row) => {
        if (String(row.quotation_status ?? '') === 'converted') {
            return;
        }
        const lineId = reportRowNumericId(row);
        const quotationNo = row.quotation_no ?? row.quotation_id;
        const product = row.product ?? 'line';
        if (
            !window.confirm(
                `Delete line #${lineId} (${product}) from quotation ${quotationNo}? Quotation totals will be updated.`,
            )
        ) {
            return;
        }
        router.delete(route('quotation-items.destroy', lineId), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(lineId);
                    return next;
                });
            },
        });
    };

    const filterBlocks = useMemo(() => {
        const opts = filterOptions;
        const commonDate = (
            <>
                <div>
                    <label className={labelClass}>From</label>
                    <input
                        type="date"
                        value={local.date_from ?? ''}
                        onChange={(e) => setLocal((s) => ({ ...s, date_from: e.target.value }))}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>To</label>
                    <input
                        type="date"
                        value={local.date_to ?? ''}
                        onChange={(e) => setLocal((s) => ({ ...s, date_to: e.target.value }))}
                        className={inputClass}
                    />
                </div>
            </>
        );

        switch (reportType) {
            case 'expenses':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Category</label>
                            <select
                                value={local.category_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, category_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.categories ?? []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                                placeholder="Reference / notes"
                            />
                        </div>
                    </>
                );
            case 'purchase-invoices':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_purchase_invoices_supplier_search">
                                Supplier
                            </label>
                            <SupplierFilterCombobox
                                id="report_purchase_invoices_supplier_search"
                                suppliers={opts.suppliers ?? []}
                                value={local.supplier_id ?? ''}
                                onChange={(supplierId) =>
                                    setLocal((s) => ({ ...s, supplier_id: supplierId }))
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="received">Received</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Invoice #</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'inventory-movements':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Direction</label>
                            <select
                                value={local.direction ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, direction: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="in">In</option>
                                <option value="out">Out</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Source type</label>
                            <input
                                value={local.source_type ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, source_type: e.target.value }))}
                                className={inputClass}
                                placeholder="e.g. sale"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_inventory_movements_product_search">
                                Product
                            </label>
                            <ProductFilterCombobox
                                id="report_inventory_movements_product_search"
                                products={opts.products ?? []}
                                value={local.product_id ?? ''}
                                onChange={(productId) =>
                                    setLocal((s) => ({ ...s, product_id: productId }))
                                }
                                placeholder="Search product…"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                                placeholder="Reference / source"
                            />
                        </div>
                    </>
                );
            case 'stock-transfers':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>From branch</label>
                            <select
                                value={local.from_branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, from_branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>To branch</label>
                            <select
                                value={local.to_branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, to_branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="in_transit">In transit</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Reference</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'stocks':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Product</label>
                            <select
                                value={local.product_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, product_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.products ?? []).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                                placeholder="Product / SKU"
                            />
                        </div>
                    </>
                );
            case 'stock-adjustments':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Type</label>
                            <select
                                value={local.type ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, type: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="increase">Increase</option>
                                <option value="decrease">Decrease</option>
                                <option value="damage">Damage</option>
                                <option value="wastage">Wastage</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Reference</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'sale-returns':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Return #</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'sales':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_sales_customer_search">
                                Customer
                            </label>
                            <CustomerFilterCombobox
                                id="report_sales_customer_search"
                                customers={opts.customers ?? []}
                                value={local.customer_id ?? ''}
                                onChange={(customerId) =>
                                    setLocal((s) => ({ ...s, customer_id: customerId }))
                                }
                                showCodeInLabel={false}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="returned">Returned</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Payment</label>
                            <select
                                value={local.payment_status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, payment_status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Sale #</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'purchase-orders':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_purchase_orders_supplier_search">
                                Supplier
                            </label>
                            <SupplierFilterCombobox
                                id="report_purchase_orders_supplier_search"
                                suppliers={opts.suppliers ?? []}
                                value={local.supplier_id ?? ''}
                                onChange={(supplierId) =>
                                    setLocal((s) => ({ ...s, supplier_id: supplierId }))
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="sent">Sent</option>
                                <option value="partial">Partial</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Order #</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'quotations':
            case 'quotation-lines':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                className={labelClass}
                                htmlFor={
                                    reportType === 'quotation-lines'
                                        ? 'report_quotation_lines_customer_search'
                                        : 'report_quotations_customer_search'
                                }
                            >
                                Customer
                            </label>
                            <CustomerFilterCombobox
                                id={
                                    reportType === 'quotation-lines'
                                        ? 'report_quotation_lines_customer_search'
                                        : 'report_quotations_customer_search'
                                }
                                customers={opts.customers ?? []}
                                value={local.customer_id ?? ''}
                                onChange={(customerId) =>
                                    setLocal((s) => ({ ...s, customer_id: customerId }))
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="expired">Expired</option>
                                <option value="converted">Converted</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                placeholder={
                                    reportType === 'quotation-lines'
                                        ? 'Quotation # or product name…'
                                        : 'Quotation #…'
                                }
                                className={inputClass}
                            />
                        </div>
                    </>
                );
            case 'purchase-order-notifications':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_po_notifications_supplier_search">
                                Supplier
                            </label>
                            <SupplierFilterCombobox
                                id="report_po_notifications_supplier_search"
                                suppliers={opts.suppliers ?? []}
                                value={local.supplier_id ?? ''}
                                onChange={(supplierId) =>
                                    setLocal((s) => ({ ...s, supplier_id: supplierId }))
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email status</label>
                            <select
                                value={local.email_status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, email_status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                                <option value="skipped">Skipped</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>WhatsApp status</label>
                            <select
                                value={local.whatsapp_status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, whatsapp_status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                                <option value="skipped">Skipped</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Order #</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                                placeholder="Contains…"
                            />
                        </div>
                    </>
                );
            case 'supplier-aging':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_supplier_aging_supplier_search">
                                Supplier
                            </label>
                            <SupplierFilterCombobox
                                id="report_supplier_aging_supplier_search"
                                suppliers={opts.suppliers ?? []}
                                value={local.supplier_id ?? ''}
                                onChange={(supplierId) =>
                                    setLocal((s) => ({ ...s, supplier_id: supplierId }))
                                }
                            />
                        </div>
                        <div className="sm:col-span-2 text-xs text-gray-500">
                            Rows are purchase invoices with due &gt; 0 (excludes cancelled / drafts). Aging uses due date if
                            set, otherwise invoice date.
                        </div>
                    </>
                );
            case 'customer-aging':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Customer</label>
                            <select
                                value={local.customer_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, customer_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.customers ?? []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2 text-xs text-gray-500">
                            Completed sales with due &gt; 0. Aging from sale date.
                        </div>
                    </>
                );
            case 'customer-due-register':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Customer</label>
                            <select
                                value={local.customer_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, customer_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.customers ?? []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                value={local.status ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.status_options ?? []).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Source</label>
                            <select
                                value={local.source_type ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, source_type: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.source_type_options ?? []).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search</label>
                            <input
                                type="text"
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                placeholder="Reference, notes, product…"
                                className={inputClass}
                            />
                        </div>
                        <div className="sm:col-span-2 text-xs text-gray-500">
                            Rows from Customer balances (due items). Filter by transaction date.
                        </div>
                    </>
                );
            case 'product-sales-summary':
                return (
                    <>
                        {commonDate}
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Empty dates default to last 30 days through today (server-side).
                            {opts.effective_date_from && opts.effective_date_to ? (
                                <>
                                    {' '}
                                    Current range: {opts.effective_date_from} → {opts.effective_date_to}
                                </>
                            ) : null}
                        </p>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Group by</label>
                            <select
                                value={local.group_by ?? 'product'}
                                onChange={(e) => setLocal((s) => ({ ...s, group_by: e.target.value }))}
                                className={inputClass}
                            >
                                {(opts.group_by_options ?? [
                                    { value: 'product', label: 'By product' },
                                    { value: 'category', label: 'By category' },
                                ]).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                );
            case 'stock-valuation':
                return (
                    <>
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Product</label>
                            <select
                                value={local.product_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, product_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.products ?? []).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Cost basis</label>
                            <select
                                value={local.cost_basis ?? 'variant_preferred'}
                                onChange={(e) => setLocal((s) => ({ ...s, cost_basis: e.target.value }))}
                                className={inputClass}
                            >
                                {(opts.cost_basis_options ?? [
                                    {
                                        value: 'variant_preferred',
                                        label: 'Variant cost, else avg purchase',
                                    },
                                    { value: 'avg_purchase_only', label: 'Avg purchase only' },
                                ]).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Search</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                                placeholder="Product / SKU"
                            />
                        </div>
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Avg purchase = mean unit cost on non-draft purchase invoices (grouped by product /
                            variant).
                        </p>
                    </>
                );
            case 'profit-margin':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="report_profit_margin_customer_search">
                                Customer
                            </label>
                            <CustomerFilterCombobox
                                id="report_profit_margin_customer_search"
                                customers={opts.customers ?? []}
                                value={local.customer_id ?? ''}
                                onChange={(customerId) =>
                                    setLocal((s) => ({ ...s, customer_id: customerId }))
                                }
                                showCodeInLabel={false}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Cost basis</label>
                            <select
                                value={local.cost_basis ?? 'variant_preferred'}
                                onChange={(e) => setLocal((s) => ({ ...s, cost_basis: e.target.value }))}
                                className={inputClass}
                            >
                                {(opts.cost_basis_options ?? []).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Sale #</label>
                            <input
                                value={local.q ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Completed sales only. COGS follows stock valuation rules; rows flagged when unit cost is
                            missing. Wrong margins if purchasing or variant costs are incomplete.
                        </p>
                    </>
                );
            case 'tax-summary':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Monthly buckets from sale date (completed sales) and purchase invoice date (non-draft,
                            non-cancelled). Net tax = sales tax minus purchase tax recorded on headers.
                        </p>
                    </>
                );
            case 'discount-analysis':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Slice</label>
                            <select
                                value={local.slice ?? 'branch'}
                                onChange={(e) => setLocal((s) => ({ ...s, slice: e.target.value }))}
                                className={inputClass}
                            >
                                {(opts.slice_options ?? []).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Completed sales. By-product view sums line discounts only (invoice-level discounts are not
                            allocated per SKU).
                        </p>
                    </>
                );
            case 'returns-analysis':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Warehouse</label>
                            <select
                                value={local.warehouse_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, warehouse_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.warehouses ?? []).map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Slice</label>
                            <select
                                value={local.slice ?? 'branch'}
                                onChange={(e) => setLocal((s) => ({ ...s, slice: e.target.value }))}
                                className={inputClass}
                            >
                                {(opts.slice_options ?? []).map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Completed returns only. Branch is inferred from the return warehouse.
                        </p>
                    </>
                );
            case 'expense-vs-sales':
                return (
                    <>
                        {commonDate}
                        <div>
                            <label className={labelClass}>Branch</label>
                            <select
                                value={local.branch_id ?? ''}
                                onChange={(e) => setLocal((s) => ({ ...s, branch_id: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                {(opts.branches ?? []).map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="sm:col-span-2 text-xs text-gray-500">
                            Compares completed sale invoice totals to expense entries by calendar month and branch.
                            High-level indicator only (not full P&amp;L).
                        </p>
                    </>
                );
            default:
                return null;
        }
    }, [reportType, local, filterOptions]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {hasRowSelection
                                ? 'Select rows to export only those records (CSV/PDF). Leave none selected to export all matching filters.'
                                : 'Filters apply to the table and exports.'}
                        </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        {hasRowSelection && selectedIds.size > 0 ? (
                            <p className="text-xs font-medium text-gray-600">
                                {selectedIds.size} row{selectedIds.size === 1 ? '' : 's'} selected
                            </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                            {hasRowSelection ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => openRowExport('csv')}
                                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                                    >
                                        Download CSV
                                        {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openRowExport('pdf')}
                                        className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                                    >
                                        Download PDF
                                        {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a
                                        href={exportHref('csv')}
                                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
                                    >
                                        Download CSV
                                    </a>
                                    <a
                                        href={exportHref('pdf')}
                                        className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
                                    >
                                        Download PDF
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={title} />

            <div className="mx-auto max-w-[1600px] space-y-6">
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="overflow-visible rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <form onSubmit={apply} className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-4">
                        {filterBlocks}
                        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                            <button
                                type="submit"
                                className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLocal({});
                                    router.get(route('reports.show', { type: reportType }), {}, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                                className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                            <Link
                                href={route('reports.index')}
                                className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                All reports
                            </Link>
                        </div>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {hasRowSelection ? (
                                        <th className="w-10 px-2 py-2 text-start">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                                checked={allPageSelected}
                                                onChange={toggleAllPageRows}
                                                disabled={pageRowIds.length === 0}
                                                aria-label="Select all on this page"
                                            />
                                        </th>
                                    ) : null}
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="px-3 py-2 text-start text-xs font-semibold text-gray-700"
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                    {hasRowDelete ? (
                                        <th className="px-3 py-2 text-end text-xs font-semibold text-gray-700">
                                            {hasRowView ? 'Actions' : 'Delete'}
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tableData.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                columns.length +
                                                (hasRowSelection ? 1 : 0) +
                                                (hasRowDelete ? 1 : 0)
                                            }
                                            className="px-3 py-8 text-center text-gray-500"
                                        >
                                            No rows for these filters.
                                        </td>
                                    </tr>
                                ) : hasRowSelection ? (
                                    tableData.map((row) => {
                                        const rowId = reportRowNumericId(row);
                                        const rowLabel = isQuotationsReport
                                            ? row.quotation_no ?? rowId
                                            : isSalesReport
                                              ? row.sale_number ?? rowId
                                              : isQuotationLinesReport
                                                ? `${row.product ?? 'Line'} #${row.line_id ?? rowId}`
                                                : isPoNotificationsReport
                                                  ? row.order_number ?? rowId
                                                  : isPurchaseInvoicesReport
                                                    ? row.invoice_number ?? rowId
                                                    : row.reference ?? rowId;
                                        const rowSelectLabel = isQuotationsReport
                                            ? `quotation ${rowLabel}`
                                            : isSalesReport
                                              ? `sale ${rowLabel}`
                                              : isQuotationLinesReport
                                                ? `quotation line ${rowLabel}`
                                                : isPoNotificationsReport
                                                  ? `notification ${rowLabel}`
                                                  : isPurchaseInvoicesReport
                                                    ? `invoice ${rowLabel}`
                                                    : `row ${rowLabel}`;
                                        const canDeleteRow = isSalesReport
                                            ? canDeleteSale
                                            : isQuotationsReport
                                              ? String(row.status ?? '') !== 'converted'
                                              : isQuotationLinesReport
                                                ? String(row.quotation_status ?? '') !== 'converted'
                                                : isInventoryMovementsReport
                                                  ? canDeleteMovement
                                                  : isPoNotificationsReport
                                                    ? canDeletePoNotification
                                                    : isPurchaseInvoicesReport
                                                      ? canDeletePurchaseInvoice
                                                      : false;
                                        const deleteActionDisabled =
                                            isPurchaseInvoicesReport &&
                                            String(row.status ?? '') === 'received';
                                        const deleteActionTitle = deleteActionDisabled
                                            ? 'Received invoices cannot be deleted'
                                            : 'Delete';
                                        return (
                                            <tr key={rowId || row.line_id} className="hover:bg-gray-50/80">
                                                <td className="px-2 py-2 align-top">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                                        checked={selectedIds.has(rowId)}
                                                        onChange={() => toggleRow(rowId)}
                                                        aria-label={`Select ${rowSelectLabel}`}
                                                    />
                                                </td>
                                                {columns.map((col) => (
                                                    <td key={col.key} className="px-3 py-2 text-gray-800">
                                                        {row[col.key] ?? '—'}
                                                    </td>
                                                ))}
                                                {hasRowDelete ? (
                                                    <td className="whitespace-nowrap px-3 py-2 text-end">
                                                        <div className="inline-flex items-center justify-end gap-1.5">
                                                            {hasRowView ? (
                                                                <Link
                                                                    href={
                                                                        isQuotationsReport
                                                                            ? route('quotations.show', row.id)
                                                                            : route('sales.show', row.id)
                                                                    }
                                                                    title="Open"
                                                                    aria-label={`Open ${isQuotationsReport ? 'quotation' : 'sale'} ${rowLabel}`}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-500 shadow-sm transition hover:border-brand/35 hover:bg-brand-muted hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                                                                >
                                                                    <IconEye className="h-4 w-4" />
                                                                </Link>
                                                            ) : null}
                                                            {canDeleteRow ? (
                                                                <button
                                                                    type="button"
                                                                    title={deleteActionTitle}
                                                                    aria-label={`Delete ${rowSelectLabel}`}
                                                                    aria-disabled={deleteActionDisabled || undefined}
                                                                    onClick={() => {
                                                                        if (deleteActionDisabled) {
                                                                            if (isPurchaseInvoicesReport) {
                                                                                deletePurchaseInvoiceRow(row);
                                                                            }
                                                                            return;
                                                                        }
                                                                        if (isQuotationsReport) {
                                                                            deleteQuotationRow(row);
                                                                        } else if (isSalesReport) {
                                                                            deleteSaleRow(row);
                                                                        } else if (isInventoryMovementsReport) {
                                                                            deleteInventoryMovementRow(row);
                                                                        } else if (isQuotationLinesReport) {
                                                                            deleteQuotationLineRow(row);
                                                                        } else if (isPoNotificationsReport) {
                                                                            deletePoNotificationRow(row);
                                                                        } else if (isPurchaseInvoicesReport) {
                                                                            deletePurchaseInvoiceRow(row);
                                                                        }
                                                                    }}
                                                                    className={
                                                                        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-200/70 ' +
                                                                        (deleteActionDisabled
                                                                            ? 'cursor-not-allowed opacity-40 hover:bg-white hover:text-red-500'
                                                                            : 'hover:border-red-200 hover:bg-red-50 hover:text-red-600')
                                                                    }
                                                                >
                                                                    <IconTrash className="h-4 w-4" />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                ) : null}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    tableData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/80">
                                            {columns.map((col) => (
                                                <td key={col.key} className="px-3 py-2 text-gray-800">
                                                    {row[col.key] ?? '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Pagination links={rows?.links} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
