import { formatQuantity } from '@/lib/formatQuantity';
import { saleLineProductLabel } from '@/lib/saleLineProductLabel';

function billingMode(it) {
    return it?.billing_mode ?? it?.billingMode ?? 'quantity';
}

export function isLengthBillingItem(it) {
    return billingMode(it) === 'length_ft';
}

export function isAreaBillingItem(it) {
    return billingMode(it) === 'area_sqft';
}

export function isDimensionBillingItem(it) {
    const mode = billingMode(it);
    return mode === 'length_ft' || mode === 'area_sqft';
}

export function formatSaleMoney(value) {
    const n = Number(value ?? 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** @param {number} pct */
export function formatDiscountPercent(pct) {
    const n = Number(pct);
    if (!Number.isFinite(n) || n <= 0.0001) {
        return '0%';
    }
    const clamped = Math.min(100, n);
    const s = clamped.toFixed(2).replace(/\.?0+$/, '');
    return `${s}%`;
}

/** Line discount % for receipt/detail (amount stored on item; percent derived when needed). */
export function saleLineDiscountPercentLabel(it) {
    if (it?.discount_type === 'percent' && Number(it?.discount_value ?? 0) > 0) {
        return formatDiscountPercent(Number(it.discount_value));
    }
    const discountAmt = Number(it?.discount ?? it?.discount_amount ?? 0);
    if (discountAmt <= 0.0001) {
        return '0%';
    }
    const net = Number(it?.subtotal ?? it?.line_total ?? 0);
    const gross = net + discountAmt;
    if (gross <= 0.0001) {
        return '—';
    }
    return formatDiscountPercent((discountAmt / gross) * 100);
}

/** Line discounts summed from items when sale.discount_amount was not persisted (legacy rows). */
export function resolveSaleDiscountAmount(sale) {
    const fromSale = Number(sale?.discount_amount ?? 0);
    if (fromSale > 0) {
        return fromSale;
    }
    const items = sale?.items ?? [];
    return items.reduce((sum, it) => sum + Number(it?.discount ?? 0), 0);
}

/**
 * Totals for sale detail / receipt: subtotal is stored net of line discounts;
 * gross subtotal is net + discount for a clear printed breakdown.
 */
export function saleSummaryTotals(sale) {
    const discountAmount = resolveSaleDiscountAmount(sale);
    const netSubtotal = Number(sale?.subtotal ?? 0);
    return {
        grossSubtotal: netSubtotal + discountAmount,
        discountAmount,
        netSubtotal,
        taxAmount: Number(sale?.tax_amount ?? 0),
        total: Number(sale?.total ?? 0),
    };
}

/** @param {Record<string, unknown>} it */
export function saleVariantCell(it) {
    const preset = it?.variant_label;
    if (preset != null && String(preset).trim() !== '' && preset !== '—') {
        return String(preset);
    }

    const pv =
        it.product_varient ?? it.product_variant ?? it.productVariant ?? it.productVarient;
    if (!pv || typeof pv !== 'object') {
        return '—';
    }
    const sku = String(pv.sku ?? '').trim();
    const vn = String(pv.name ?? '').trim();
    if (sku && vn) {
        return `${sku} — ${vn}`;
    }
    if (sku || vn) {
        return sku || vn;
    }
    return '—';
}

/**
 * Same compact summary as Stock report (e.g. `10×2 + 12×1`).
 * @param {unknown[]} pairs
 */
export function formatLengthPairsSummary(pairs) {
    if (!Array.isArray(pairs)) return '—';
    const parts = pairs
        .map((r) => {
            const l = Number(r?.length ?? r?.l ?? 0);
            const q = Number(r?.qty ?? r?.q ?? 0);
            if (l <= 0 && q <= 0) return null;
            return `${l}×${q}`;
        })
        .filter(Boolean);
    return parts.length ? parts.join(' + ') : '—';
}

/**
 * Same compact summary as glass area stock (e.g. `12×24×2 + 18×36×1`).
 * @param {unknown[]} pairs
 */
export function formatAreaPairsSummary(pairs) {
    if (!Array.isArray(pairs)) return '—';
    const parts = pairs
        .map((r) => {
            const w = Number(r?.width ?? 0);
            const h = Number(r?.height ?? 0);
            const q = Number(r?.qty ?? 0);
            if (w <= 0 && h <= 0 && q <= 0) return null;
            return `${w}×${h}×${q}`;
        })
        .filter(Boolean);
    return parts.length ? parts.join(' + ') : '—';
}

/**
 * Cuts column title for sale/PO detail tables (glass vs aluminium vs mixed).
 * @param {Record<string, unknown>[]} items
 */
export function saleDetailCutsColumnHeader(items) {
    const dim = (items ?? []).filter(isDimensionBillingItem);
    if (dim.length === 0) {
        return 'Cuts';
    }
    if (dim.every(isAreaBillingItem)) {
        return 'Sizes (W×H×Q)';
    }
    if (dim.every(isLengthBillingItem)) {
        return 'Lengths (L×Q)';
    }
    return 'Cuts / sizes';
}

/**
 * On-hand / billed quantity column title (sq ft for glass, ft for aluminium).
 * @param {Record<string, unknown>[]} items
 */
export function saleDetailOnHandColumnHeader(items) {
    const dim = (items ?? []).filter(isDimensionBillingItem);
    if (dim.length === 0) {
        return 'Qty';
    }
    if (dim.every(isAreaBillingItem)) {
        return 'Actual sq ft (on hand)';
    }
    if (dim.every(isLengthBillingItem)) {
        return 'Actual ft (on hand)';
    }
    return 'On hand (ft / sq ft)';
}

/**
 * Stock transfer / inventory movement cuts column (same rules as sale detail).
 * @param {Record<string, unknown>[]} items
 */
export function transferDetailCutsColumnHeader(items) {
    return saleDetailCutsColumnHeader(items);
}

/**
 * Stock transfer qty column header.
 * @param {Record<string, unknown>[]} items
 */
export function transferDetailQtyColumnHeader(items) {
    const list = items ?? [];
    const dim = list.filter(isDimensionBillingItem);
    if (dim.length === 0) {
        return 'Qty';
    }
    if (dim.every(isAreaBillingItem)) {
        return 'Sq ft';
    }
    if (dim.every(isLengthBillingItem)) {
        return 'Ft';
    }
    return 'Qty (ft / sq ft)';
}

/**
 * How many quantity columns the sale / PO detail table should show (matches Stock when length billing is used).
 * @param {Record<string, unknown>[]} items
 * @returns {'qty' | 'length_actual' | 'length_actual_qty'}
 */
export function saleDetailBillingLayout(items) {
    const list = items ?? [];
    const hasDimension = list.some(isDimensionBillingItem);
    const hasQuantity = list.some((it) => !isDimensionBillingItem(it));
    if (!hasDimension) return 'qty';
    if (!hasQuantity) return 'length_actual';
    return 'length_actual_qty';
}

/**
 * Flat rows for sale detail / receipt table (one row per line item; length billing uses stock-style columns).
 * @param {Record<string, unknown>[]} items
 * @returns {Array<{ key: string; product: string; variant: string; lengthsSummary: string; actualFt: string; qtyUnits: string; unitPrice: string; discountPercent: string; amount: string }>}
 */
export function buildSaleDetailRows(items) {
    const out = [];

    for (const it of items) {
        const { title } = saleLineProductLabel(it, { omitLengthBillingSummary: true });
        const variant = saleVariantCell(it);
        const lineSub = Number(it.subtotal ?? 0);
        const rate = Number(it.unit_price ?? 0);
        const discountPercent = saleLineDiscountPercentLabel(it);

        if (!isDimensionBillingItem(it)) {
            out.push({
                key: `q-${it.id}`,
                product: title,
                variant,
                lengthsSummary: '—',
                actualFt: '—',
                qtyUnits: formatQuantity(it.quantity),
                unitPrice: formatSaleMoney(rate),
                discountPercent,
                amount: formatSaleMoney(lineSub),
            });
            continue;
        }

        const raw = Array.isArray(it.length_pairs) ? it.length_pairs : [];
        const dimTotal = Number(it.quantity ?? 0);
        const isArea = isAreaBillingItem(it);

        let lengthsSummary = isArea ? formatAreaPairsSummary(raw) : formatLengthPairsSummary(raw);
        if (lengthsSummary === '—' && dimTotal > 0) {
            lengthsSummary = isArea
                ? `${formatQuantity(dimTotal)} sq ft`
                : `${formatQuantity(dimTotal)}×1`;
        }

        out.push({
            key: `${isArea ? 'a' : 'l'}-${it.id}-0`,
            product: title,
            variant,
            lengthsSummary,
            actualFt: isArea
                ? `${formatQuantity(dimTotal)} sq ft`
                : formatQuantity(dimTotal),
            qtyUnits: '—',
            unitPrice: isArea
                ? `Rate/sqft ${formatSaleMoney(rate)}`
                : `Rate/ft ${formatSaleMoney(rate)}`,
            discountPercent,
            amount: formatSaleMoney(lineSub),
        });
    }

    return out;
}
