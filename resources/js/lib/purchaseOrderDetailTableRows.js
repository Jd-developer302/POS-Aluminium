import { formatQuantity } from '@/lib/formatQuantity';
import {
    buildSaleDetailRows,
    formatSaleMoney,
    isLengthBillingItem,
} from '@/lib/saleDetailTableRows';

/** Map PO line to the shape expected by {@link buildSaleDetailRows}. */
export function mapPurchaseOrderItemForDetail(it) {
    return {
        ...it,
        unit_price: it.unit_cost,
        product_varient: it.productVarient,
    };
}

function itemIdFromDetailRowKey(key) {
    if (typeof key !== 'string') {
        return null;
    }
    if (key.startsWith('q-')) {
        return Number(key.slice(2));
    }
    const m = key.match(/^l-(\d+)-/);
    return m ? Number(m[1]) : null;
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
        const unitCost = row.unitPrice.replace(/^Rate\/ft /, 'Cost/ft ');
        return {
            ...row,
            unitCost,
            received: itemId != null ? (receivedById.get(itemId) ?? '0') : '0',
        };
    });
}

export { formatSaleMoney as formatPurchaseOrderMoney, isLengthBillingItem };
