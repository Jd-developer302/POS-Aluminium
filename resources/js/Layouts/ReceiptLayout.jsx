import FlashToastListener from '@/Components/FlashToastListener';
import { Head, usePage } from '@inertiajs/react';

/**
 * Minimal shell for printable receipts: no app sidebar, top bar, or footer.
 */
export default function ReceiptLayout({ children }) {
    const faviconHref = usePage().props.branding?.favicon_url;

    return (
        <>
            <FlashToastListener />
            <Head>
                {faviconHref ? <link rel="icon" href={faviconHref} /> : null}
                <style type="text/css">
                    {`
                        @media print {
                            /* Explicit portrait (width × height). Avoids "A4 landscape" / browser quirks. */
                            @page {
                                size: 210mm 297mm;
                                margin: 3mm 3mm;
                            }
                            html,
                            body {
                                width: 100% !important;
                                height: auto !important;
                            }
                            .receipt-print-root {
                                max-width: 100% !important;
                                margin-left: 0 !important;
                                margin-right: 0 !important;
                            }
                        }
                    `}
                </style>
            </Head>
            <div className="receipt-print-root min-h-screen bg-gray-50 print:bg-white">{children}</div>
        </>
    );
}
