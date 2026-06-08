import { computeAreaLineAmounts, emptyAreaPairs, sqFtForRow } from '@/lib/glassAreaBilling';
import { computeLengthLineAmounts, emptyLengthPairs } from '@/lib/saleLengthBilling';

export const DEFAULT_BILLING_ROW_COUNT = 4;

/**
 * @param {Record<string, unknown>} draft
 * @returns {Record<string, unknown>}
 */
export function syncBillingTotals(draft) {
    const mode = draft.billing_mode ?? 'quantity';
    if (mode === 'length_ft') {
        const next = { ...draft };
        const r = computeLengthLineAmounts(next);
        next.quantity = r.totalFt > 0 ? String(r.totalFt) : '';
        const rp =
            next.rate_per_ft !== '' && next.rate_per_ft != null
                ? Number(next.rate_per_ft)
                : Number(next.unit_price || 0);
        next.rate_per_ft = rp > 0 ? String(rp) : next.rate_per_ft;
        next.unit_price = String(Number.isFinite(rp) ? rp : 0);
        return next;
    }
    if (mode === 'area_sqft') {
        const next = { ...draft };
        const r = computeAreaLineAmounts(next);
        next.quantity = r.totalSqFt > 0 ? String(r.totalSqFt) : '';
        const rp =
            next.rate_per_sqft !== '' && next.rate_per_sqft != null
                ? Number(next.rate_per_sqft)
                : Number(next.unit_price || 0);
        next.rate_per_sqft = rp > 0 ? String(rp) : next.rate_per_sqft;
        next.unit_price = String(Number.isFinite(rp) ? rp : 0);
        return next;
    }
    return draft;
}

/**
 * @param {Record<string, unknown>} item
 * @param {'quantity' | 'length_ft' | 'area_sqft'} targetMode
 * @returns {Record<string, unknown>}
 */
export function setBillingMode(item, targetMode) {
    if (targetMode === 'quantity') {
        return {
            ...item,
            billing_mode: 'quantity',
            length_pairs: emptyLengthPairs(),
            rate_per_ft: '',
            rate_per_sqft: '',
            discount_percent: '0',
            quantity:
                item.quantity !== '' && Number(item.quantity) > 0
                    ? String(item.quantity)
                    : '1',
            unit_price: item.unit_price,
        };
    }
    if (targetMode === 'length_ft') {
        const rate =
            Number(item.rate_per_ft) > 0
                ? item.rate_per_ft
                : Number(item.unit_price) > 0
                  ? String(item.unit_price)
                  : '';
        return syncBillingTotals({
            ...item,
            billing_mode: 'length_ft',
            length_pairs:
                Array.isArray(item.length_pairs) &&
                item.length_pairs.length > 0 &&
                item.length_pairs[0]?.length !== undefined
                    ? item.length_pairs
                    : emptyLengthPairs(DEFAULT_BILLING_ROW_COUNT),
            rate_per_ft: rate,
            rate_per_sqft: '',
            discount_percent: String(item.discount_percent ?? '0'),
        });
    }
    const rate =
        Number(item.rate_per_sqft) > 0
            ? item.rate_per_sqft
            : Number(item.unit_price) > 0
              ? String(item.unit_price)
              : '';
    return syncBillingTotals({
        ...item,
        billing_mode: 'area_sqft',
        length_pairs:
            Array.isArray(item.length_pairs) &&
            item.length_pairs.length > 0 &&
            item.length_pairs[0]?.width !== undefined
                ? item.length_pairs
                : emptyAreaPairs(DEFAULT_BILLING_ROW_COUNT),
        rate_per_sqft: rate,
        rate_per_ft: '',
        discount_percent: String(item.discount_percent ?? '0'),
    });
}

/**
 * @param {Record<string, unknown>} item
 * @param {number} pairIdx
 * @param {string} field
 * @param {string} raw
 * @returns {Record<string, unknown>}
 */
export function updateBillingPair(item, pairIdx, field, raw) {
    const mode = item.billing_mode ?? 'quantity';
    const empty = mode === 'area_sqft' ? emptyAreaPairs() : emptyLengthPairs();
    const pairs = [...(item.length_pairs || empty)].map((row, j) =>
        j === pairIdx ? { ...row, [field]: raw } : row,
    );
    return syncBillingTotals({ ...item, length_pairs: pairs });
}

/**
 * @param {Record<string, unknown>} item
 * @returns {Record<string, unknown>}
 */
export function addBillingPairRow(item) {
    const mode = item.billing_mode ?? 'quantity';
    const p = Array.isArray(item.length_pairs)
        ? item.length_pairs
        : mode === 'area_sqft'
          ? emptyAreaPairs()
          : emptyLengthPairs();
    const newRow =
        mode === 'area_sqft' ? { width: '', height: '', qty: '' } : { length: '', qty: '' };
    return syncBillingTotals({ ...item, length_pairs: [...p, newRow] });
}

/**
 * @param {Record<string, unknown>} item
 * @param {number} pairIdx
 * @returns {Record<string, unknown>}
 */
export function removeBillingPairRow(item, pairIdx) {
    const mode = item.billing_mode ?? 'quantity';
    const p = Array.isArray(item.length_pairs)
        ? item.length_pairs
        : mode === 'area_sqft'
          ? emptyAreaPairs()
          : emptyLengthPairs();
    if (p.length <= 1) {
        return item;
    }
    return syncBillingTotals({ ...item, length_pairs: p.filter((_, j) => j !== pairIdx) });
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} variantSellingPrice
 * @returns {Record<string, unknown>}
 */
export function applyVariantPrice(item, variantSellingPrice) {
    const mode = item.billing_mode ?? 'quantity';
    if (!Number.isFinite(Number(variantSellingPrice))) {
        return item;
    }
    const sp = variantSellingPrice;
    if (mode === 'length_ft') {
        return syncBillingTotals({
            ...item,
            rate_per_ft: String(sp),
            unit_price: String(sp),
        });
    }
    if (mode === 'area_sqft') {
        return syncBillingTotals({
            ...item,
            rate_per_sqft: String(sp),
            unit_price: String(sp),
        });
    }
    return { ...item, unit_price: sp };
}

export { emptyAreaPairs, emptyLengthPairs, sqFtForRow };
