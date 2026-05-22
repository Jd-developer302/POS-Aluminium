import BarcodeScanInput from '@/Components/POS/BarcodeScanInput';
import PosCartTable from '@/Components/POS/PosCartTable';
import { playScanBeep } from '@/Components/POS/scanFeedback';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function Index() {
    const inputRef = useRef(null);
    const [cart, setCart] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        focusInput();
    }, [focusInput]);

    const handleSubmitCode = async (raw) => {
        const code = String(raw ?? '').replace(/\D/g, '');
        if (code.length !== 12) {
            setError('Enter or scan a 12-digit barcode.');
            playScanBeep(false);
            focusInput();
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const url = route('products.barcode.lookup', { barcode: code });
            const { data } = await axios.get(url, {
                headers: { Accept: 'application/json' },
            });

            playScanBeep(true);
            setCart((prev) => {
                const i = prev.findIndex((l) => l.variant.id === data.variant.id);
                if (i === -1) {
                    return [...prev, { ...data, quantity: 1 }];
                }
                const next = [...prev];
                next[i] = { ...next[i], quantity: next[i].quantity + 1 };
                return next;
            });
        } catch (e) {
            const msg =
                e.response?.data?.message ??
                (e.response?.status === 404
                    ? 'Product not found.'
                    : 'Could not look up product.');
            setError(msg);
            playScanBeep(false);
        } finally {
            setLoading(false);
            focusInput();
        }
    };

    const changeQty = (variantId, nextQty) => {
        if (nextQty < 1) {
            setCart((prev) => prev.filter((l) => l.variant.id !== variantId));
            return;
        }
        setCart((prev) =>
            prev.map((l) =>
                l.variant.id === variantId ? { ...l, quantity: nextQty } : l,
            ),
        );
    };

    const removeLine = (variantId) => {
        setCart((prev) => prev.filter((l) => l.variant.id !== variantId));
    };

    const { cartSubtotal, cartTax, cartTotal } = useMemo(() => {
        let sub = 0;
        let tax = 0;
        for (const line of cart) {
            const price = Number(line.variant.selling_price);
            const qty = line.quantity;
            const lineSub = price * qty;
            sub += lineSub;
            const rate = Number(line.product?.tax_percentage ?? 0);
            tax += lineSub * (rate / 100);
        }
        return {
            cartSubtotal: sub,
            cartTax: tax,
            cartTotal: sub + tax,
        };
    }, [cart]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">POS</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Scan a barcode to add or bump quantity. Input clears after each scan.
                    </p>
                </div>
            }
        >
            <Head title="POS" />

            <div className="mx-auto max-w-5xl space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                    <label className="text-sm font-medium text-gray-700">Barcode</label>
                    <BarcodeScanInput
                        ref={inputRef}
                        disabled={loading}
                        className="mt-2 block w-full max-w-xl font-mono text-lg"
                        onSubmitCode={handleSubmitCode}
                    />
                    {error ? (
                        <p
                            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                            role="alert"
                        >
                            {error}
                        </p>
                    ) : null}
                    {loading ? (
                        <p className="mt-2 text-xs text-gray-500">Looking up…</p>
                    ) : null}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900">Cart</h2>
                        {cart.length > 0 ? (
                            <div className="flex flex-col items-end gap-0.5 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-3">
                                <span>
                                    Subtotal{' '}
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {cartSubtotal.toFixed(2)}
                                    </span>
                                </span>
                                <span>
                                    Tax{' '}
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {cartTax.toFixed(2)}
                                    </span>
                                </span>
                                <span>
                                    Total:{' '}
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {cartTotal.toFixed(2)}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    className="text-xs font-medium text-gray-600 underline hover:text-gray-900"
                                    onClick={() => setCart([])}
                                >
                                    Clear cart
                                </button>
                            </div>
                        ) : null}
                    </div>
                    <PosCartTable
                        lines={cart}
                        onChangeQty={changeQty}
                        onRemove={removeLine}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
