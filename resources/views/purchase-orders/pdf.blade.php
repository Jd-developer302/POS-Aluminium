<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; margin: 24px; line-height: 1.45; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .sub { font-size: 12px; color: #444; margin-bottom: 16px; }
        .meta { width: 100%; margin-bottom: 14px; border-collapse: collapse; }
        .meta td { padding: 3px 8px 3px 0; vertical-align: top; }
        .meta .k { font-weight: bold; color: #333; width: 120px; }
        table.lines { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.lines th, table.lines td { border: 1px solid #333; padding: 5px 6px; text-align: left; vertical-align: top; }
        table.lines th { background: #eee; font-size: 10px; }
        table.lines td.num, table.lines th.num { text-align: right; }
        .totals { width: 260px; margin-left: auto; margin-top: 14px; border-collapse: collapse; }
        .totals td { padding: 4px 0; }
        .totals .k { color: #444; }
        .totals .num { text-align: right; font-weight: bold; }
        .totals tr.grand td { border-top: 2px solid #111; padding-top: 8px; font-size: 13px; }
        .notes { margin-top: 14px; font-size: 10px; color: #444; }
        tr.adjustment td { background: #f9f9f9; font-style: italic; color: #333; }
    </style>
    <title>Purchase order {{ $purchaseOrder->order_number }}</title>
</head>
<body>
    @include('partials.invoice-logo', [
        'invoiceLogoPath' => $invoiceLogoPath ?? null,
    ])
    <h1>Purchase order</h1>
    <div class="sub">{{ $purchaseOrder->order_number }}</div>

    <table class="meta">
        <tr>
            <td class="k">Order date</td>
            <td>{{ optional($purchaseOrder->order_date)->format('Y-m-d') ?? '—' }}</td>
            <td class="k">Expected date</td>
            <td>{{ optional($purchaseOrder->expected_date)->format('Y-m-d') ?? '—' }}</td>
        </tr>
        <tr>
            <td class="k">Status</td>
            <td>{{ ucfirst((string) $purchaseOrder->status) }}</td>
            <td class="k">Branch</td>
            <td>{{ $purchaseOrder->branch?->name ?? '—' }}</td>
        </tr>
        <tr>
            <td class="k">Warehouse</td>
            <td>{{ $purchaseOrder->warehouse?->name ?? '—' }}</td>
            <td class="k">Supplier</td>
            <td>
                @if($purchaseOrder->supplier)
                    {{ $purchaseOrder->supplier->name }}
                    @if($purchaseOrder->supplier->code)
                        ({{ $purchaseOrder->supplier->code }})
                    @endif
                @else
                    —
                @endif
            </td>
        </tr>
    </table>

    <table class="lines">
        <thead>
            <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>{{ $qtyColumnHeader ?? 'Qty' }}</th>
                <th>Unit cost</th>
                <th class="num">Disc. %</th>
                <th class="num">Line total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr class="{{ ($row['row_type'] ?? '') === 'adjustment' ? 'adjustment' : '' }}">
                    <td>{{ $row['product'] }}</td>
                    <td>{{ $row['variant'] }}</td>
                    <td>{{ $row['length_qty'] }}</td>
                    <td>
                        @if(in_array($row['unit_cost_note'] ?? '', ['Cost/ft', 'Cost/sqft'], true) && ($row['unit_cost'] ?? '') !== '')
                            <span style="font-size:9px;color:#555;">{{ $row['unit_cost_note'] }}</span><br>{{ $row['unit_cost'] }}
                        @else
                            {{ $row['unit_cost'] }}
                        @endif
                    </td>
                    <td class="num">{{ $row['discount_percent'] ?? '0%' }}</td>
                    <td class="num">{{ $row['amount'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="k">Subtotal</td>
            <td class="num">{{ number_format((float) $purchaseOrder->subtotal, 2, '.', ',') }}</td>
        </tr>
        <tr>
            <td class="k">Tax</td>
            <td class="num">{{ number_format((float) $purchaseOrder->tax_amount, 2, '.', ',') }}</td>
        </tr>
        <tr>
            <td class="k">Shipping</td>
            <td class="num">{{ number_format((float) $purchaseOrder->shipping_cost, 2, '.', ',') }}</td>
        </tr>
        <tr>
            <td class="k">Order discount</td>
            <td class="num">{{ number_format((float) $purchaseOrder->discount_amount, 2, '.', ',') }}</td>
        </tr>
        <tr class="grand">
            <td class="k">Total</td>
            <td class="num">{{ number_format((float) $purchaseOrder->total, 2, '.', ',') }}</td>
        </tr>
    </table>

    @if($purchaseOrder->notes)
        <div class="notes"><strong>Notes:</strong> {{ $purchaseOrder->notes }}</div>
    @endif
</body>
</html>
