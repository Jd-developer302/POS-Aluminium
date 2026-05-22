<?php

namespace App\Http\Controllers\Expense\Category;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of expense categories.
     */
    public function index()
    {
        $categories = ExpenseCategory::withCount('expenses')
            ->latest()
            ->paginate(15);

        return Inertia::render('Expense/Category/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create()
    {
        return Inertia::render('Expense/Category/Create');
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        ExpenseCategory::create($validated);

        return redirect()->route('expense-categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(ExpenseCategory $expenseCategory)
    {
        return Inertia::render('Expense/Category/Edit', [
            'category' => $expenseCategory,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:expense_categories,name,'.$expenseCategory->id,
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $expenseCategory->update($validated);

        return redirect()->route('expense-categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(ExpenseCategory $expenseCategory)
    {
        if ($expenseCategory->expenses()->exists()) {
            return redirect()->route('expense-categories.index')
                ->with('error', 'Cannot delete category with associated expenses.');
        }

        $expenseCategory->delete();

        return redirect()->route('expense-categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
