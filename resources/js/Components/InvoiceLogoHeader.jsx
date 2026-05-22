import { usePage } from '@inertiajs/react';

/** Centered logo for printable invoices (Settings → Brand → Invoice logo, else large logo). */
export function resolveInvoiceLogoUrl(branding) {
    if (!branding) {
        return null;
    }
    return branding.invoice_logo_url || branding.logo_large_url || null;
}

const DEFAULT_COMPANY_TITLE = 'EVERGREEN ALUMINIUM';
const DEFAULT_COMPANY_TAGLINE = 'SERVE YOU ACCORDING TO YOUR TASTE';

export default function InvoiceLogoHeader({
    className = '',
    companyTitle = DEFAULT_COMPANY_TITLE,
    companyTagline = DEFAULT_COMPANY_TAGLINE,
} = {}) {
    const branding = usePage().props.branding ?? {};
    const src = resolveInvoiceLogoUrl(branding);

    if (!src && !companyTitle && !companyTagline) {
        return null;
    }

    return (
        <div
            className={`flex items-center gap-4 border-b border-gray-100 px-4 py-4 print:border-gray-200 print:px-1 print:py-1 ${className}`}
        >
            {src ? (
                <img
                    src={src}
                    alt=""
                    className="max-h-[72px] w-auto max-w-[260px] object-contain"
                />
            ) : null}
            <div className="min-w-0 leading-tight">
                {companyTitle ? (
                    <div className="truncate font-serif text-xl font-bold italic tracking-wide text-gray-900">
                        {companyTitle}
                    </div>
                ) : null}
                {companyTagline ? (
                    <div className="truncate font-serif text-xs font-semibold italic tracking-[0.12em] text-gray-700">
                        {companyTagline}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
