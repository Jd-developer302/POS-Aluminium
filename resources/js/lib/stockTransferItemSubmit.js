import { computeAreaLineAmounts } from '@/lib/glassAreaBilling';
import { computeLengthLineAmounts } from '@/lib/saleLengthBilling';

/**
 * @param {unknown[]} items
 * @returns {Record<string, unknown>[]}
 */
export function transformStockTransferItemsForSubmit(items) {
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
            const totalFt = computeLengthLineAmounts({
                length_pairs: normalizedPairs,
            }).totalFt;

            return {
                product_id: Number(it.product_id),
                product_variant_id: vid,
                billing_mode: 'length_ft',
                length_pairs: normalizedPairs,
                quantity: totalFt,
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
            const totalSqFt = computeAreaLineAmounts({
                length_pairs: normalizedPairs,
            }).totalSqFt;

            return {
                product_id: Number(it.product_id),
                product_variant_id: vid,
                billing_mode: 'area_sqft',
                length_pairs: normalizedPairs,
                quantity: totalSqFt,
            };
        }

        return {
            product_id: Number(it.product_id),
            product_variant_id: vid,
            billing_mode: 'quantity',
            length_pairs: null,
            quantity: Number(it.quantity || 0),
        };
    });
}
