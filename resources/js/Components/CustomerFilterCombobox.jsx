import React, { useEffect, useMemo, useState } from 'react';

const comboboxWrapClass = 'relative mt-1 min-w-[14rem] rounded-md border border-gray-300 bg-white sm:min-w-[18rem]';
const comboboxInputClass =
    'block min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand/20';

function customerDisplayLabel(c, showCode, labelVariant = 'dash') {
    if (!c) return '';
    const name = String(c.name ?? '').trim();
    if (!showCode) return name;
    const code = String(c.code ?? '').trim();
    if (!code) return name;
    return labelVariant === 'parens' ? `${name} (${code})` : `${code} — ${name}`;
}

export default function CustomerFilterCombobox({
    id,
    customers = [],
    value = '',
    onChange,
    allLabel = 'All customers',
    showCodeInLabel = true,
    labelVariant = 'dash',
    placeholder = 'Search customer...',
}) {
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerFieldFocused, setCustomerFieldFocused] = useState(false);

    const selectedCustomerId = String(value ?? '');
    const selectedCustomerRow = useMemo(
        () => (customers ?? []).find((c) => String(c.id) === selectedCustomerId) ?? null,
        [customers, selectedCustomerId],
    );

    useEffect(() => {
        if (!selectedCustomerId) {
            setCustomerSearchQuery('');
            setCustomerFieldFocused(false);
        }
    }, [selectedCustomerId]);

    const filteredCustomers = useMemo(() => {
        const q = String(customerSearchQuery ?? '').trim().toLowerCase();
        const list = customers ?? [];
        if (!q) return list;
        return list.filter((c) => {
            const name = String(c?.name ?? '').toLowerCase();
            const code = String(c?.code ?? '').toLowerCase();
            const label = customerDisplayLabel(c, showCodeInLabel, labelVariant).toLowerCase();
            return name.includes(q) || code.includes(q) || label.includes(q);
        });
    }, [customers, customerSearchQuery, showCodeInLabel, labelVariant]);

    const clear = () => {
        onChange?.('');
        setCustomerSearchQuery('');
        setCustomerFieldFocused(false);
    };

    const onInputChange = (next) => {
        setCustomerSearchQuery(next);
        const typed = String(next ?? '').trim();
        if (typed === '') {
            onChange?.('');
            return;
        }
        if (
            selectedCustomerRow &&
            typed !== customerDisplayLabel(selectedCustomerRow, showCodeInLabel, labelVariant).trim()
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
                        String(customerSearchQuery ?? '').trim() !== ''
                            ? customerSearchQuery
                            : customerDisplayLabel(selectedCustomerRow, showCodeInLabel, labelVariant)
                    }
                    onChange={(e) => onInputChange(e.target.value)}
                    onFocus={() => setCustomerFieldFocused(true)}
                />
                {(selectedCustomerId || String(customerSearchQuery ?? '').trim() !== '') && (
                    <button
                        type="button"
                        title="Clear"
                        onClick={clear}
                        className="shrink-0 border-l border-gray-200 px-2.5 text-base leading-none text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                        aria-label="Clear customer"
                    >
                        ×
                    </button>
                )}
            </div>

            {(customerFieldFocused || String(customerSearchQuery ?? '').trim() !== '') && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clear}
                        className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {allLabel}
                    </button>
                    {filteredCustomers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No customer found</div>
                    ) : (
                        filteredCustomers.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange?.(String(c.id));
                                    setCustomerSearchQuery('');
                                    setCustomerFieldFocused(false);
                                }}
                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <span className="font-medium">
                                    {customerDisplayLabel(c, showCodeInLabel, labelVariant)}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
