<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Setting;
use App\Models\Supplier\Customer;
use App\Services\Customer\CustomerLedgerService;
use Barryvdh\DomPDF\PDF;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CustomerLedgerController extends Controller
{
    public function __construct(
        private readonly CustomerLedgerService $ledger,
    ) {}

    public function show(Request $request): Response
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')],
            'branch_id' => ['nullable', 'integer', Rule::exists('branches', 'id')],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $customerId = ! empty($validated['customer_id']) ? (int) $validated['customer_id'] : null;
        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;

        $branches = Branch::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']);
        $customers = Customer::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'code']);

        $statementPayload = null;
        if ($customerId !== null) {
            $statementPayload = $this->formatStatementForUi(
                $this->ledger->build(
                    $customerId,
                    $branchId,
                    $validated['date_from'] ?? null,
                    $validated['date_to'] ?? null,
                ),
            );
        }

        return Inertia::render('Customer/Ledger', [
            'statement' => $statementPayload,
            'filters' => [
                'customer_id' => $customerId ?? '',
                'branch_id' => $branchId ?? '',
                'date_from' => $validated['date_from'] ?? '',
                'date_to' => $validated['date_to'] ?? '',
            ],
            'filterOptions' => [
                'branches' => $branches,
                'customers' => $customers,
            ],
        ]);
    }

    public function pdf(Request $request): HttpResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'branch_id' => ['nullable', 'integer', Rule::exists('branches', 'id')],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $statement = $this->ledger->build(
            (int) $validated['customer_id'],
            isset($validated['branch_id']) ? (int) $validated['branch_id'] : null,
            $validated['date_from'] ?? null,
            $validated['date_to'] ?? null,
        );

        $formatted = $this->formatStatementForUi($statement);

        try {
            /** @var PDF $generator */
            $generator = app()->make('dompdf.wrapper');

            $pdf = $generator
                ->loadView('customers.ledger-pdf', [
                    'statement' => $formatted,
                    'invoiceLogoPath' => Setting::invoiceLogoPathForPdf(),
                ])
                ->setPaper('a4', 'portrait');

            $slug = preg_replace('/[^a-z0-9\-]+/i', '-', $statement['customer']['name']) ?? 'customer';
            $filename = 'customer-ledger-'.trim($slug, '-').'-'.now()->format('Y-m-d').'.pdf';

            $pdfInlineConfig = config('reports.pdf_inline');
            $useInlinePdf = ($pdfInlineConfig === null || $pdfInlineConfig === '')
                ? false
                : filter_var($pdfInlineConfig, FILTER_VALIDATE_BOOLEAN);

            return $useInlinePdf ? $pdf->stream($filename) : $pdf->download($filename);
        } catch (\Throwable $e) {
            report($e);

            return redirect()
                ->route('customer-receivables.ledger', $request->only(['customer_id', 'branch_id', 'date_from', 'date_to']))
                ->with('error', 'PDF could not be generated. Try Print from the screen instead.');
        }
    }

    /**
     * @param  array<string, mixed>  $statement
     * @return array<string, mixed>
     */
    private function formatStatementForUi(array $statement): array
    {
        $fmt = static fn (float $n): string => CustomerLedgerService::formatMoney($n);

        $statement['balance_before_formatted'] = [
            'debit' => $fmt($statement['balance_before']['debit']),
            'credit' => $fmt($statement['balance_before']['credit']),
            'balance' => $fmt($statement['balance_before']['balance']),
        ];
        $statement['closing_formatted'] = [
            'debit' => $fmt($statement['closing']['debit']),
            'credit' => $fmt($statement['closing']['credit']),
            'balance' => $fmt($statement['closing']['balance']),
        ];

        $statement['lines'] = array_map(static function (array $line): array {
            return [
                ...$line,
                'debit_formatted' => $line['debit'] > 0 ? CustomerLedgerService::formatMoney($line['debit']) : '',
                'credit_formatted' => $line['credit'] > 0 ? CustomerLedgerService::formatMoney($line['credit']) : '',
                'balance_formatted' => CustomerLedgerService::formatMoney($line['balance']),
            ];
        }, $statement['lines']);

        return $statement;
    }
}
