<?php

namespace App\Support;

use App\Models\PurchaseInvoice;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class DashboardCharts
{
    /**
     * @return array{sales: array<string, list<array{label: string, value: float}>>, purchases: array<string, list<array{label: string, value: float}>>}
     */
    public static function series(?int $branchId): array
    {
        $salesRows = self::salesRows($branchId);
        $purchaseRows = self::purchaseRows($branchId);

        return [
            'sales' => [
                'daily' => self::buildDailyFromSales($salesRows),
                'weekly' => self::buildWeeklyFromSales($salesRows),
                'monthly' => self::buildMonthlyFromSales($salesRows),
                'yearly' => self::buildYearlyFromSales($salesRows),
            ],
            'purchases' => [
                'daily' => self::buildDailyFromPurchases($purchaseRows),
                'weekly' => self::buildWeeklyFromPurchases($purchaseRows),
                'monthly' => self::buildMonthlyFromPurchases($purchaseRows),
                'yearly' => self::buildYearlyFromPurchases($purchaseRows),
            ],
        ];
    }

    /**
     * @return Collection<int, Sale>
     */
    private static function salesRows(?int $branchId): Collection
    {
        $q = Sale::query()
            ->where('status', 'completed')
            ->where('sale_date', '>=', now()->copy()->subYears(6)->startOfYear());

        if ($branchId) {
            $q->where('branch_id', $branchId);
        }

        return $q->get(['sale_date', 'total']);
    }

    /**
     * @return Collection<int, PurchaseInvoice>
     */
    private static function purchaseRows(?int $branchId): Collection
    {
        $q = PurchaseInvoice::query()
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->where('invoice_date', '>=', now()->copy()->subYears(6)->startOfYear());

        if ($branchId) {
            $q->where('branch_id', $branchId);
        }

        return $q->get(['invoice_date', 'total']);
    }

    /**
     * @param  Collection<int, Sale>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildDailyFromSales(Collection $rows): array
    {
        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();

        $byDay = $rows->groupBy(fn (Sale $s) => $s->sale_date->format('Y-m-d'));

        $out = [];
        for ($d = $monthStart->copy(); $d->lte($monthEnd); $d->addDay()) {
            $key = $d->format('Y-m-d');
            $sum = $byDay->get($key)?->sum('total') ?? 0;
            $out[] = [
                'label' => $d->format('d M'),
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, PurchaseInvoice>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildDailyFromPurchases(Collection $rows): array
    {
        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();

        $byDay = $rows->groupBy(fn (PurchaseInvoice $p) => $p->invoice_date->format('Y-m-d'));

        $out = [];
        for ($d = $monthStart->copy(); $d->lte($monthEnd); $d->addDay()) {
            $key = $d->format('Y-m-d');
            $sum = $byDay->get($key)?->sum('total') ?? 0;
            $out[] = [
                'label' => $d->format('d M'),
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, Sale>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildWeeklyFromSales(Collection $rows): array
    {
        $end = now()->copy()->endOfWeek(Carbon::SUNDAY);
        $start = now()->copy()->subWeeks(11)->startOfWeek(Carbon::MONDAY);

        $filtered = $rows->filter(fn (Sale $s) => $s->sale_date->between($start, $end));

        $byWeek = $filtered->groupBy(
            fn (Sale $s) => $s->sale_date->copy()->startOfWeek(Carbon::MONDAY)->format('Y-m-d')
        );

        $out = [];
        for ($w = $start->copy(); $w->lte($end); $w->addWeek()) {
            $key = $w->format('Y-m-d');
            $sum = $byWeek->get($key)?->sum('total') ?? 0;
            $out[] = [
                'label' => $w->format('d M'),
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, PurchaseInvoice>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildWeeklyFromPurchases(Collection $rows): array
    {
        $end = now()->copy()->endOfWeek(Carbon::SUNDAY);
        $start = now()->copy()->subWeeks(11)->startOfWeek(Carbon::MONDAY);

        $filtered = $rows->filter(function (PurchaseInvoice $p) use ($start, $end) {
            $d = $p->invoice_date->copy()->startOfDay();

            return $d->between($start->copy()->startOfDay(), $end->copy()->endOfDay());
        });

        $byWeek = $filtered->groupBy(
            fn (PurchaseInvoice $p) => $p->invoice_date->copy()->startOfWeek(Carbon::MONDAY)->format('Y-m-d')
        );

        $out = [];
        for ($w = $start->copy(); $w->lte($end); $w->addWeek()) {
            $key = $w->format('Y-m-d');
            $sum = $byWeek->get($key)?->sum('total') ?? 0;
            $out[] = [
                'label' => $w->format('d M'),
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, Sale>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildMonthlyFromSales(Collection $rows): array
    {
        $end = now()->copy()->startOfMonth();
        $start = now()->copy()->subMonths(11)->startOfMonth();
        $rangeEnd = now()->copy()->endOfMonth();

        $filtered = $rows->filter(fn (Sale $s) => $s->sale_date->between($start, $rangeEnd));

        $byMonth = $filtered->groupBy(fn (Sale $s) => $s->sale_date->format('Y-m'));

        $out = [];
        for ($m = $start->copy(); $m->lte($end); $m->addMonth()) {
            $key = $m->format('Y-m');
            $sum = $byMonth->get($key)?->sum('total') ?? 0;
            $out[] = [
                'label' => $m->format('M Y'),
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, PurchaseInvoice>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildMonthlyFromPurchases(Collection $rows): array
    {
        $end = now()->copy()->startOfMonth();
        $start = now()->copy()->subMonths(11)->startOfMonth();
        $rangeEnd = now()->copy()->endOfMonth();

        $filtered = $rows->filter(fn (PurchaseInvoice $p) => $p->invoice_date->between($start, $rangeEnd));

        $byMonth = $filtered->groupBy(fn (PurchaseInvoice $p) => $p->invoice_date->format('Y-m'));

        $out = [];
        for ($m = $start->copy(); $m->lte($end); $m->addMonth()) {
            $key = $m->format('Y-m');
            $sum = $byMonth->get($key)?->sum('total') ?? 0;
            $out[] = [
                'label' => $m->format('M Y'),
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, Sale>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildYearlyFromSales(Collection $rows): array
    {
        $endYear = now()->year;
        $startYear = $endYear - 4;

        $byYear = $rows->groupBy(fn (Sale $s) => $s->sale_date->year);

        $out = [];
        for ($y = $startYear; $y <= $endYear; $y++) {
            $sum = $byYear->get($y)?->sum('total') ?? 0;
            $out[] = [
                'label' => (string) $y,
                'value' => (float) $sum,
            ];
        }

        return $out;
    }

    /**
     * @param  Collection<int, PurchaseInvoice>  $rows
     * @return list<array{label: string, value: float}>
     */
    private static function buildYearlyFromPurchases(Collection $rows): array
    {
        $endYear = now()->year;
        $startYear = $endYear - 4;

        $byYear = $rows->groupBy(fn (PurchaseInvoice $p) => $p->invoice_date->year);

        $out = [];
        for ($y = $startYear; $y <= $endYear; $y++) {
            $sum = $byYear->get($y)?->sum('total') ?? 0;
            $out[] = [
                'label' => (string) $y,
                'value' => (float) $sum,
            ];
        }

        return $out;
    }
}
