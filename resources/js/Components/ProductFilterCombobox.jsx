import React, { useEffect, useMemo, useState } from 'react';
import { formatVariantAttributes, variantFullLabel } from '@/lib/variantLabel';

const comboboxWrapClass = 'relative mt-1 min-w-[14rem] rounded-md border border-gray-300 bg-white sm:min-w-[18rem]';
const comboboxInputClass =
    'block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand/20';

function productMatchesQuery(product, query) {
    if (String(product?.name ?? '').toLowerCase().includes(query)) {
        return true;
    }
    return (product?.variants ?? []).some((v) => {
        const sku = String(v?.sku ?? '').toLowerCase();
        const name = String(v?.name ?? '').toLowerCase();
        const attrs = formatVariantAttributes(v).toLowerCase();
        return sku.includes(query) || name.includes(query) || attrs.includes(query);
    });
}

export default function ProductFilterCombobox({
    id,
    products = [],
    value = '',
    onChange,
    allLabel = 'All products',
    placeholder = 'Search product…',
}) {
    const [productSearchQuery, setProductSearchQuery] = useState('');

    const selectedProductId = String(value ?? '');
    const selectedProductRow = useMemo(
        () => (products ?? []).find((p) => String(p.id) === selectedProductId) ?? null,
        [products, selectedProductId],
    );

    useEffect(() => {
        if (!selectedProductId) {
            setProductSearchQuery('');
        }
    }, [selectedProductId]);

    const filteredProducts = useMemo(() => {
        const q = String(productSearchQuery ?? '').trim().toLowerCase();
        const list = products ?? [];
        if (!q) return list;
        return list.filter((p) => productMatchesQuery(p, q));
    }, [products, productSearchQuery]);

    const clear = () => {
        onChange?.('');
        setProductSearchQuery('');
    };

    const selectProduct = (productId) => {
        onChange?.(String(productId));
        setProductSearchQuery('');
    };

    const inputValue =
        String(productSearchQuery ?? '').trim() !== ''
            ? productSearchQuery
            : selectedProductRow?.name ?? '';

    return (
        <div className={comboboxWrapClass}>
            <div className="flex items-stretch">
                <input
                    id={id}
                    type="text"
                    autoComplete="off"
                    className={comboboxInputClass}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => {
                        const v = e.target.value;
                        setProductSearchQuery(v);
                        if (v.trim() === '') {
                            onChange?.('');
                            return;
                        }
                        if (
                            selectedProductRow &&
                            v.trim() !== String(selectedProductRow.name ?? '').trim()
                        ) {
                            onChange?.('');
                        }
                    }}
                />
                {(selectedProductId || String(productSearchQuery ?? '').trim() !== '') && (
                    <button
                        type="button"
                        title="Clear"
                        onClick={clear}
                        className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                        aria-label="Clear product"
                    >
                        ×
                    </button>
                )}
            </div>

            {String(productSearchQuery ?? '').trim() !== '' && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clear}
                        className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {allLabel}
                    </button>
                    {filteredProducts.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No product found</div>
                    ) : (
                        filteredProducts.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectProduct(p.id)}
                                className={
                                    'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ' +
                                    (String(p.id) === selectedProductId
                                        ? 'bg-brand/5 font-semibold text-brand'
                                        : 'text-gray-700')
                                }
                            >
                                <span className="font-medium">{p.name}</span>
                                {(p.variants ?? []).length > 0 ? (
                                    <span className="mt-1 block space-y-0.5 border-l-2 border-gray-200 pl-2">
                                        {(p.variants ?? []).map((v) => (
                                            <span
                                                key={v.id}
                                                className="block text-xs font-normal leading-snug text-gray-500"
                                            >
                                                {variantFullLabel(v)}
                                            </span>
                                        ))}
                                    </span>
                                ) : null}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
