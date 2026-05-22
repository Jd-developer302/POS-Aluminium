import { formatQuantity } from '@/lib/formatQuantity';
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

function isLengthBillingItem(it) {
    return (it?.billing_mode ?? it?.billingMode ?? 'quantity') === 'length_ft';
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

/**
 * Flatten quotation items for table/PDF-style display: one row per length pair
 * for length_ft lines; quantity lines stay one row each.
 *
 * @param {unknown[]} items
 * @returns {Array<Record<string, unknown>>}
 */
export function expandQuotationItemsForDisplay(items) {
    const list = Array.isArray(items) ? items : [];
    /** @type {Array<Record<string, unknown>>} */
    const out = [];

    for (const it of list) {
        const mode = it?.billing_mode ?? it?.billingMode ?? 'quantity';
        const pairs = validLengthPairs(it?.length_pairs);

        if (mode !== 'length_ft' || pairs.length === 0) {
            const label = saleLineProductLabel(it);
            out.push({
                key: `s-${it.id}`,
                rowType: 'single',
                quotationItemId: it.id,
                productTitle: label.title,
                productSubtitle: label.subtitle,
                variantLabel: variantCell(it),
                lengthQtyLabel: formatQuantity(it.quantity),
                lengthQtyIsFt: mode === 'length_ft',
                unitPriceLabel: Number(it.unit_price ?? 0),
                unitPriceKind: mode === 'length_ft' ? 'rate_ft' : 'unit',
                discountPercent: saleLineDiscountPercentLabel(it),
                amount: Number(it.line_total ?? 0),
            });
            continue;
        }

        const rate = Number(it.unit_price ?? 0);
        const labelBase = saleLineProductLabel(it, { omitLengthBillingSummary: true });
        const discountPercent = saleLineDiscountPercentLabel(it);
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

    return out;
}

export { isLengthBillingItem, variantCell };
