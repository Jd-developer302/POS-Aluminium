<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LeaveTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'q']);

        $leaveTypes = LeaveType::query()
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->where(function ($qq) use ($v) {
                    $qq->where('name', 'like', '%'.$v.'%')
                        ->orWhere('slug', 'like', '%'.$v.'%');
                });
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Employee/LeaveType/Index', [
            'leaveTypes' => $leaveTypes,
            'filters' => [
                'status' => $filters['status'] ?? '',
                'q' => $filters['q'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Employee/LeaveType/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'days_per_year' => 'required|integer|min:0',
            'is_paid' => 'required|boolean',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['slug'] = $this->uniqueSlug($validated['name']);

        LeaveType::query()->create($validated);

        return redirect()->route('leave-types.index')
            ->with('success', 'Leave type created successfully.');
    }

    public function edit(LeaveType $leave_type): Response
    {
        return Inertia::render('Employee/LeaveType/Edit', [
            'leaveType' => $leave_type,
        ]);
    }

    public function update(Request $request, LeaveType $leave_type): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'days_per_year' => 'required|integer|min:0',
            'is_paid' => 'required|boolean',
            'status' => 'required|in:active,inactive',
        ]);

        $slug = $this->uniqueSlug($validated['name'], $leave_type->id);
        $leave_type->update([...$validated, 'slug' => $slug]);

        return redirect()->route('leave-types.index')
            ->with('success', 'Leave type updated successfully.');
    }

    public function destroy(LeaveType $leave_type): RedirectResponse
    {
        $leave_type->delete();

        return redirect()->route('leave-types.index')
            ->with('success', 'Leave type deleted successfully.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'leave-type';
        $slug = $base;
        $n = 2;
        while (true) {
            $q = LeaveType::query()->withTrashed()->where('slug', $slug);
            if ($ignoreId !== null) {
                $q->where('id', '!=', $ignoreId);
            }
            if (! $q->exists()) {
                return $slug;
            }
            $slug = $base.'-'.$n;
            $n++;
        }
    }
}
