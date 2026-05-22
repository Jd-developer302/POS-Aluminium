<?php

namespace App\Support;

use App\Models\PurchaseOrder;
use App\Models\Setting;
use Barryvdh\DomPDF\PDF;

final class PurchaseOrderPdf
{
    public static function loadPurchaseOrder(PurchaseOrder $purchaseOrder): PurchaseOrder
    {
        return $purchaseOrder->load([
            'branch:id,name',
            'warehouse:id,name',
            'supplier:id,name,code,email,phone',
            'items.product:id,name,type',
            'items.productVarient:id,product_id,sku,name',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function viewData(PurchaseOrder $purchaseOrder): array
    {
        $purchaseOrder = self::loadPurchaseOrder($purchaseOrder);
        $items = $purchaseOrder->items;

        return [
            'purchaseOrder' => $purchaseOrder,
            'rows' => PurchaseOrderDisplayRows::expand($items),
            'qtyColumnHeader' => PurchaseOrderDisplayRows::hasLengthBilling($items)
                ? 'Length × Qty'
                : 'Qty',
            'invoiceLogoPath' => Setting::invoiceLogoPathForPdf(),
        ];
    }

    public static function filename(PurchaseOrder $purchaseOrder): string
    {
        $safe = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) $purchaseOrder->order_number) ?: 'purchase-order';

        return 'purchase-order-'.$safe.'.pdf';
    }

    public static function output(PurchaseOrder $purchaseOrder): string
    {
        /** @var PDF $generator */
        $generator = app()->make('dompdf.wrapper');

        return $generator
            ->loadView('purchase-orders.pdf', self::viewData($purchaseOrder))
            ->setPaper('a4', 'portrait')
            ->output();
    }
}
