<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #111; margin: 18px 20px; line-height: 1.35; }
        .meta-row { width: 100%; margin: 10px 0 14px; }
        .meta-row td { vertical-align: top; padding: 0; }
        .meta-row .to { font-weight: bold; }
        .meta-row .dated { text-align: right; }
        .balance-before { width: 100%; margin-bottom: 10px; }
        .balance-before td { text-align: right; padding: 2px 6px; }
        .balance-before .label { text-align: left; font-weight: bold; }
        table.ledger { width: 100%; border-collapse: collapse; }
        table.ledger th, table.ledger td { border: 1px solid #333; padding: 4px 5px; vertical-align: top; }
        table.ledger th { background: #eee; font-weight: bold; font-size: 9px; }
        table.ledger td.num { text-align: right; white-space: nowrap; }
        table.ledger tr.closing td { font-weight: bold; background: #f5f5f5; }
        .particulars { max-width: 280px; }
    </style>
    <title>Customer ledger — {{ $statement['customer']['name'] ?? '' }}</title>
</head>
<body>
    @include('partials.invoice-logo', [
        'invoiceLogoPath' => $invoiceLogoPath ?? null,
    ])

    <table class="meta-row" role="presentation" cellspacing="0" cellpadding="0">
        <tr>
            <td class="to">To:- {{ $statement['customer']['name'] ?? '—' }}</td>
            <td class="dated">Dated:- {{ $statement['generated_at'] ?? '' }}</td>
        </tr>
    </table>

    <table class="ledger" style="margin-bottom: 8px;">
        <tbody>
            <tr>
                <td colspan="3" style="font-weight: bold; border: 1px solid #333;">Balance Before:-</td>
                <td class="num" style="border: 1px solid #333;">{{ $statement['balance_before_formatted']['credit'] ?? '0' }}</td>
                <td class="num" style="border: 1px solid #333;">{{ $statement['balance_before_formatted']['debit'] ?? '0' }}</td>
                <td class="num" style="border: 1px solid #333; font-weight: bold;">{{ $statement['balance_before_formatted']['balance'] ?? '0' }}</td>
            </tr>
        </tbody>
    </table>

    <table class="ledger">
        <thead>
            <tr>
                <th style="width: 72px;">Date</th>
                <th style="width: 56px;">Voucher</th>
                <th>Particulars</th>
                <th class="num" style="width: 72px;">Credit</th>
                <th class="num" style="width: 72px;">Debit</th>
                <th class="num" style="width: 80px;">Balance</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($statement['lines'] ?? [] as $line)
                <tr>
                    <td>{{ $line['date_display'] ?? '' }}</td>
                    <td>{{ $line['voucher'] ?? '' }}</td>
                    <td class="particulars">{{ $line['particulars'] ?? '' }}</td>
                    <td class="num">{{ $line['credit_formatted'] ?? '' }}</td>
                    <td class="num">{{ $line['debit_formatted'] ?? '' }}</td>
                    <td class="num">{{ $line['balance_formatted'] ?? '' }}</td>
                </tr>
            @endforeach
            <tr class="closing">
                <td colspan="3">Closing Balance</td>
                <td class="num">{{ $statement['closing_formatted']['credit'] ?? '0' }}</td>
                <td class="num">{{ $statement['closing_formatted']['debit'] ?? '0' }}</td>
                <td class="num">{{ $statement['closing_formatted']['balance'] ?? '0' }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
