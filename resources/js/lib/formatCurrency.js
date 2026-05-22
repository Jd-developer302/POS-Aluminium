import { usePage } from '@inertiajs/react';

/**
 * @param {number|string|null|undefined} amount
 * @param {string} [symbol]
 */
export function formatCurrency(amount, symbol = 'Rs.') {
    const v = amount == null || amount === '' ? NaN : Number(amount);
    if (Number.isNaN(v)) {
        return '—';
    }
    const num = new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(v);
    const sym = String(symbol || 'Rs.').trim();
    if (sym === '') {
        return num;
    }
    return sym.endsWith('.') || sym.endsWith(' ') ? `${sym}${num}` : `${sym} ${num}`;
}

/**
 * @param {import('@inertiajs/core').PageProps} [pageProps]
 */
export function formatCurrencyFromPage(amount, pageProps) {
    const sym =
        pageProps?.currencySymbol ??
        pageProps?.currency_symbol ??
        'Rs.';

    return formatCurrency(amount, sym);
}

export function useFormatCurrency() {
    const page = usePage();
    return (amount) => formatCurrencyFromPage(amount, page.props);
}
