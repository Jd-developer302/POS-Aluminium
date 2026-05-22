import { forwardRef } from 'react';

/**
 * Barcode field: scanners send digits + Enter; we clear after submit.
 */
const BarcodeScanInput = forwardRef(function BarcodeScanInput(
    { disabled, onSubmitCode, className = '', placeholder = 'Scan barcode (12 digits)…' },
    ref,
) {
    return (
        <input
            ref={ref}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Barcode"
            placeholder={placeholder}
            disabled={disabled}
            className={
                'rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ' +
                className
            }
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onSubmitCode(e.currentTarget.value);
                    e.currentTarget.value = '';
                }
            }}
        />
    );
});

export default BarcodeScanInput;
