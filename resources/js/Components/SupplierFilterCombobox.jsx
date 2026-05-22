import React, { useEffect, useMemo, useState } from 'react';

const comboboxWrapClass = 'relative mt-1 min-w-[14rem] rounded-md border border-gray-300 bg-white sm:min-w-[18rem]';
const comboboxInputClass =
    'block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand/20';

function supplierDisplayLabel(s, showCode = true) {
    if (!s) return '';
    const name = String(s.name ?? '').trim();
    if (!showCode) return name;
    const code = String(s.code ?? '').trim();
    if (!code) return name;
    return `${code} — ${name}`;
}

export default function SupplierFilterCombobox({
    id,
    suppliers = [],
    value = '',
    onChange,
    allLabel = 'All suppliers',
    showCodeInLabel = true,
    placeholder = 'Search supplier...',
}) {
    const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
    const [supplierFieldFocused, setSupplierFieldFocused] = useState(false);

    const selectedSupplierId = String(value ?? '');
    const selectedSupplierRow = useMemo(
        () => (suppliers ?? []).find((s) => String(s.id) === selectedSupplierId) ?? null,
        [suppliers, selectedSupplierId],
    );

    useEffect(() => {
        if (!selectedSupplierId) {
            setSupplierSearchQuery('');
            setSupplierFieldFocused(false);
        }
    }, [selectedSupplierId]);

    const filteredSuppliers = useMemo(() => {
        const q = String(supplierSearchQuery ?? '').trim().toLowerCase();
        const list = suppliers ?? [];
        if (!q) return list;
        return list.filter((s) => {
            const name = String(s?.name ?? '').toLowerCase();
            const code = String(s?.code ?? '').toLowerCase();
            const business = String(s?.business_name ?? '').toLowerCase();
            const label = supplierDisplayLabel(s, showCodeInLabel).toLowerCase();
            return name.includes(q) || code.includes(q) || business.includes(q) || label.includes(q);
        });
    }, [suppliers, supplierSearchQuery, showCodeInLabel]);

    const clear = () => {
        onChange?.('');
        setSupplierSearchQuery('');
        setSupplierFieldFocused(false);
    };

    const onInputChange = (next) => {
        setSupplierSearchQuery(next);
        const typed = String(next ?? '').trim();
        if (typed === '') {
            onChange?.('');
            return;
        }
        if (
            selectedSupplierRow &&
            typed !== supplierDisplayLabel(selectedSupplierRow, showCodeInLabel).trim()
        ) {
            onChange?.('');
        }
    };

    return (
        <div className={comboboxWrapClass}>
            <div className="flex items-stretch">
                <input
                    id={id}
                    type="text"
                    autoComplete="off"
                    className={comboboxInputClass}
                    placeholder={placeholder}
                    value={
                        String(supplierSearchQuery ?? '').trim() !== ''
                            ? supplierSearchQuery
                            : supplierDisplayLabel(selectedSupplierRow, showCodeInLabel)
                    }
                    onChange={(e) => onInputChange(e.target.value)}
                    onFocus={() => setSupplierFieldFocused(true)}
                />
                {(selectedSupplierId || String(supplierSearchQuery ?? '').trim() !== '') && (
                    <button
                        type="button"
                        title="Clear"
                        onClick={clear}
                        className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                        aria-label="Clear supplier"
                    >
                        ×
                    </button>
                )}
            </div>

            {(supplierFieldFocused || String(supplierSearchQuery ?? '').trim() !== '') && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clear}
                        className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {allLabel}
                    </button>
                    {filteredSuppliers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No supplier found</div>
                    ) : (
                        filteredSuppliers.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange?.(String(s.id));
                                    setSupplierSearchQuery('');
                                    setSupplierFieldFocused(false);
                                }}
                                className={
                                    'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ' +
                                    (String(s.id) === selectedSupplierId
                                        ? 'bg-brand/5 font-semibold text-brand'
                                        : 'text-gray-700')
                                }
                            >
                                <span className="font-medium">
                                    {supplierDisplayLabel(s, showCodeInLabel)}
                                </span>
                                {s.business_name &&
                                String(s.business_name).trim() !== '' &&
                                String(s.business_name).trim() !== String(s.name ?? '').trim() ? (
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                        {s.business_name}
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
