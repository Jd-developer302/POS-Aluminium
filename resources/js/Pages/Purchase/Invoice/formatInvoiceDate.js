/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function formatPurchaseInvoiceDate(value) {
    if (value == null || value === '') {
        return '—';
    }
    const s = String(value);
    const datePart = s.includes('T') ? s.slice(0, 10) : s.length >= 10 ? s.slice(0, 10) : s;
    const m = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
        return s;
    }
    return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function formatPurchaseReceivedAt(value) {
    if (value == null || value === '') {
        return '—';
    }
    const s = String(value);
    const d = formatPurchaseInvoiceDate(s);
    if (!s.includes('T')) {
        return d;
    }
    const time = s.slice(11, 16);
    return `${d} ${time}`;
}
