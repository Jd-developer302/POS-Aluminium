import { sqFtForRow } from '@/lib/glassAreaBilling';

const inputClass =
    'w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm';

/**
 * Expanded row panel for glass area (width × height × qty) billing lines.
 */
export default function GlassAreaBillingPanel({
    pairs,
    onUpdatePair,
    onAddRow,
    onRemoveRow,
    onRefresh,
    discountPercent,
    onDiscountChange,
}) {
    return (
        <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Glass dimensions (inches)
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(pairs ?? []).map((row, pairIdx) => {
                    const lineSqFt = sqFtForRow(row);
                    return (
                        <div
                            key={pairIdx}
                            className="rounded-lg border border-gray-200 bg-white p-2"
                        >
                            <div className="grid grid-cols-3 gap-1">
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    className={inputClass}
                                    placeholder="Width"
                                    value={row.width ?? ''}
                                    onChange={(e) =>
                                        onUpdatePair(pairIdx, 'width', e.target.value)
                                    }
                                />
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    className={inputClass}
                                    placeholder="Height"
                                    value={row.height ?? ''}
                                    onChange={(e) =>
                                        onUpdatePair(pairIdx, 'height', e.target.value)
                                    }
                                />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        className={inputClass}
                                        placeholder="Qty"
                                        value={row.qty ?? ''}
                                        onChange={(e) =>
                                            onUpdatePair(pairIdx, 'qty', e.target.value)
                                        }
                                    />
                                    {(pairs?.length ?? 0) > 1 ? (
                                        <button
                                            type="button"
                                            title="Remove row"
                                            className="shrink-0 rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => onRemoveRow(pairIdx)}
                                        >
                                            ×
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                            <p className="mt-1 text-center text-xs text-gray-500">
                                = {lineSqFt.toFixed(4)} sq ft
                            </p>
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onAddRow}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    + Add size row
                </button>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Clear rows
                </button>
                {onDiscountChange ? (
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                        Disc. %
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={discountPercent ?? '0'}
                            onChange={(e) => onDiscountChange(e.target.value)}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                    </label>
                ) : null}
            </div>
        </div>
    );
}
