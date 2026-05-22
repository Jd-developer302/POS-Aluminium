<?php

namespace App\Services\Report;

use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\Supplier\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class CustomerReceivableReportPresenter
{
    /**
     * @return array{columns: list<array{key: string, label: string}>, rows: list<array<string, string|null>>, title: string}
     */
    public function exportRows(Request $request, int $limit = 5000): array
    {
        $selectedIds = $this->normalizeExportSaleIds($request);
        $maxSales = $selectedIds !== [] ? 500 : max(100, min($limit * 10, 20000));

        $columns = [
            ['key' => 'customer_code', 'label' => 'Customer code'],
            ['key' => 'customer_name', 'label' => 'Customer name'],
            ['key' => 'sale_number', 'label' => 'Invoice #'],
            ['key' => 'sale_date', 'label' => 'Invoice date'],
            ['key' => 'branch', 'label' => 'Branch'],
            ['key' => 'invoice_total', 'label' => 'Invoice total'],
            ['key' => 'invoice_paid', 'label' => 'Invoice paid'],
            ['key' => 'invoice_due', 'label' => 'Invoice due'],
            ['key' => 'payment_number', 'label' => 'Payment #'],
            ['key' => 'payment_date', 'label' => 'Payment date'],
            ['key' => 'payment_amount', 'label' => 'Payment amount'],
            ['key' => 'payment_method', 'label' => 'Payment method'],
            ['key' => 'payment_reference', 'label' => 'Payment ref'],
            ['key' => 'payment_notes', 'label' => 'Payment notes'],
        ];

        $salesQuery = $this->filteredSaleQuery($request)
            ->with(['customer:id,code,name', 'branch:id,name', 'payments' => fn ($q) => $q->orderBy('payment_date')->orderBy('id')])
            ->latest('sale_date')
            ->latest('id');

        if ($selectedIds !== []) {
            $salesQuery->whereIn('id', $selectedIds);
        }

        $sales = $salesQuery->limit($maxSales)->get();

        $rows = [];
        foreach ($sales as $sale) {
            /** @var Collection<int, SalePayment> $payments */
            $payments = $sale->payments ?? collect();
            if ($payments->isEmpty()) {
                $rows[] = $this->exportRowBlankPayment($sale);
                if (count($rows) >= $limit) {
                    break;
                }

                continue;
            }
            foreach ($payments as $p) {
                $rows[] = $this->exportRowWithPayment($sale, $p);
                if (count($rows) >= $limit) {
                    break 2;
                }
            }
        }

        return [
            'title' => 'Customer receivables (detail)',
            'columns' => $columns,
            'rows' => array_slice($rows, 0, $limit),
        ];
    }

    /**
     * @return array{grand_totals: array{invoice_count: int, total_invoiced: float, total_paid: float, total_due: float}, customers: LengthAwarePaginator<int, Customer>}
     */
    public function paginatedForUi(Request $request, int $perPage = 8): array
    {
        $grandTotals = $this->grandTotalsAggregate($request);

        $customers = Customer::query()
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->whereKey((int) $v))
            ->when(trim((string) $request->query('q')), function (Builder $b, string $needle) {
                $t = '%'.$needle.'%';
                $b->where(function (Builder $sub) use ($t) {
                    $sub->where('customers.name', 'like', $t)
                        ->orWhere('customers.code', 'like', $t)
                        ->orWhere('customers.phone', 'like', $t);
                });
            })
            ->whereHas('sales', fn ($saleQ) => $this->applyReceivableSaleScope($saleQ, $request))
            ->with(['sales' => function ($saleQ) use ($request): void {
                $this->applyReceivableSaleScope($saleQ, $request);
                $saleQ->with([
                    'branch:id,name',
                    'payments' => fn ($pq) => $pq->orderBy('payment_date')->orderBy('id'),
                ])
                    ->latest('sale_date')
                    ->latest('id');
            }])
            ->orderBy('customers.name')
            ->paginate(max(5, min($perPage, 50)));

        return [
            'grand_totals' => $grandTotals,
            'customers' => $customers,
        ];
    }

    /**
     * @return array{grand_totals: array{invoice_count: int, total_invoiced: float, total_paid: float, total_due: float}, customers: LengthAwarePaginator<int, array>}
     */
    public function inertiaPayload(Request $request, int $perPage = 8): array
    {
        $out = $this->paginatedForUi($request, $perPage);

        /** @var LengthAwarePaginator<int, Customer> $page */
        $page = $out['customers'];
        $page->through(fn (Customer $c): array => $this->mapCustomerForFrontend($c));

        return [
            'grand_totals' => $out['grand_totals'],
            'customers' => $page,
        ];
    }

    /**
     * @return array{id: int, name: string, code: string, phone: string|null, invoice_count: int, total_invoiced: float, total_paid: float, total_due: float, sales: list<array<string, mixed>>}
     */
    private function mapCustomerForFrontend(Customer $c): array
    {
        $sales = $c->sales ?? collect();

        $tInv = round((float) $sales->sum('total'), 2);
        $tPaid = round((float) $sales->sum('paid_amount'), 2);
        $tDue = round((float) $sales->sum('due_amount'), 2);

        $saleRows = [];
        foreach ($sales as $s) {
            $payRows = [];
            foreach ($s->payments ?? [] as $p) {
                $payRows[] = [
                    'payment_number' => $p->payment_number,
                    'payment_date' => $p->payment_date?->format('Y-m-d') ?? '',
                    'amount' => round((float) $p->amount, 2),
                    'payment_method' => $p->payment_method,
                    'reference_number' => $p->reference_number,
                ];
            }

            $saleRows[] = [
                'id' => $s->id,
                'sale_number' => $s->sale_number,
                'sale_date' => $s->sale_date?->format('Y-m-d H:i') ?? '',
                'branch' => $s->branch?->name ?? '—',
                'total' => round((float) $s->total, 2),
                'paid_amount' => round((float) $s->paid_amount, 2),
                'due_amount' => round((float) $s->due_amount, 2),
                'payments' => $payRows,
            ];
        }

        return [
            'id' => (int) $c->id,
            'name' => (string) $c->name,
            'code' => (string) ($c->code ?? ''),
            'phone' => $c->phone,
            'invoice_count' => count($saleRows),
            'total_invoiced' => $tInv,
            'total_paid' => $tPaid,
            'total_due' => $tDue,
            'sales' => $saleRows,
        ];
    }

    /**
     * @return array{invoice_count: int, total_invoiced: float, total_paid: float, total_due: float}
     */
    public function grandTotalsAggregate(Request $request): array
    {
        /** @var object{count: mixed, sum_total: mixed, sum_paid: mixed, sum_due: mixed}|null $agg */
        $agg = $this->filteredSaleQuery($request)->selectRaw('
            COUNT(*) as count,
            COALESCE(SUM(total), 0) as sum_total,
            COALESCE(SUM(paid_amount), 0) as sum_paid,
            COALESCE(SUM(due_amount), 0) as sum_due
        ')->first();

        if ($agg === null) {
            return [
                'invoice_count' => 0,
                'total_invoiced' => 0.0,
                'total_paid' => 0.0,
                'total_due' => 0.0,
            ];
        }

        return [
            'invoice_count' => (int) ($agg->count ?? 0),
            'total_invoiced' => round((float) ($agg->sum_total ?? 0), 2),
            'total_paid' => round((float) ($agg->sum_paid ?? 0), 2),
            'total_due' => round((float) ($agg->sum_due ?? 0), 2),
        ];
    }

    /**
     * @param  Builder<Sale>|object  $saleQ  Eloquent builder (whereHas / root) or relation (nested with)
     */
    private function applyReceivableSaleScope($saleQ, Request $request): void
    {
        $saleQ->where('status', 'completed')
            ->whereNotNull('customer_id')
            ->when($request->query('date_from'), fn ($b, $v) => $b->whereDate('sale_date', '>=', $v))
            ->when($request->query('date_to'), fn ($b, $v) => $b->whereDate('sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn ($b, $v) => $b->where('branch_id', (int) $v))
            ->when(trim((string) $request->query('q_sale')), fn ($b, string $needle) => $b->where('sale_number', 'like', '%'.$needle.'%'));
    }

    /**
     * @return Builder<Sale>
     */
    private function filteredSaleQuery(Request $request): Builder
    {
        $q = Sale::query()
            ->where('status', 'completed')
            ->whereNotNull('customer_id');

        return $this->applyRootSaleFilters($q, $request);
    }

    /**
     * @param  Builder<Sale>  $q
     * @return Builder<Sale>
     */
    private function applyRootSaleFilters(Builder $q, Request $request): Builder
    {
        return $q->when($request->query('date_from'), fn (Builder $b, $v) => $b->whereDate('sale_date', '>=', $v))
            ->when($request->query('date_to'), fn (Builder $b, $v) => $b->whereDate('sale_date', '<=', $v))
            ->when($request->query('branch_id'), fn (Builder $b, $v) => $b->where('branch_id', (int) $v))
            ->when($request->query('customer_id'), fn (Builder $b, $v) => $b->where('customer_id', (int) $v))
            ->when(trim((string) $request->query('q')), function (Builder $b, string $needle) {
                $t = '%'.$needle.'%';
                $b->whereHas('customer', function (Builder $sub) use ($t) {
                    $sub->where('customers.name', 'like', $t)
                        ->orWhere('customers.code', 'like', $t)
                        ->orWhere('customers.phone', 'like', $t);
                });
            })
            ->when(trim((string) $request->query('q_sale')), fn (Builder $b, string $needle) => $b->where('sale_number', 'like', '%'.$needle.'%'));
    }

    /**
     * @return list<int>
     */
    private function normalizeExportSaleIds(Request $request): array
    {
        $raw = $request->query('ids', []);
        if (! is_array($raw)) {
            $raw = $raw !== null && $raw !== '' ? [$raw] : [];
        }
        $ids = array_values(array_unique(array_filter(array_map(static fn ($v): int => (int) $v, $raw))));

        return array_slice($ids, 0, 500);
    }

    /**
     * @return array<string, string|null>
     */
    private function exportRowBlankPayment(Sale $sale): array
    {
        return [
            'customer_code' => $sale->customer?->code ?? '',
            'customer_name' => $sale->customer?->name ?? '',
            'sale_number' => $sale->sale_number,
            'sale_date' => $sale->sale_date?->format('Y-m-d H:i') ?? '',
            'branch' => $sale->branch?->name ?? '—',
            'invoice_total' => number_format((float) $sale->total, 2, '.', ''),
            'invoice_paid' => number_format((float) $sale->paid_amount, 2, '.', ''),
            'invoice_due' => number_format((float) $sale->due_amount, 2, '.', ''),
            'payment_number' => '',
            'payment_date' => '',
            'payment_amount' => '',
            'payment_method' => '',
            'payment_reference' => '',
            'payment_notes' => '',
        ];
    }

    /**
     * @return array<string, string|null>
     */
    private function exportRowWithPayment(Sale $sale, SalePayment $p): array
    {
        $row = $this->exportRowBlankPayment($sale);
        $row['payment_number'] = $p->payment_number;
        $row['payment_date'] = $p->payment_date?->format('Y-m-d') ?? '';
        $row['payment_amount'] = number_format((float) $p->amount, 2, '.', '');
        $row['payment_method'] = (string) $p->payment_method;
        $row['payment_reference'] = $p->reference_number ?? '';
        $row['payment_notes'] = $p->notes ? substr((string) $p->notes, 0, 240) : '';

        return $row;
    }
}
