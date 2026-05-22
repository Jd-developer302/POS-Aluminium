<?php

namespace App\Mail;

use App\Models\PurchaseOrder;
use App\Models\Setting;
use App\Support\PurchaseOrderDisplayRows;
use App\Support\PurchaseOrderPdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderSentToSupplierMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public PurchaseOrder $purchaseOrder) {}

    public function build(): self
    {
        $this->purchaseOrder->loadMissing([
            'items.product:id,name',
            'items.productVarient:id,product_id,sku,name',
        ]);

        $items = $this->purchaseOrder->items;

        $invoiceLogoSrc = Setting::invoiceLogoAbsoluteUrl();
        $logoPath = Setting::invoiceLogoPathForPdf();
        if ($logoPath !== null && is_readable($logoPath)) {
            $mime = mime_content_type($logoPath) ?: 'image/png';
            $invoiceLogoSrc = 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $pdfAttached = false;
        $pdfBytes = null;
        $pdfFilename = PurchaseOrderPdf::filename($this->purchaseOrder);

        try {
            $pdfBytes = PurchaseOrderPdf::output($this->purchaseOrder);
            $pdfAttached = true;
        } catch (\Throwable $e) {
            report($e);
        }

        $mail = $this
            ->subject('Purchase order '.$this->purchaseOrder->order_number)
            ->view('emails.purchase-order-sent', [
                'purchaseOrder' => $this->purchaseOrder,
                'rows' => PurchaseOrderDisplayRows::expand($items),
                'qtyColumnHeader' => PurchaseOrderDisplayRows::hasLengthBilling($items)
                    ? 'Length × Qty'
                    : 'Qty',
                'invoiceLogoSrc' => $invoiceLogoSrc,
                'pdfAttached' => $pdfAttached,
                'pdfFilename' => $pdfFilename,
            ]);

        if ($pdfAttached && $pdfBytes !== null) {
            $mail->attachData($pdfBytes, $pdfFilename, ['mime' => 'application/pdf']);
        }

        return $mail;
    }
}
