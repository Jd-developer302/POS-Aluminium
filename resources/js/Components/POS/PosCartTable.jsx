export default function PosCartTable({ lines, onChangeQty, onRemove }) {
    if (lines.length === 0) {
        return (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Cart is empty. Scan a product to add a line.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Product
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            SKU
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Price
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Qty
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Line
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {' '}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {lines.map((line) => {
                        const { product, variant, quantity } = line;
                        const price = Number(variant.selling_price);
                        const lineTotal = price * quantity;
                        return (
                            <tr key={variant.id}>
                                <td className="px-3 py-2">
                                    <div className="font-medium text-gray-900">{product.name}</div>
                                    {variant.name !== product.name ? (
                                        <div className="text-xs text-gray-500">{variant.name}</div>
                                    ) : null}
                                    <div className="font-mono text-xs text-gray-400">
                                        {variant.barcode}
                                    </div>
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-gray-700">
                                    {variant.sku}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-800">
                                    {price.toFixed(2)}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            type="button"
                                            className="h-8 w-8 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            onClick={() => onChangeQty(variant.id, quantity - 1)}
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <span className="min-w-[2rem] text-center font-semibold tabular-nums">
                                            {quantity}
                                        </span>
                                        <button
                                            type="button"
                                            className="h-8 w-8 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            onClick={() => onChangeQty(variant.id, quantity + 1)}
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900">
                                    {lineTotal.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-red-600 hover:text-red-700"
                                        onClick={() => onRemove(variant.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
