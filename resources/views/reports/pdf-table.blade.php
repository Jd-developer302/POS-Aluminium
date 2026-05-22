<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #111; }
        h1 { font-size: 14px; margin: 0 0 8px; }
        .meta { font-size: 9px; color: #444; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 4px 5px; text-align: left; vertical-align: top; }
        th { background: #eee; font-weight: bold; }
        tr:nth-child(even) td { background: #f9f9f9; }
    </style>
    <title>{{ $title }}</title>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="meta">Generated: {{ $generatedAt }}</div>
    <table>
        <thead>
            <tr>
                @foreach ($columns as $col)
                    <th>{{ $col['label'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    @foreach ($columns as $col)
                        <td>{{ $row[$col['key']] ?? '' }}</td>
                    @endforeach
                </tr>
            @endforeach
    
        </tbody>
    </table>
</body>
</html>
