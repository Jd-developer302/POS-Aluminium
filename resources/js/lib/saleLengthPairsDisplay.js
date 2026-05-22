/** Slots padded for same grid as Sale Create / Show. */
export const LENGTH_PAIR_SLOTS = 4;

/**
 * Pad length × qty pairs for read-only display (receipt / sale detail).
 * @param {Record<string, unknown>} it
 * @returns {{ length: string, qty: string }[]}
 */
export function pairsForLengthDisplay(it) {
    const raw = Array.isArray(it.length_pairs) ? it.length_pairs : [];
    const rows = [];
    for (let i = 0; i < LENGTH_PAIR_SLOTS; i++) {
        const row = raw[i];
        const len = row?.length ?? row?.l;
        const qty = row?.qty ?? row?.q;
        rows.push({
            length: len != null && len !== '' ? String(len) : '',
            qty: qty != null && qty !== '' ? String(qty) : '',
        });
    }
    return rows;
}
