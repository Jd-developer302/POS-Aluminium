import { computeAreaLineAmounts } from '@/lib/glassAreaBilling';
import { computeLengthLineAmounts } from '@/lib/saleLengthBilling';

/**
 * @param {Record<string, unknown>} it
 * @param {{ priceField?: 'unit_price' | 'unit_cost' }} [opts]
 * @returns {Record<string, unknown>}
 */
export function transformSaleQuotationItemForSubmit(it, opts = {}) {
    const priceField = opts.priceField ?? 'unit_price';
    const vid =
        it.product_variant_id === '' || it.product_variant_id == null
            ? null
            : Number(it.product_variant_id);
    const mode = it.billing_mode ?? 'quantity';

    if (mode === 'length_ft') {
        const normalizedPairs = Array.isArray(it.length_pairs)
            ? it.length_pairs.map((row) => ({
                  length:
                      row?.length === '' || row?.length == null ? 0 : Number(row.length),
                  qty: row?.qty === '' || row?.qty == null ? 0 : Number(row.qty),
              }))
            : [];
        const r = computeLengthLineAmounts({
            ...it,
            [priceField]: it.rate_per_ft ?? it[priceField],
            length_pairs: normalizedPairs,
        });
        const rate = Number(it.rate_per_ft ?? it[priceField] ?? 0);
        return {
            product_id: it.product_id,
            product_variant_id: vid,
            billing_mode: 'length_ft',
            length_pairs: normalizedPairs,
            rate_per_ft: rate,
            discount_percent: Number(it.discount_percent ?? 0),
            quantity: r.totalFt,
            unit_price: rate,
        };
    }

    if (mode === 'area_sqft') {
        const normalizedPairs = Array.isArray(it.length_pairs)
            ? it.length_pairs.map((row) => ({
                  width:
                      row?.width === '' || row?.width == null ? 0 : Number(row.width),
                  height:
                      row?.height === '' || row?.height == null ? 0 : Number(row.height),
                  qty: row?.qty === '' || row?.qty == null ? 0 : Number(row.qty),
              }))
            : [];
        const r = computeAreaLineAmounts({
            ...it,
            [priceField]: it.rate_per_sqft ?? it[priceField],
            length_pairs: normalizedPairs,
        });
        const rate = Number(it.rate_per_sqft ?? it[priceField] ?? 0);
        return {
            product_id: it.product_id,
            product_variant_id: vid,
            billing_mode: 'area_sqft',
            length_pairs: normalizedPairs,
            rate_per_sqft: rate,
            discount_percent: Number(it.discount_percent ?? 0),
            quantity: r.totalSqFt,
            unit_price: rate,
        };
    }

    return {
        product_id: it.product_id,
        product_variant_id: vid,
        billing_mode: 'quantity',
        length_pairs: null,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it[priceField] || 0),
    };
}

/**
 * @param {unknown[]} items
 * @returns {Record<string, unknown>[]}
 */
export function transformPurchaseItemsForSubmit(items) {
    return (items ?? []).map((it) => {
        const vid =
            it.product_variant_id === '' || it.product_variant_id == null
                ? null
                : Number(it.product_variant_id);
        const mode = it.billing_mode ?? 'quantity';

        if (mode === 'length_ft') {
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
        }

        if (mode === 'area_sqft') {
            const normalizedPairs = Array.isArray(it.length_pairs)
                ? it.length_pairs.map((row) => ({
                      width:
                          row?.width === '' || row?.width == null ? 0 : Number(row.width),
                      height:
                          row?.height === '' || row?.height == null ? 0 : Number(row.height),
                      qty: row?.qty === '' || row?.qty == null ? 0 : Number(row.qty),
                  }))
                : [];
            const r = computeAreaLineAmounts({
                ...it,
                unit_price: it.unit_cost,
                length_pairs: normalizedPairs,
                discount_percent: 0,
            });
            const rate = Number(it.rate_per_sqft ?? it.unit_cost ?? 0);
            return {
                product_id: Number(it.product_id),
                product_variant_id: vid,
                billing_mode: 'area_sqft',
                length_pairs: normalizedPairs,
                quantity: r.totalSqFt,
                unit_cost: rate,
                discount: Number(it.discount ?? 0),
                tax_rate: Number(it.tax_rate ?? 0),
                received_quantity: Number(it.received_quantity ?? 0),
            };
        }

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
    });
}
