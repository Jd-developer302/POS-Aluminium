import { formatQuantity } from '@/lib/formatQuantity';
import {
    buildSaleDetailRows,
    formatSaleMoney,
    isLengthBillingItem,
} from '@/lib/saleDetailTableRows';

function resolveLineProductVarient(it) {
    return (
        it?.product_varient ??
        it?.productVarient ??
        it?.product_variant ??
        it?.productVariant ??
        null
    );
}

/** Map PO line to the shape expected by {@link buildSaleDetailRows}. */
export function mapPurchaseOrderItemForDetail(it) {
    const pv = resolveLineProductVarient(it);

    return {
        ...it,
        unit_price: it.unit_cost,
        product_varient: pv,
        productVarient: pv,
        variant_label: it?.variant_label ?? null,
    };
}

function itemIdFromDetailRowKey(key) {
    if (typeof key !== 'string') {
        return null;
    }
    if (key.startsWith('q-')) {
        return Number(key.slice(2));
    }
    const m = key.match(/^[la]-(\d+)-/);
    return m ? Number(m[1]) : null;
}

function mapUnitCostLabel(unitPrice) {
    return unitPrice
        .replace(/^Rate\/sqft /, 'Cost/sqft ')
        .replace(/^Rate\/ft /, 'Cost/ft ');
}

/**
 * Flat rows for purchase order detail (length × qty per row when billing is length_ft).
 * @param {Record<string, unknown>[]} items
 */
export function buildPurchaseOrderDetailRows(items) {
    const list = items ?? [];
    const receivedById = new Map(
        list.map((it) => [it.id, formatQuantity(it.received_quantity)]),
    );
    const saleRows = buildSaleDetailRows(list.map(mapPurchaseOrderItemForDetail));

    return saleRows.map((row) => {
        const itemId = itemIdFromDetailRowKey(row.key);
        return {
            ...row,
            unitCost: mapUnitCostLabel(row.unitPrice),
            received: itemId != null ? (receivedById.get(itemId) ?? '0') : '0',
        };
    });
}

/**
 * Flat rows for purchase invoice detail (simple / aluminium / glass billing).
 * @param {Record<string, unknown>[]} items
 */
export function buildPurchaseInvoiceDetailRows(items) {
    const saleRows = buildSaleDetailRows((items ?? []).map(mapPurchaseOrderItemForDetail));

    return saleRows.map((row) => ({
        ...row,
        unitCost: mapUnitCostLabel(row.unitPrice),
    }));
}

export { formatSaleMoney as formatPurchaseOrderMoney, isLengthBillingItem };
