import { transformPurchaseItemsForSubmit } from '@/lib/billingItemSubmit';

/**
 * Maps purchase invoice line items from form state to API payload.
 *
 * @param {unknown[]} items
 * @returns {Record<string, unknown>[]}
 */
export function transformPurchaseInvoiceItems(items) {
    return (items ?? []).map((it) => {
        const base = transformPurchaseItemsForSubmit([it])[0];
        const bid =
            it.product_batch_id === '' || it.product_batch_id == null
                ? null
                : Number(it.product_batch_id);
        return { ...base, product_batch_id: bid };
    });
}
