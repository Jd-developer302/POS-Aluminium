import { useCallback, useState } from 'react';

export function formatStockQty(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n - Math.round(n)) < 0.0001) return String(Math.round(n));
    return n.toFixed(2);
}

export function useStockAvailability() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState(null);

    const close = useCallback(() => {
        if (loading) return;
        setOpen(false);
        setError('');
        setInfo(null);
    }, [loading]);

    const showForProduct = useCallback(
        async ({ warehouseId, productId, variantId, productName }) => {
            if (!warehouseId) {
                setInfo({
                    product_name: productName,
                    warehouse_name: null,
                    rows: [],
                    needs_warehouse: true,
                });
                setError('');
                setOpen(true);
                return;
            }

            setOpen(true);
            setLoading(true);
            setError('');
            setInfo(null);

            const params = new URLSearchParams({
                warehouse_id: String(warehouseId),
                product_id: String(productId),
            });
            if (variantId != null && variantId !== '') {
                params.set('product_variant_id', String(variantId));
            }

            try {
                const res = await fetch(
                    `${route('sales.stock-availability')}?${params.toString()}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const msg =
                        typeof json?.message === 'string'
                            ? json.message
                            : 'Unable to load stock for this product.';
                    setError(msg);
                    setInfo({
                        product_name: productName,
                        warehouse_name: null,
                        rows: [],
                    });
                    return;
                }
                setInfo(json);
            } catch {
                setError('Unable to load stock. Check your connection and try again.');
                setInfo({
                    product_name: productName,
                    warehouse_name: null,
                    rows: [],
                });
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return { open, loading, error, info, close, showForProduct };
}
