<?php

namespace App\Http\Controllers\Sale;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Sale;
use App\Models\Supplier\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $scope = $request->query('scope', 'completed');
        if (! is_string($scope) || ! in_array($scope, ['completed', 'all'], true)) {
            $scope = 'completed';
        }

        $query = Sale::query()
            ->with([
                'customer:id,name',
                'branch:id,name',
                'warehouse:id,name',
                'creator:id,name',
            ])
            ->withCount('items');

        if ($scope === 'completed') {
            $query->where('status', 'completed');
        }

        $dateFrom = $request->query('date_from');
        if (is_string($dateFrom) && $dateFrom !== '') {
            $query->whereDate('sale_date', '>=', $dateFrom);
        }

        $dateTo = $request->query('date_to');
        if (is_string($dateTo) && $dateTo !== '') {
            $query->whereDate('sale_date', '<=', $dateTo);
        }

        $branchFilter = $request->query('branch_id');
        if ($branchFilter !== null && $branchFilter !== '') {
            $query->where('branch_id', (int) $branchFilter);
        }

        $warehouseFilter = $request->query('warehouse_id');
        if ($warehouseFilter !== null && $warehouseFilter !== '') {
            $query->where('warehouse_id', (int) $warehouseFilter);
        }

        $customerFilter = $request->query('customer_id');
        if ($customerFilter !== null && $customerFilter !== '') {
            $query->where('customer_id', (int) $customerFilter);
        }

        $statusFilter = $request->query('status');
        if (is_string($statusFilter) && $statusFilter !== '') {
            $query->where('status', $statusFilter);
        }

        $paymentFilter = $request->query('payment_status');
        if (is_string($paymentFilter) && $paymentFilter !== '') {
            $query->where('payment_status', $paymentFilter);
        }

        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $term = '%'.trim($q).'%';
            $query->where('sale_number', 'like', $term);
        }

        $documentCount = $query->clone()->count();
        $totalAmount = (float) $query->clone()->sum('total');

        $sales = $query->clone()
            ->orderByDesc('sale_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $warehouses = Warehouse::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        $customers = Customer::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'name']);

        return Inertia::render('Sale/History/Index', [
            'sales' => $sales,
            'filters' => [
                'scope' => $scope,
                'date_from' => is_string($dateFrom) ? $dateFrom : '',
                'date_to' => is_string($dateTo) ? $dateTo : '',
                'branch_id' => $branchFilter !== null && $branchFilter !== '' ? (string) $branchFilter : '',
                'warehouse_id' => $warehouseFilter !== null && $warehouseFilter !== '' ? (string) $warehouseFilter : '',
                'customer_id' => $customerFilter !== null && $customerFilter !== '' ? (string) $customerFilter : '',
                'status' => is_string($statusFilter) ? $statusFilter : '',
                'payment_status' => is_string($paymentFilter) ? $paymentFilter : '',
                'q' => is_string($q) ? $q : '',
            ],
            'summary' => [
                'document_count' => $documentCount,
                'total_amount' => round($totalAmount, 2),
            ],
            'branches' => $branches,
            'warehouses' => $warehouses,
            'customers' => $customers,
            'statusOptions' => [
                ['value' => '', 'label' => 'Any status'],
                ['value' => 'draft', 'label' => 'Draft'],
                ['value' => 'completed', 'label' => 'Completed'],
                ['value' => 'cancelled', 'label' => 'Cancelled'],
                ['value' => 'returned', 'label' => 'Returned'],
            ],
            'paymentStatusOptions' => [
                ['value' => '', 'label' => 'Any payment'],
                ['value' => 'unpaid', 'label' => 'Unpaid'],
                ['value' => 'partial', 'label' => 'Partial'],
                ['value' => 'paid', 'label' => 'Paid'],
            ],
        ]);
    }
}
