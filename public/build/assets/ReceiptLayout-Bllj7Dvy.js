import{a as e,j as t,H as a}from"./app-Dtw6ha4t.js";function s({children:r}){const i=e().props.branding?.favicon_url;return t.jsxs(t.Fragment,{children:[t.jsxs(a,{children:[i?t.jsx("link",{rel:"icon",href:i}):null,t.jsx("style",{type:"text/css",children:`
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
                    `})]}),t.jsx("div",{className:"receipt-print-root min-h-screen bg-gray-50 print:bg-white",children:r})]})}export{s as R};
