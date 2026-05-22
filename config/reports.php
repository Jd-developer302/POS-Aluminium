<?php

return [

    /*
    |--------------------------------------------------------------------------
    | PDF: inline (browser tab) vs download
    |--------------------------------------------------------------------------
    |
    | When unset: PDF opens inline only when APP_ENV is local.
    | Set REPORT_PDF_INLINE=true or false to override (works with config cache).
    |
    */

    'pdf_inline' => env('REPORT_PDF_INLINE'),

];
