import { computeLengthLineAmounts } from '@/lib/saleLengthBilling';

/**
 * Maps purchase order line items from form state to API payload (length_ft vs quantity).
 *
 * @param {unknown[]} items
 * @returns {Record<string, unknown>[]}
 */
export function transformPurchaseOrderItems(items) {
    return (items ?? []).map((it) => {
        const vid =
            it.product_variant_id === '' || it.product_variant_id == null
                ? null
                : Number(it.product_variant_id);

        if ((it.billing_mode ?? 'quantity') !== 'length_ft') {
            return {
                product_id: Number(it.product_id),
                product_variant_id: vid,
                billing_mode: 'quantity',
                length_pairs: null,
                quantity: Number(it.quantity || 0),
                unit_cost: Number(it.unit_cost || 0),
                discount: Number(it.discount ?? 0),
                tax_rate: Number(it.tax_rate ?? 0),
                received_quantity: Number(it.received_quantity ?? 0),
            };
        }

        const normalizedPairs = Array.isArray(it.length_pairs)
            ? it.length_pairs.map((row) => ({
                  length:
                      row?.length === '' || row?.length == null ? 0 : Number(row.length),
                  qty: row?.qty === '' || row?.qty == null ? 0 : Number(row.qty),
              }))
            : [];

        const r = computeLengthLineAmounts({
            ...it,
            unit_price: it.unit_cost,
            length_pairs: normalizedPairs,
            discount_percent: 0,
        });
        const rate = Number(it.rate_per_ft ?? it.unit_cost ?? 0);

        return {
            product_id: Number(it.product_id),
            product_variant_id: vid,
            billing_mode: 'length_ft',
            length_pairs: normalizedPairs,
            quantity: r.totalFt,
            unit_cost: rate,
            discount: Number(it.discount ?? 0),
            tax_rate: Number(it.tax_rate ?? 0),
            received_quantity: Number(it.received_quantity ?? 0),
        };
    });
}
