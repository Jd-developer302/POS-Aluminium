import { formatQuantity } from '@/lib/formatQuantity';
import {
    formatAreaPairsSummary,
    formatLengthPairsSummary,
    isAreaBillingItem,
    isDimensionBillingItem,
    isLengthBillingItem,
    saleDetailCutsColumnHeader,
    saleDetailOnHandColumnHeader,
    saleVariantCell,
} from '@/lib/saleDetailTableRows';

export function saleReturnUnitPriceLabel(it) {
    const mode = it?.billing_mode ?? 'quantity';
    const rate = Number(it?.unit_price ?? 0);
    if (mode === 'length_ft') {
        return `Rate/ft ${rate.toFixed(2)}`;
    }
    if (mode === 'area_sqft') {
        return `Rate/sqft ${rate.toFixed(2)}`;
    }
    return rate.toFixed(2);
}

export function saleReturnQtyLabel(value, billingMode) {
    const mode = billingMode ?? 'quantity';
    const n = formatQuantity(value);
    if (mode === 'length_ft') {
        return `${n} ft`;
    }
    if (mode === 'area_sqft') {
        return `${n} sq ft`;
    }
    return n;
}

export function saleReturnCutsSummary(it) {
    if (!isDimensionBillingItem(it)) {
        return '—';
    }
    const raw = Array.isArray(it.length_pairs) ? it.length_pairs : [];
    if (isAreaBillingItem(it)) {
        return formatAreaPairsSummary(raw);
    }
    if (isLengthBillingItem(it)) {
        return formatLengthPairsSummary(raw);
    }
    return '—';
}

export function saleReturnReturnQtyColumnHeader(items) {
    const list = items ?? [];
    const dim = list.filter(isDimensionBillingItem);
    if (dim.length === 0) {
        return 'Return qty';
    }
    if (dim.every(isAreaBillingItem)) {
        return 'Return sq ft';
    }
    if (dim.every(isLengthBillingItem)) {
        return 'Return ft';
    }
    return 'Return qty (ft / sq ft)';
}

export function saleReturnSoldColumnHeader(items) {
    const list = items ?? [];
    const dim = list.filter(isDimensionBillingItem);
    if (dim.length === 0) {
        return 'Sold';
    }
    if (dim.length === list.length && dim.every(isAreaBillingItem)) {
        return 'Sold (sq ft)';
    }
    if (dim.length === list.length && dim.every(isLengthBillingItem)) {
        return 'Sold (ft)';
    }
    return 'Sold';
}

export function saleReturnRemainingColumnHeader(items) {
    const list = items ?? [];
    const dim = list.filter(isDimensionBillingItem);
    if (dim.length === 0) {
        return 'Remaining';
    }
    if (dim.length === list.length && dim.every(isAreaBillingItem)) {
        return 'Remaining (sq ft)';
    }
    if (dim.length === list.length && dim.every(isLengthBillingItem)) {
        return 'Remaining (ft)';
    }
    return 'Remaining';
}

export function saleReturnTableHeaders(items) {
    const list = items ?? [];
    const hasDimension = list.some(isDimensionBillingItem);

    return {
        showVariant: list.some((it) => it.variant_label || it.product_variant_id),
        showCuts: hasDimension,
        cutsHeader: saleDetailCutsColumnHeader(list),
        soldHeader: saleReturnSoldColumnHeader(list),
        remainingHeader: saleReturnRemainingColumnHeader(list),
        returnHeader: saleReturnReturnQtyColumnHeader(list),
    };
}

export function saleReturnVariantLabel(it) {
    if (it?.variant_label) {
        return it.variant_label;
    }
    return saleVariantCell(it);
}
