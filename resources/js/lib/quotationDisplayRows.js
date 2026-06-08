import { formatQuantity } from '@/lib/formatQuantity';
import { sqFtForRow } from '@/lib/glassAreaBilling';
import { saleLineDiscountPercentLabel } from '@/lib/saleDetailTableRows';
import { saleLineProductLabel } from '@/lib/saleLineProductLabel';

function variantCell(it) {
    const pv = it.product_varient ?? it.productVarient;
    if (!pv) {
        return '—';
    }
    const sku = String(pv.sku ?? '').trim();
    const vn = String(pv.name ?? '').trim();
    if (sku && vn) {
        return `${sku} — ${vn}`;
    }
    return sku || vn || '—';
}

function billingMode(it) {
    return it?.billing_mode ?? it?.billingMode ?? 'quantity';
}

export function isLengthBillingItem(it) {
    return billingMode(it) === 'length_ft';
}

export function isAreaBillingItem(it) {
    return billingMode(it) === 'area_sqft';
}

function validLengthPairs(pairs) {
    if (!Array.isArray(pairs)) {
        return [];
    }
    return pairs.filter((p) => {
        const L = Number(p?.length ?? 0);
        const Q = Number(p?.qty ?? 0);
        return L > 0 && Q > 0;
    });
}

function validAreaPairs(pairs) {
    if (!Array.isArray(pairs)) {
        return [];
    }
    return pairs.filter((p) => {
        const W = Number(p?.width ?? 0);
        const H = Number(p?.height ?? 0);
        const Q = Number(p?.qty ?? 0);
        return W > 0 && H > 0 && Q > 0;
    });
}

function pushAdjustmentRow(out, it, grossSum, discountPercent) {
    const lineTotal = Number(it.line_total ?? 0);
    const delta = Math.round((lineTotal - grossSum) * 100) / 100;
    if (Math.abs(delta) >= 0.01) {
        out.push({
            key: `adj-${it.id}`,
            rowType: 'adjustment',
            quotationItemId: it.id,
            productTitle: '—',
            productSubtitle: null,
            variantLabel: '',
            lengthQtyLabel: 'Discount / tax (this line)',
            lengthQtyIsFt: false,
            unitPriceLabel: null,
            unitPriceKind: 'none',
            discountPercent: discountPercent !== '0%' ? discountPercent : '—',
            amount: delta,
        });
    }
}

/**
 * Flatten quotation items for table/PDF-style display: one row per length pair
 * for length_ft lines, one row per width×height×qty pair for area_sqft; quantity
 * lines stay one row each.
 *
 * @param {unknown[]} items
 * @returns {Array<Record<string, unknown>>}
 */
export function expandQuotationItemsForDisplay(items) {
    const list = Array.isArray(items) ? items : [];
    /** @type {Array<Record<string, unknown>>} */
    const out = [];

    for (const it of list) {
        const mode = billingMode(it);
        const labelBase = saleLineProductLabel(it, { omitLengthBillingSummary: true });
        const discountPercent = saleLineDiscountPercentLabel(it);

        if (mode === 'length_ft') {
            const pairs = validLengthPairs(it?.length_pairs);
            if (pairs.length > 0) {
                const rate = Number(it.unit_price ?? 0);
                let grossSum = 0;

                pairs.forEach((p, idx) => {
                    const L = Number(p.length ?? 0);
                    const Q = Number(p.qty ?? 0);
                    const gross = L * Q * rate;
                    grossSum += gross;
                    out.push({
                        key: `l-${it.id}-${idx}`,
                        rowType: 'pair',
                        quotationItemId: it.id,
                        productTitle: labelBase.title,
                        productSubtitle: labelBase.subtitle,
                        variantLabel: variantCell(it),
                        lengthQtyLabel: `${formatQuantity(L)} ft × ${formatQuantity(Q)}`,
                        lengthQtyIsFt: true,
                        unitPriceLabel: rate,
                        unitPriceKind: 'rate_ft',
                        discountPercent,
                        amount: gross,
                    });
                });

                pushAdjustmentRow(out, it, grossSum, discountPercent);
                continue;
            }
        }

        if (mode === 'area_sqft') {
            const pairs = validAreaPairs(it?.length_pairs);
            if (pairs.length > 0) {
                const rate = Number(it.unit_price ?? 0);
                let grossSum = 0;

                pairs.forEach((p, idx) => {
                    const W = Number(p.width ?? 0);
                    const H = Number(p.height ?? 0);
                    const Q = Number(p.qty ?? 0);
                    const sqFt = sqFtForRow(p);
                    const gross = sqFt * rate;
                    grossSum += gross;
                    out.push({
                        key: `a-${it.id}-${idx}`,
                        rowType: 'pair',
                        quotationItemId: it.id,
                        productTitle: labelBase.title,
                        productSubtitle: labelBase.subtitle,
                        variantLabel: variantCell(it),
                        lengthQtyLabel: `${formatQuantity(W)} × ${formatQuantity(H)} in × ${formatQuantity(Q)} · ${formatQuantity(sqFt)} sq ft`,
                        lengthQtyIsFt: false,
                        unitPriceLabel: rate,
                        unitPriceKind: 'rate_sqft',
                        discountPercent,
                        amount: gross,
                    });
                });

                pushAdjustmentRow(out, it, grossSum, discountPercent);
                continue;
            }
        }

        const label = saleLineProductLabel(it);
        out.push({
            key: `s-${it.id}`,
            rowType: 'single',
            quotationItemId: it.id,
            productTitle: label.title,
            productSubtitle: label.subtitle,
            variantLabel: variantCell(it),
            lengthQtyLabel:
                mode === 'length_ft'
                    ? `${formatQuantity(it.quantity)} ft`
                    : mode === 'area_sqft'
                      ? `${formatQuantity(it.quantity)} sq ft`
                      : formatQuantity(it.quantity),
            lengthQtyIsFt: mode === 'length_ft',
            unitPriceLabel: Number(it.unit_price ?? 0),
            unitPriceKind:
                mode === 'length_ft' ? 'rate_ft' : mode === 'area_sqft' ? 'rate_sqft' : 'unit',
            discountPercent,
            amount: Number(it.line_total ?? 0),
        });
    }

    return out;
}

export { variantCell };
