<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Supplier\Customer;
use App\Services\Report\CustomerReceivableReportPresenter;
use App\Services\Report\ReportTableBuilder;
use Barryvdh\DomPDF\PDF;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    private const CUSTOMER_RECEIVABLES = 'customer-receivables';

    public function index(): InertiaResponse
    {
        return Inertia::render('Report/Index');
    }

    public function show(Request $request, string $type): InertiaResponse
    {
        $this->assertType($type);

        if ($type === self::CUSTOMER_RECEIVABLES) {
            $presenter = new CustomerReceivableReportPresenter;
            $payload = $presenter->inertiaPayload($request, 8);

            return Inertia::render('Report/CustomerReceivables', [
                'title' => 'Customer receivables (detail)',
                'grandTotals' => $payload['grand_totals'],
                'customers' => $payload['customers'],
                'filters' => $request->only($this->filterKeysForType($type)),
                'filterOptions' => [
                    'branches' => Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
                    'customers' => Customer::query()->where('status', 'active')->orderBy('name')->limit(500)->get(['id', 'name', 'code']),
                ],
            ]);
        }

        $builder = new ReportTableBuilder;
        $data = $builder->paginated($type, $request);

        return Inertia::render('Report/Show', [
            'reportType' => $type,
            'title' => $data['title'],
            'columns' => $data['columns'],
            'rows' => $data['paginator'],
            'filters' => $request->only($this->filterKeysForType($type)),
            'filterOptions' => $data['filterOptions'],
        ]);
    }

    public function export(Request $request, string $type): Response
    {
        $this->assertType($type);

        $format = strtolower((string) $request->query('format', 'csv'));
        if (! in_array($format, ['csv', 'pdf'], true)) {
            abort(422, 'Invalid format. Use csv or pdf.');
        }

        if ($type === self::CUSTOMER_RECEIVABLES) {
            $presenter = new CustomerReceivableReportPresenter;
            $data = $presenter->exportRows($request, 5000);
        } else {
            $builder = new ReportTableBuilder;
            $data = $builder->exportRows($type, $request, 5000);
        }

        $safeSlug = preg_replace('/[^a-z0-9\-]+/i', '-', $type) ?? $type;
        $titleSlug = Str::slug($data['title'] ?? '');
        if ($titleSlug === '') {
            $titleSlug = $safeSlug;
        }
        $datePart = now()->format('Y-m-d');
        $exportBasename = "{$titleSlug}-{$datePart}";

        if ($format === 'csv') {
            $filename = "{$exportBasename}.csv";

            return response()->streamDownload(function () use ($data): void {
                $out = fopen('php://output', 'w');
                fwrite($out, "\xEF\xBB\xBF");
                fputcsv($out, array_map(static fn (array $c): string => $c['label'], $data['columns']));
                foreach ($data['rows'] as $row) {
                    $line = [];
                    foreach ($data['columns'] as $col) {
                        $line[] = $row[$col['key']] ?? '';
                    }
                    fputcsv($out, $line);
                }
                fclose($out);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        try {
            /** @var PDF $generator */
            $generator = app()->make('dompdf.wrapper');

            $pdf = $generator
                ->loadView('reports.pdf-table', [
                    'title' => $data['title'],
                    'columns' => $data['columns'],
                    'rows' => $data['rows'],
                    'generatedAt' => now()->toDateTimeString(),
                ])
                ->setPaper('a4', 'landscape');

            $pdfFilename = "{$exportBasename}.pdf";

            $pdfInlineConfig = config('reports.pdf_inline');
            $useInlinePdf = ($pdfInlineConfig === null || $pdfInlineConfig === '')
                ? app()->environment('local')
                : filter_var($pdfInlineConfig, FILTER_VALIDATE_BOOLEAN);

            return $useInlinePdf ? $pdf->stream($pdfFilename) : $pdf->download($pdfFilename);
        } catch (\Throwable $e) {
            report($e);

            $params = collect($request->except(['format']))
                ->filter(static fn ($v) => $v !== null && $v !== '')
                ->all();
            $url = route('reports.show', ['type' => $type]);
            if ($params !== []) {
                $url .= '?'.http_build_query($params);
            }

            return redirect()
                ->to($url)
                ->with(
                    'error',
                    'PDF export failed. Use CSV export, or on the server run `composer install --no-dev` and ensure the `barryvdh/laravel-dompdf` package is installed. If it still fails, check PHP has the `dom` / `mbstring` extensions enabled.'
                );
        }
    }

    private function assertType(string $type): void
    {
        if ($type === self::CUSTOMER_RECEIVABLES) {
            return;
        }
        if (! in_array($type, ReportTableBuilder::TYPES, true)) {
            abort(404);
        }
    }

    /**
     * @return list<string>
     */
    private function filterKeysForType(string $type): array
    {
        return match ($type) {
            'discount-analysis' => ['date_from', 'date_to', 'branch_id', 'slice'],
            'expense-vs-sales' => ['date_from', 'date_to', 'branch_id'],
            'expenses' => ['date_from', 'date_to', 'branch_id', 'category_id', 'q'],
            'profit-margin' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'customer_id', 'q', 'cost_basis'],
            'purchase-invoices' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'supplier_id', 'status', 'q'],
            'inventory-movements' => ['q', 'direction', 'source_type', 'branch_id', 'warehouse_id', 'product_id', 'date_from', 'date_to'],
            'stock-transfers' => ['date_from', 'date_to', 'from_branch_id', 'to_branch_id', 'status', 'q'],
            'stocks' => ['q', 'status', 'branch_id', 'warehouse_id', 'product_id'],
            'stock-adjustments' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'status', 'type', 'q'],
            'sale-returns' => ['date_from', 'date_to', 'warehouse_id', 'status', 'q'],
            'sales' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'customer_id', 'status', 'payment_status', 'q'],
            'purchase-order-notifications' => ['date_from', 'date_to', 'branch_id', 'supplier_id', 'email_status', 'whatsapp_status', 'q'],
            'purchase-orders' => ['date_from', 'date_to', 'branch_id', 'supplier_id', 'status', 'q'],
            'quotations' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'customer_id', 'status', 'q'],
            'quotation-lines' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'customer_id', 'status', 'q'],
            'supplier-aging' => ['branch_id', 'supplier_id'],
            'customer-aging' => ['branch_id', 'customer_id'],
            'customer-receivables' => ['date_from', 'date_to', 'branch_id', 'customer_id', 'q', 'q_sale'],
            'customer-due-register' => ['date_from', 'date_to', 'branch_id', 'customer_id', 'status', 'source_type', 'q'],
            'product-sales-summary' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'group_by'],
            'returns-analysis' => ['date_from', 'date_to', 'branch_id', 'warehouse_id', 'slice'],
            'stock-valuation' => ['branch_id', 'warehouse_id', 'product_id', 'q', 'cost_basis'],
            'tax-summary' => ['date_from', 'date_to', 'branch_id'],
            default => [],
        };
    }
}
