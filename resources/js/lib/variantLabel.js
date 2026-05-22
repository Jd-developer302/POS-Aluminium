/** @param {Record<string, unknown> | null | undefined} v */
export function formatVariantAttributes(v) {
    const rows = v?.attribute_labels ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
        return '';
    }
    return rows
        .map((a) => {
            const attr = String(a?.attribute ?? '').trim();
            const val = String(a?.value ?? '').trim();
            if (attr && val) {
                return `${attr}: ${val}`;
            }
            return val || attr;
        })
        .filter(Boolean)
        .join(' · ');
}

/** @param {Record<string, unknown> | null | undefined} v */
export function variantFullLabel(v) {
    const sku = String(v?.sku ?? '').trim();
    const name = String(v?.name ?? '').trim();
    const attrs = formatVariantAttributes(v);
    const parts = [];
    if (sku) {
        parts.push(sku);
    }
    if (name && name !== sku) {
        parts.push(name);
    }
    if (attrs) {
        parts.push(attrs);
    }
    return parts.length > 0 ? parts.join(' — ') : `Variant #${v?.id ?? '?'}`;
}
