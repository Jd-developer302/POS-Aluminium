/** Square inches in one square foot. */
export const SQ_INCHES_PER_SQ_FT = 144;

/** @returns {{ width: string, height: string, qty: string }[]} */
export function emptyAreaPairs(rowCount = 4) {
    return Array.from({ length: rowCount }, () => ({ width: '', height: '', qty: '' }));
}

/**
 * @param {Record<string, unknown>} row
 * @returns {number}
 */
export function sqFtForRow(row) {
    const w = Number(row?.width ?? 0);
    const h = Number(row?.height ?? 0);
    const q = Number(row?.qty ?? 0);
    return (w * h * q) / SQ_INCHES_PER_SQ_FT;
}

/**
 * @param {Record<string, unknown>} it
 * @returns {{ totalSqFt: number, gross: number, discountAmount: number, net: number, rate: number }}
 */
export function computeAreaLineAmounts(it) {
    const pairs = Array.isArray(it.length_pairs) ? it.length_pairs : [];
    let totalSqFt = 0;
    for (const row of pairs) {
        if (!row || typeof row !== 'object') {
            continue;
        }
        totalSqFt += sqFtForRow(row);
    }
    const rate = Number(it.rate_per_sqft ?? it.unit_price ?? it.unit_cost ?? 0);
    const gross = totalSqFt * rate;
    const pct = Number(it.discount_percent ?? 0);
    const discountAmount = (gross * Math.min(100, Math.max(0, pct))) / 100;
    const net = gross - discountAmount;
    return {
        totalSqFt,
        gross,
        discountAmount,
        net,
        rate,
    };
}
