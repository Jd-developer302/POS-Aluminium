<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Company\Branch;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PurchaseInvoice;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\Stock;
use App\Support\DashboardCharts;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $sessionBranchId = $request->session()->get('current_branch_id');

        if ($user && $user->hasRole('Super Admin')) {
            $effectiveBranchId = $sessionBranchId;
        } elseif ($user && $user->branch_id) {
            $effectiveBranchId = $user->branch_id;
        } else {
            $effectiveBranchId = $sessionBranchId;
        }

        $todayStart = now()->copy()->startOfDay();
        $todayEnd = now()->copy()->endOfDay();
        $yesterdayStart = now()->copy()->subDay()->startOfDay();
        $yesterdayEnd = now()->copy()->subDay()->endOfDay();

        $todaySalesQuery = Sale::query()
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$todayStart, $todayEnd]);

        $yesterdaySalesQuery = Sale::query()
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$yesterdayStart, $yesterdayEnd]);

        if ($effectiveBranchId) {
            $todaySalesQuery->where('branch_id', $effectiveBranchId);
            $yesterdaySalesQuery->where('branch_id', $effectiveBranchId);
        }

        $todaySalesAmount = (float) (clone $todaySalesQuery)->sum('total');
        $yesterdaySalesAmount = (float) (clone $yesterdaySalesQuery)->sum('total');

        $todaySalesCount = $todaySalesQuery->count();
        $yesterdaySalesCount = $yesterdaySalesQuery->count();

        $todaySalesDeltaLabel = null;
        if ($yesterdaySalesCount > 0) {
            $pct = (int) round((($todaySalesCount - $yesterdaySalesCount) / $yesterdaySalesCount) * 100);
            $todaySalesDeltaLabel = sprintf('%s%d%% vs yesterday', $pct >= 0 ? '+' : '', $pct);
        } elseif ($todaySalesCount > 0) {
            $todaySalesDeltaLabel = 'No completed sales yesterday';
        }

        $todaySalesAmountDeltaLabel = null;
        if ($yesterdaySalesAmount > 0) {
            $pct = (int) round((($todaySalesAmount - $yesterdaySalesAmount) / $yesterdaySalesAmount) * 100);
            $todaySalesAmountDeltaLabel = sprintf('%s%d%% vs yesterday', $pct >= 0 ? '+' : '', $pct);
        } elseif ($todaySalesAmount > 0) {
            $todaySalesAmountDeltaLabel = 'No sales revenue yesterday';
        }

        $todayPurchasesQuery = PurchaseInvoice::query()
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereDate('invoice_date', $todayStart->toDateString());

        $yesterdayPurchasesQuery = PurchaseInvoice::query()
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereDate('invoice_date', $yesterdayStart->toDateString());

        if ($effectiveBranchId) {
            $todayPurchasesQuery->where('branch_id', $effectiveBranchId);
            $yesterdayPurchasesQuery->where('branch_id', $effectiveBranchId);
        }

        $todayPurchasesCount = $todayPurchasesQuery->count();
        $yesterdayPurchasesCount = $yesterdayPurchasesQuery->count();

        $todayPurchasesDeltaLabel = null;
        if ($yesterdayPurchasesCount > 0) {
            $pct = (int) round((($todayPurchasesCount - $yesterdayPurchasesCount) / $yesterdayPurchasesCount) * 100);
            $todayPurchasesDeltaLabel = sprintf('%s%d%% vs yesterday', $pct >= 0 ? '+' : '', $pct);
        } elseif ($todayPurchasesCount > 0) {
            $todayPurchasesDeltaLabel = 'No purchases yesterday';
        }

        $todayNetProfit = $this->netProfitForCompletedSalesBetween($effectiveBranchId, $todayStart, $todayEnd);
        $yesterdayNetProfit = $this->netProfitForCompletedSalesBetween($effectiveBranchId, $yesterdayStart, $yesterdayEnd);

        $todayNetProfitDeltaLabel = null;
        if ($yesterdayNetProfit > 0) {
            $pct = (int) round((($todayNetProfit - $yesterdayNetProfit) / $yesterdayNetProfit) * 100);
            $todayNetProfitDeltaLabel = sprintf('%s%d%% vs yesterday', $pct >= 0 ? '+' : '', $pct);
        } elseif ($todayNetProfit > 0 && $yesterdayNetProfit <= 0) {
            $todayNetProfitDeltaLabel = 'No profit yesterday';
        }

        $employeesPreviewQuery = Employee::query()
            ->with('branch:id,name')
            ->orderByDesc('id')
            ->limit(10);

        if ($effectiveBranchId) {
            $employeesPreviewQuery->where('branch_id', $effectiveBranchId);
        }

        $employeesPreview = $employeesPreviewQuery->get()
            ->map(static function (Employee $e): array {
                return [
                    'employee_key' => $e->employee_id,
                    'name' => $e->name,
                    'photo_url' => $e->photo_url,
                    'branch_name' => $e->branch?->name ?? '—',
                    'status' => $e->status,
                ];
            })
            ->values();

        $attDateRaw = $request->query('att_date', now()->toDateString());
        try {
            $attDate = Carbon::parse($attDateRaw)->toDateString();
        } catch (\Throwable) {
            $attDate = now()->toDateString();
        }

        $attBranchFilter = $request->query('att_branch', '');
        if (! is_string($attBranchFilter)) {
            $attBranchFilter = '';
        }

        $payMonth = (int) $request->query('pay_month', now()->month);
        $payYear = (int) $request->query('pay_year', now()->year);
        if ($payMonth < 1 || $payMonth > 12) {
            $payMonth = now()->month;
        }
        if ($payYear < 2000 || $payYear > 2100) {
            $payYear = now()->year;
        }

        $filterBranches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Branch $b): array => ['id' => $b->id, 'name' => $b->name])
            ->values();

        $empAttQ = Employee::query()->where('status', 'active');
        if ($attBranchFilter !== '') {
            $empAttQ->where('branch_id', (int) $attBranchFilter);
        } elseif ($effectiveBranchId) {
            $empAttQ->where('branch_id', $effectiveBranchId);
        }
        $employeesForAtt = $empAttQ->orderBy('name')->limit(30)->get(['id', 'name']);

        $attendanceForDate = Attendance::query()
            ->whereDate('date', $attDate)
            ->whereIn('employee_id', $employeesForAtt->pluck('id'))
            ->get()
            ->keyBy('employee_id');

        $formatTime = static function (?string $t): ?string {
            if ($t === null || $t === '') {
                return null;
            }
            try {
                return Carbon::parse($t)->format('h:i A');
            } catch (\Throwable) {
                return $t;
            }
        };

        $attendancePreview = $employeesForAtt->values()->map(static function (Employee $e) use ($attendanceForDate, $attDate, $formatTime): array {
            $a = $attendanceForDate->get($e->id);
            $status = $a?->status ?? 'absent';

            return [
                'employee_name' => $e->name,
                'date' => $attDate,
                'check_in' => $a ? $formatTime($a->check_in) : null,
                'check_out' => $a ? $formatTime($a->check_out) : null,
                'status' => $status,
            ];
        });

        $payrollQuery = Payroll::query()
            ->with('employee:id,name')
            ->where('month', $payMonth)
            ->where('year', $payYear);

        if ($effectiveBranchId) {
            $payrollQuery->whereHas('employee', static function ($q) use ($effectiveBranchId): void {
                $q->where('branch_id', $effectiveBranchId);
            });
        }

        $payrollPreview = $payrollQuery->orderBy('employee_id')->limit(25)->get()
            ->map(static function (Payroll $p): array {
                return [
                    'employee_name' => $p->employee?->name ?? '—',
                    'basic_salary' => (float) $p->basic_salary,
                    'allowances' => (float) $p->total_allowance,
                    'deductions' => (float) $p->total_deduction,
                    'net_salary' => (float) $p->net_salary,
                    'status' => $p->status,
                ];
            })
            ->values();

        $payrollYearOptions = collect(range(now()->year, now()->year - 5))->values()->all();

        $globalLowStock = Setting::lowStockThreshold();
        $lowStockLineQuery = Stock::query()
            ->join('products', 'products.id', '=', 'stocks.product_id')
            ->where('stocks.status', 'active');

        if ($effectiveBranchId) {
            $lowStockLineQuery->join('warehouses', 'warehouses.id', '=', 'stocks.warehouse_id')
                ->where('warehouses.branch_id', $effectiveBranchId);
        }

        $lowStockLineCount = (int) $lowStockLineQuery
            ->whereRaw(
                '(stocks.quantity - stocks.reserved_quantity) <= COALESCE(products.quantity_alert, ?)',
                [$globalLowStock]
            )
            ->count('stocks.id');

        return Inertia::render('Dashboard', [
            'todaySalesCount' => $todaySalesCount,
            'todaySalesDeltaLabel' => $todaySalesDeltaLabel,
            'todaySalesAmount' => $todaySalesAmount,
            'todaySalesAmountDeltaLabel' => $todaySalesAmountDeltaLabel,
            'todayPurchasesCount' => $todayPurchasesCount,
            'todayPurchasesDeltaLabel' => $todayPurchasesDeltaLabel,
            'todayNetProfit' => $todayNetProfit,
            'todayNetProfitDeltaLabel' => $todayNetProfitDeltaLabel,
            'charts' => DashboardCharts::series($effectiveBranchId),
            'employeesPreview' => $employeesPreview,
            'dashboardFilters' => [
                'att_date' => $attDate,
                'att_branch' => $attBranchFilter,
                'pay_month' => $payMonth,
                'pay_year' => $payYear,
            ],
            'filterBranches' => $filterBranches,
            'attendancePreview' => $attendancePreview,
            'payrollPreview' => $payrollPreview,
            'payrollYearOptions' => $payrollYearOptions,
            'lowStockLineCount' => $lowStockLineCount,
            'stocksIndexFilters' => $effectiveBranchId ? ['branch_id' => $effectiveBranchId] : [],
        ]);
    }

    private function netProfitForCompletedSalesBetween(mixed $effectiveBranchId, Carbon $rangeStart, Carbon $rangeEnd): float
    {
        $q = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('product_batches', 'product_batches.id', '=', 'sale_items.product_batch_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$rangeStart, $rangeEnd])
            ->whereNull('sales.deleted_at');

        if ($effectiveBranchId) {
            $q->where('sales.branch_id', $effectiveBranchId);
        }

        return (float) $q->selectRaw(
            'COALESCE(SUM(sale_items.subtotal - (sale_items.quantity * COALESCE(product_batches.cost_price, 0))), 0) as aggregate'
        )->value('aggregate');
    }
}
