/**
 * @param {Record<string, unknown>} it Sale item row from API (camelCase/snake_case tolerant).
 * @param {{ omitLengthBillingSummary?: boolean }} [opts] When true, skip the inline ft/rate hint (use when showing a length breakdown grid).
 * @returns {{ title: string, subtitle: string|null }}
 */
export function saleLineProductLabel(it, opts = {}) {
    const product = it.product;
    const name =
        typeof product?.name === 'string' ? product.name.trim() || null : null;
    const title =
        name != null && name !== ''
            ? name
            : `#${it.product_id != null ? String(it.product_id) : ''}`;

    const pvRaw =
        it.product_varient ??
        it.product_variant ??
        it.productVarient ??
        it.productVariant;
    const pv = it.product_variant_id && pvRaw != null ? pvRaw : null;

    const parts = [];
    if (pv) {
        const sku = String(pv.sku ?? '').trim();
        const vn = String(pv.name ?? '').trim();
        if (sku && vn) {
            parts.push(`${sku} — ${vn}`);
        } else if (sku || vn) {
            parts.push(sku || vn);
        }
    }

    const billingMode = it.billing_mode ?? it.billingMode;
    if (
        billingMode === 'length_ft' &&
        opts.omitLengthBillingSummary !== true
    ) {
        const ft = Number(it.quantity ?? 0);
        const unitPrice = Number(it.unit_price ?? 0);
        const ftStr = ft.toLocaleString(undefined, { maximumFractionDigits: 4 });
        const upStr = unitPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        });
        // Stored rows: quantity = total ft, unit_price = rate per ft.
        parts.push(`${ftStr} ft · rate/ft ${upStr}`);
    }

    const subtitle = parts.length ? parts.join(' · ') : null;

    return { title, subtitle };
}
