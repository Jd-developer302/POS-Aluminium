<?php

namespace App\Services\Customer;

use App\Models\Customer\CustomerDueAdjustment;
use App\Models\Customer\CustomerDueItem;
use App\Models\Customer\CustomerReceipt;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SaleReturn;
use App\Models\Supplier\Customer;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class CustomerLedgerService
{
    /**
     * Ledger convention (matches classic Evergreen-style statements):
     * balance = cumulative(debit) − cumulative(credit)
     * Negative balance = customer has paid more / credit in their favour.
     *
     * @return array{
     *   customer: array{id: int, name: string, code: string|null},
     *   filters: array{branch_id: int|null, date_from: string|null, date_to: string|null},
     *   balance_before: array{debit: float, credit: float, balance: float},
     *   lines: list<array{sort_key: string, date: string, date_display: string, voucher: string, particulars: string, debit: float, credit: float, balance: float}>,
     *   closing: array{debit: float, credit: float, balance: float},
     *   generated_at: string
     * }
     */
    public function build(int $customerId, ?int $branchId = null, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $customer = Customer::query()->findOrFail($customerId);

        $from = $this->parseDate($dateFrom);
        $to = $this->parseDate($dateTo);

        $rawEvents = $this->collectEvents($customerId, $branchId);
        $events = $this->normalizeEvents($rawEvents, $customer);

        $beforePeriod = $events->filter(function (array $e) use ($from): bool {
            if ($from === null) {
                return false;
            }

            return $e['occurred_at']->lt($from->startOfDay());
        });

        $inPeriod = $events->filter(function (array $e) use ($from, $to): bool {
            $at = $e['occurred_at'];
            if ($from !== null && $at->lt($from->startOfDay())) {
                return false;
            }
            if ($to !== null && $at->gt($to->endOfDay())) {
                return false;
            }

            return true;
        })->sortBy([
            ['occurred_at', 'asc'],
            ['sort_order', 'asc'],
            ['id', 'asc'],
        ])->values();

        $debitBefore = round((float) $beforePeriod->sum('debit'), 2);
        $creditBefore = round((float) $beforePeriod->sum('credit'), 2);
        $balanceBefore = round($debitBefore - $creditBefore, 2);

        $running = $balanceBefore;
        $periodDebit = 0.0;
        $periodCredit = 0.0;
        $lines = [];

        foreach ($inPeriod as $event) {
            $debit = round((float) $event['debit'], 2);
            $credit = round((float) $event['credit'], 2);
            $running = round($running + $debit - $credit, 2);
            $periodDebit += $debit;
            $periodCredit += $credit;

            $lines[] = [
                'sort_key' => $event['sort_key'],
                'date' => $event['occurred_at']->format('Y-m-d'),
                'date_display' => $event['occurred_at']->format('d-M-y'),
                'voucher' => $event['voucher'],
                'particulars' => $event['particulars'],
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $running,
            ];
        }

        return [
            'customer' => [
                'id' => (int) $customer->id,
                'name' => (string) $customer->name,
                'code' => $customer->code !== null ? (string) $customer->code : null,
            ],
            'filters' => [
                'branch_id' => $branchId,
                'date_from' => $from?->format('Y-m-d'),
                'date_to' => $to?->format('Y-m-d'),
            ],
            'balance_before' => [
                'debit' => $debitBefore,
                'credit' => $creditBefore,
                'balance' => $balanceBefore,
            ],
            'lines' => $lines,
            'closing' => [
                'debit' => round($periodDebit, 2),
                'credit' => round($periodCredit, 2),
                'balance' => $running,
            ],
            'generated_at' => now()->format('d-M-y h:i A'),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function collectEvents(int $customerId, ?int $branchId): Collection
    {
        $events = collect();

        $dueQuery = CustomerDueItem::query()
            ->with(['sale:id,sale_number'])
            ->where('customer_id', $customerId)
            ->whereNotIn('status', ['cancelled']);

        if ($branchId) {
            $dueQuery->where('branch_id', $branchId);
        }

        foreach ($dueQuery->get() as $due) {
            $amount = round((float) $due->original_amount, 2);
            if ($amount <= 0) {
                continue;
            }

            $voucher = $due->sale?->sale_number
                ?? ($due->reference_no !== null && $due->reference_no !== '' ? (string) $due->reference_no : (string) $due->id);

            $particulars = $this->dueItemParticulars($due);

            $events->push([
                'sort_key' => 'due-'.$due->id,
                'sort_order' => 10,
                'id' => (int) $due->id,
                'occurred_at' => Carbon::parse($due->transaction_date)->startOfDay(),
                'voucher' => $voucher,
                'particulars' => $particulars,
                'debit' => $amount,
                'credit' => 0.0,
            ]);
        }

        $saleIdsWithDue = CustomerDueItem::query()
            ->where('customer_id', $customerId)
            ->whereNotNull('sale_id')
            ->whereNotIn('status', ['cancelled'])
            ->pluck('sale_id');

        $salesQuery = Sale::query()
            ->where('customer_id', $customerId)
            ->where('status', 'completed')
            ->where('due_amount', '>', 0);

        if ($branchId) {
            $salesQuery->where('branch_id', $branchId);
        }

        if ($saleIdsWithDue->isNotEmpty()) {
            $salesQuery->whereNotIn('id', $saleIdsWithDue);
        }

        foreach ($salesQuery->get(['id', 'sale_number', 'sale_date', 'due_amount', 'notes']) as $sale) {
            $amount = round((float) $sale->due_amount, 2);
            if ($amount <= 0) {
                continue;
            }

            $events->push([
                'sort_key' => 'sale-'.$sale->id,
                'sort_order' => 15,
                'id' => (int) $sale->id,
                'occurred_at' => Carbon::parse($sale->sale_date)->startOfDay(),
                'voucher' => (string) $sale->sale_number,
                'particulars' => trim('Invoice / sale due'.($sale->notes ? ' — '.$sale->notes : '')),
                'debit' => $amount,
                'credit' => 0.0,
            ]);
        }

        $receiptQuery = CustomerReceipt::query()
            ->where('customer_id', $customerId)
            ->where('status', 'posted');

        if ($branchId) {
            $receiptQuery->where('branch_id', $branchId);
        }

        foreach ($receiptQuery->get() as $receipt) {
            $amount = round((float) $receipt->amount, 2);
            if ($amount <= 0) {
                continue;
            }

            $events->push([
                'sort_key' => 'rcpt-'.$receipt->id,
                'sort_order' => 20,
                'id' => (int) $receipt->id,
                'occurred_at' => Carbon::parse($receipt->receipt_date)->startOfDay(),
                'voucher' => (string) $receipt->receipt_no,
                'particulars' => trim('Cash received'.($receipt->notes ? ' — '.$receipt->notes : '')),
                'debit' => 0.0,
                'credit' => $amount,
            ]);
        }

        $paymentsQuery = SalePayment::query()
            ->whereHas('sale', function ($q) use ($customerId, $branchId): void {
                $q->where('customer_id', $customerId);
                if ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            })
            ->with('sale:id,sale_number,customer_id');

        foreach ($paymentsQuery->get() as $payment) {
            $amount = round((float) $payment->amount, 2);
            if ($amount <= 0) {
                continue;
            }

            $saleNumber = $payment->sale?->sale_number ?? '';

            $events->push([
                'sort_key' => 'pay-'.$payment->id,
                'sort_order' => 25,
                'id' => (int) $payment->id,
                'occurred_at' => Carbon::parse($payment->payment_date)->startOfDay(),
                'voucher' => $payment->payment_number ?: (string) $payment->id,
                'particulars' => $saleNumber !== ''
                    ? "Cash received of Invoice# {$saleNumber}"
                    : 'Cash received (sale payment)',
                'debit' => 0.0,
                'credit' => $amount,
            ]);
        }

        $adjQuery = CustomerDueAdjustment::query()
            ->with('dueItem:id,sale_id', 'dueItem.sale:id,sale_number')
            ->where('customer_id', $customerId);

        if ($branchId) {
            $adjQuery->where('branch_id', $branchId);
        }

        foreach ($adjQuery->get() as $adj) {
            $amount = round(abs((float) $adj->amount), 2);
            if ($amount <= 0) {
                continue;
            }

            $isCredit = in_array($adj->adjustment_type, ['discount', 'write_off'], true)
                || ($adj->adjustment_type === 'correction' && (float) $adj->amount > 0);

            $events->push([
                'sort_key' => 'adj-'.$adj->id,
                'sort_order' => 30,
                'id' => (int) $adj->id,
                'occurred_at' => Carbon::parse($adj->adjustment_date)->startOfDay(),
                'voucher' => (string) $adj->id,
                'particulars' => ucfirst(str_replace('_', ' ', (string) $adj->adjustment_type))
                    .($adj->reason ? ' — '.$adj->reason : ''),
                'debit' => $isCredit ? 0.0 : $amount,
                'credit' => $isCredit ? $amount : 0.0,
            ]);
        }

        $returnsQuery = SaleReturn::query()
            ->where('customer_id', $customerId)
            ->where('status', 'completed')
            ->where('refund_amount', '>', 0)
            ->with('sale:id,sale_number');

        foreach ($returnsQuery->get() as $ret) {
            $amount = round((float) $ret->refund_amount, 2);
            if ($amount <= 0) {
                continue;
            }

            $events->push([
                'sort_key' => 'ret-'.$ret->id,
                'sort_order' => 35,
                'id' => (int) $ret->id,
                'occurred_at' => Carbon::parse($ret->return_date)->startOfDay(),
                'voucher' => (string) $ret->return_number,
                'particulars' => 'Sale return'.($ret->sale?->sale_number ? ' — '.$ret->sale->sale_number : ''),
                'debit' => 0.0,
                'credit' => $amount,
            ]);
        }

        return $events;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $events
     * @return Collection<int, array<string, mixed>>
     */
    private function normalizeEvents(Collection $events, Customer $customer): Collection
    {
        $hasOldBalanceDue = CustomerDueItem::query()
            ->where('customer_id', $customer->id)
            ->where('source_type', 'old_balance')
            ->whereNotIn('status', ['cancelled'])
            ->exists();

        $opening = round((float) $customer->opening_balance, 2);
        if ($opening !== 0.0 && ! $hasOldBalanceDue) {
            $events->prepend([
                'sort_key' => 'opening-master',
                'sort_order' => 0,
                'id' => 0,
                'occurred_at' => Carbon::parse('2000-01-01')->startOfDay(),
                'voucher' => '',
                'particulars' => 'Opening balance (customer)',
                'debit' => $opening > 0 ? $opening : 0.0,
                'credit' => $opening < 0 ? abs($opening) : 0.0,
            ]);
        }

        return $events;
    }

    private function dueItemParticulars(CustomerDueItem $due): string
    {
        $parts = [];

        if ($due->source_type === 'old_balance') {
            $parts[] = 'Opening / old balance';
        } elseif ($due->source_type === 'sale') {
            $parts[] = 'Sale due';
            if ($due->sale?->sale_number) {
                $parts[] = $due->sale->sale_number;
            }
        } else {
            $parts[] = 'Manual due';
        }

        $productLine = trim(implode(' ', array_filter([
            (string) ($due->product_name ?? ''),
            (string) ($due->variant_name ?? ''),
        ])));
        if ($productLine !== '') {
            $parts[] = $productLine;
        }

        if ($due->notes) {
            $parts[] = (string) $due->notes;
        }

        return implode(' — ', array_filter($parts)) ?: 'Due entry';
    }

    private function parseDate(?string $value): ?Carbon
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return Carbon::parse($value);
    }

    public static function formatMoney(float $value): string
    {
        $formatted = number_format(abs($value), 0, '.', ',');
        if ($value < 0) {
            return '-'.$formatted;
        }

        return $formatted;
    }
}
