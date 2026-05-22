/**
 * Display quantity without useless trailing zeros (e.g. 2.0000 → "2", 1.25 → "1.25").
 */
export function formatQuantity(value) {
    const n = Number(value);
    if (Number.isNaN(n)) {
        return value == null ? '' : String(value);
    }
    return String(parseFloat(n.toFixed(4)));
}
