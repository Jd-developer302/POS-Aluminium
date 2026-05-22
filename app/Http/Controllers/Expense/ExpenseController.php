<?php

namespace App\Http\Controllers\Expense;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $sessionBranchId = $request->session()->get('current_branch_id');

        if ($user && $user->hasRole('Super Admin')) {
            $defaultBranchId = $sessionBranchId;
        } elseif ($user && $user->branch_id) {
            $defaultBranchId = $user->branch_id;
        } else {
            $defaultBranchId = $sessionBranchId;
        }

        $requested = $request->query('branch_id');
        $requestedStr = is_string($requested)
            ? trim($requested)
            : (is_numeric($requested) ? (string) (int) $requested : '');

        $isSuperAdmin = $user && $user->hasRole('Super Admin');

        if ($requestedStr === 'all' && $isSuperAdmin) {
            $scopedBranchId = null;
            $filterBranchId = 'all';
        } elseif ($requestedStr !== '') {
            $id = (int) $requestedStr;
            $branchOk = Branch::query()->where('status', 'active')->whereKey($id)->exists();
            if (! $branchOk) {
                $scopedBranchId = $defaultBranchId;
                $filterBranchId = '';
            } elseif ($isSuperAdmin) {
                $scopedBranchId = $id;
                $filterBranchId = (string) $id;
            } elseif ($user && $user->branch_id && (int) $user->branch_id !== $id) {
                $scopedBranchId = (int) $user->branch_id;
                $filterBranchId = (string) (int) $user->branch_id;
            } else {
                $scopedBranchId = $id;
                $filterBranchId = (string) $id;
            }
        } else {
            $scopedBranchId = $defaultBranchId;
            $filterBranchId = '';
        }

        $expensesQuery = Expense::with(['branch', 'category', 'createdBy'])
            ->latest('expense_date')
            ->when($scopedBranchId, fn ($q) => $q->where('branch_id', $scopedBranchId));

        $expenses = $expensesQuery->paginate(15)->withQueryString();

        $now = Carbon::now();

        $todayStr = $now->toDateString();
        // Week runs Sunday → Saturday (same calendar week as the current date).
        $weekStartAt = $now->copy()->startOfWeek(Carbon::SUNDAY);
        $weekEndAt = $weekStartAt->copy()->addDays(6);
        $weekStart = $weekStartAt->toDateString();
        $weekEnd = $weekEndAt->toDateString();
        $monthStart = $now->copy()->startOfMonth()->toDateString();
        $monthEnd = $now->copy()->endOfMonth()->toDateString();

        $branchScope = fn ($q) => $q->when($scopedBranchId, fn ($qq) => $qq->where('branch_id', $scopedBranchId));

        $expenseTotals = [
            'today' => (float) Expense::query()
                ->tap($branchScope)
                ->whereDate('expense_date', $todayStr)
                ->sum('amount'),
            'week' => (float) Expense::query()
                ->tap($branchScope)
                ->whereBetween('expense_date', [$weekStart, $weekEnd])
                ->sum('amount'),
            'month' => (float) Expense::query()
                ->tap($branchScope)
                ->whereBetween('expense_date', [$monthStart, $monthEnd])
                ->sum('amount'),
            'today_label' => $now->translatedFormat('M j, Y'),
            'week_label' => $weekStartAt->translatedFormat('M j')
                .' – '
                .$weekEndAt->translatedFormat('M j, Y'),
            'month_label' => $now->translatedFormat('F Y'),
        ];

        $branchesQuery = Branch::query()
            ->where('status', 'active')
            ->orderBy('name');

        if ($user && ! $isSuperAdmin && $user->branch_id) {
            $branchesQuery->whereKey($user->branch_id);
        }

        $branches = $branchesQuery->get(['id', 'name']);

        $scopedBranchName = $scopedBranchId
            ? ($branches->firstWhere('id', $scopedBranchId)?->name
                ?? Branch::query()->whereKey($scopedBranchId)->value('name'))
            : null;

        return Inertia::render('Expense/Index', [
            'expenses' => $expenses,
            'expenseTotals' => $expenseTotals,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $filterBranchId,
            ],
            'expenseBranchScope' => [
                'is_super_admin' => (bool) $isSuperAdmin,
                'scoped_branch_id' => $scopedBranchId,
                'scoped_branch_name' => $scopedBranchName,
            ],
        ]);
    }

    /**
     * Show the form for creating a new expense.
     */
    public function create()
    {
        $branches = Branch::where('status', 'active')->get();
        $categories = ExpenseCategory::where('status', 'active')->get();

        return Inertia::render('Expense/Create', [
            'branches' => $branches,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created expense in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $validated['created_by'] = $request->user()->id;

        Expense::create($validated);

        return redirect()->route('expenses.index')
            ->with('success', 'Expense created successfully.');
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense)
    {
        $expense->load(['branch', 'category', 'createdBy']);

        return Inertia::render('Expense/Show', [
            'expense' => $expense,
        ]);
    }

    /**
     * Show the form for editing the specified expense.
     */
    public function edit(Expense $expense)
    {
        $branches = Branch::where('status', 'active')->get();
        $categories = ExpenseCategory::where('status', 'active')->get();

        return Inertia::render('Expense/Edit', [
            'expense' => $expense,
            'branches' => $branches,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified expense in storage.
     */
    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $expense->update($validated);

        return redirect()->route('expenses.index')
            ->with('success', 'Expense updated successfully.');
    }

    /**
     * Remove the specified expense from storage.
     */
    public function destroy(Expense $expense)
    {
        $expense->delete();

        return redirect()->route('expenses.index')
            ->with('success', 'Expense deleted successfully.');
    }
}
