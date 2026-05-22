<?php

namespace App\Services\Product;

use Milon\Barcode\DNS1D;
use Throwable;

class ProductBarcodeRenderer
{
    /**
     * Code 128 PNG as a data URI (for Inertia / HTML img src).
     */
    public function code128PngDataUri(string $barcode): ?string
    {
        $barcode = trim($barcode);
        if ($barcode === '') {
            return null;
        }

        try {
            $d = new DNS1D;
            $png = $d->getBarcodePNG($barcode, 'C128', 2, 44);
        } catch (Throwable) {
            return null;
        }

        if ($png === false || $png === '') {
            return null;
        }

        return 'data:image/png;base64,'.$png;
    }
}
