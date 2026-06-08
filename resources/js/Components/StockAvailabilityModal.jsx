import Modal from '@/Components/Modal';
import { formatStockQty } from '@/hooks/useStockAvailability';

export default function StockAvailabilityModal({
    show,
    onClose,
    loading,
    error,
    info,
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="border-b border-gray-100 bg-gradient-to-r from-brand-muted/50 to-white px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock availability</h3>
                <p className="mt-1 text-sm text-gray-600">
                    {info?.product_name
                        ? info.product_name
                        : 'Product stock in the selected warehouse'}
                    {info?.warehouse_name ? ` · ${info.warehouse_name}` : ''}
                </p>
            </div>
            <div className="px-6 py-5">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading stock…</p>
                ) : info?.needs_warehouse ? (
                    <p className="text-sm text-amber-700">
                        Select a warehouse above to see on-hand stock when adding products.
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : (info?.rows ?? []).length === 0 ? (
                    <p className="text-sm text-gray-600">
                        No stock record for this product in the selected warehouse. Receive or
                        transfer stock first.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                        Variant / SKU
                                    </th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                        On hand
                                    </th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                        Reserved
                                    </th>
                                    <th className="px-3 py-2 text-end font-semibold text-gray-700">
                                        Available
                                    </th>
                                    <th className="px-3 py-2 text-start font-semibold text-gray-700">
                                        Length stock
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {(info?.rows ?? []).map((row, idx) => {
                                    const isLength = row.billing_mode === 'length_ft';
                                    const isArea = row.billing_mode === 'area_sqft';
                                    const dimUnit = isLength ? ' ft' : isArea ? ' sq ft' : '';
                                    const onHand = isLength || isArea
                                        ? formatStockQty(row.length_pairs_sum_ft)
                                        : formatStockQty(row.quantity_on_hand);
                                    const available = Number(row.available_quantity ?? 0);
                                    const low = available <= 0;
                                    return (
                                        <tr key={row.variant_id ?? `row-${idx}`}>
                                            <td className="px-3 py-2 text-gray-800">
                                                {row.variant_label || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-end tabular-nums text-gray-700">
                                                {onHand}
                                                {dimUnit}
                                            </td>
                                            <td className="px-3 py-2 text-end tabular-nums text-gray-700">
                                                {formatStockQty(row.reserved_quantity)}
                                            </td>
                                            <td
                                                className={`px-3 py-2 text-end tabular-nums font-semibold ${
                                                    low ? 'text-red-600' : 'text-emerald-700'
                                                }`}
                                            >
                                                {formatStockQty(row.available_quantity)}
                                                {dimUnit}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                {row.length_pairs_summary || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-transparent bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        OK
                    </button>
                </div>
            </div>
        </Modal>
    );
}
