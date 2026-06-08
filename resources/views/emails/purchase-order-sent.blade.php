<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $purchaseOrder->order_number }}</title>
</head>
<body style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 15px; line-height: 1.5; color: #111827; margin: 0; padding: 16px;">
@include('partials.invoice-logo-email', ['invoiceLogoSrc' => $invoiceLogoSrc ?? null])
<p style="margin: 0 0 12px 0;">Hello,</p>
<p style="margin: 0 0 12px 0;">
    We have issued purchase order <strong>{{ $purchaseOrder->order_number }}</strong> from
    <strong>{{ config('app.name') }}</strong>.
    @if (!empty($pdfAttached))
        The full purchase order is attached as <strong>{{ $pdfFilename ?? 'PDF' }}</strong> — you can download and save it.
    @endif
</p>
<table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse; border-color: #e5e7eb;">
    <thead>
    <tr style="background: #f9fafb;">
        <th align="left">Product</th>
        <th align="left">Variant</th>
        <th align="right">{{ $qtyColumnHeader ?? 'Qty' }}</th>
        <th align="right">Unit cost</th>
        <th align="right">Disc. %</th>
        <th align="right">Line total</th>
    </tr>
    </thead>
    <tbody>
    @foreach ($rows as $row)
        <tr @if(($row['row_type'] ?? '') === 'adjustment') style="color: #6b7280;" @endif>
            <td>{{ $row['product'] }}</td>
            <td>{{ $row['variant'] }}</td>
            <td align="right">{{ $row['length_qty'] }}</td>
            <td align="right">
                @if(in_array($row['unit_cost_note'] ?? '', ['Cost/ft', 'Cost/sqft'], true) && ($row['unit_cost'] ?? '') !== '')
                    <span style="font-size: 11px; color: #6b7280;">{{ $row['unit_cost_note'] }}</span><br>
                    {{ $row['unit_cost'] }}
                @else
                    {{ $row['unit_cost'] }}
                @endif
            </td>
            <td align="right">{{ $row['discount_percent'] ?? '0%' }}</td>
            <td align="right">{{ $row['amount'] }}</td>
        </tr>
    @endforeach
    </tbody>
</table>
<p><strong>Expected date:</strong> {{ $purchaseOrder->expected_date?->format('d-m-Y') ?? '—' }}</p>
<p><strong>Total:</strong> {{ number_format((float) $purchaseOrder->total, 2, '.', ',') }}</p>
@if ($purchaseOrder->notes)
    <p><strong>Notes:</strong><br>{{ $purchaseOrder->notes }}</p>
@endif
<p>Thank you.</p>
</body>
</html>
