<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\PurchaseInvoice;
use App\Models\Supplier\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $scope = $request->query('scope', 'received');
        if (! is_string($scope) || ! in_array($scope, ['received', 'all'], true)) {
            $scope = 'received';
        }

        $query = PurchaseInvoice::query()
            ->with([
                'supplier:id,name',
                'branch:id,name',
                'warehouse:id,name',
                'creator:id,name',
            ])
            ->withCount('items');

        if ($scope === 'received') {
            $query->whereNotNull('received_at');
        }

        $dateFrom = $request->query('date_from');
        if (is_string($dateFrom) && $dateFrom !== '') {
            $query->whereDate('invoice_date', '>=', $dateFrom);
        }

        $dateTo = $request->query('date_to');
        if (is_string($dateTo) && $dateTo !== '') {
            $query->whereDate('invoice_date', '<=', $dateTo);
        }

        $receivedFrom = $request->query('received_from');
        if (is_string($receivedFrom) && $receivedFrom !== '') {
            $query->whereDate('received_at', '>=', $receivedFrom);
        }

        $receivedTo = $request->query('received_to');
        if (is_string($receivedTo) && $receivedTo !== '') {
            $query->whereDate('received_at', '<=', $receivedTo);
        }

        $branchFilter = $request->query('branch_id');
        if ($branchFilter !== null && $branchFilter !== '') {
            $query->where('branch_id', (int) $branchFilter);
        }

        $supplierFilter = $request->query('supplier_id');
        if ($supplierFilter !== null && $supplierFilter !== '') {
            $query->where('supplier_id', (int) $supplierFilter);
        }

        $statusFilter = $request->query('status');
        if (is_string($statusFilter) && $statusFilter !== '') {
            $query->where('status', $statusFilter);
        }

        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $term = '%'.trim($q).'%';
            $query->where('invoice_number', 'like', $term);
        }

        $documentCount = $query->clone()->count();
        $totalAmount = (float) $query->clone()->sum('total');

        $invoices = $query->clone()
            ->orderByDesc('received_at')
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $suppliers = Supplier::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Purchase/History/Index', [
            'invoices' => $invoices,
            'filters' => [
                'scope' => $scope,
                'date_from' => is_string($dateFrom) ? $dateFrom : '',
                'date_to' => is_string($dateTo) ? $dateTo : '',
                'received_from' => is_string($receivedFrom) ? $receivedFrom : '',
                'received_to' => is_string($receivedTo) ? $receivedTo : '',
                'branch_id' => $branchFilter !== null && $branchFilter !== '' ? (string) $branchFilter : '',
                'supplier_id' => $supplierFilter !== null && $supplierFilter !== '' ? (string) $supplierFilter : '',
                'status' => is_string($statusFilter) ? $statusFilter : '',
                'q' => is_string($q) ? $q : '',
            ],
            'summary' => [
                'document_count' => $documentCount,
                'total_amount' => round($totalAmount, 2),
            ],
            'branches' => $branches,
            'suppliers' => $suppliers,
            'statusOptions' => [
                ['value' => '', 'label' => 'Any status'],
                ['value' => 'draft', 'label' => 'Draft'],
                ['value' => 'received', 'label' => 'Received'],
                ['value' => 'partial', 'label' => 'Partial'],
                ['value' => 'paid', 'label' => 'Paid'],
                ['value' => 'cancelled', 'label' => 'Cancelled'],
            ],
        ]);
    }
}
