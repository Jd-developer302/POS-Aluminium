/** @returns {{ length: string, qty: string }[]} */
export function emptyLengthPairs(rowCount = 4) {
    return Array.from({ length: rowCount }, () => ({ length: '', qty: '' }));
}

/**
 * @param {Record<string, unknown>} it
 * @returns {{ totalFt: number, gross: number, discountAmount: number, net: number, rate: number }}
 */
export function computeLengthLineAmounts(it) {
    const pairs = Array.isArray(it.length_pairs) ? it.length_pairs : [];
    let totalFt = 0;
    for (const row of pairs) {
        if (!row || typeof row !== 'object') {
            continue;
        }
        const l = Number(row.length ?? 0);
        const q = Number(row.qty ?? 0);
        totalFt += l * q;
    }
    const rate = Number(it.rate_per_ft ?? it.unit_price ?? it.unit_cost ?? 0);
    const gross = totalFt * rate;
    const pct = Number(it.discount_percent ?? 0);
    const discountAmount = (gross * Math.min(100, Math.max(0, pct))) / 100;
    const net = gross - discountAmount;
    return {
        totalFt,
        gross,
        discountAmount,
        net,
        rate,
    };
}

/**
 * Single line contribution for totals (matches quantity × price or length net).
 * @param {Record<string, unknown>} it
 * @returns {number}
 */
export function lineNetBeforeTax(it) {
    const mode = it.billing_mode ?? 'quantity';
    if (mode === 'length_ft') {
        return computeLengthLineAmounts(it).net;
    }
    return Number(it.quantity || 0) * Number(it.unit_price || 0);
}
