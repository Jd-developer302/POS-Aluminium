<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'employee_id', 'leave_type_id', 'status', 'date_from', 'date_to', 'q']);

        $leaves = Leave::query()
            ->with([
                'employee' => function ($q) {
                    $q->select('id', 'employee_id', 'name', 'branch_id')
                        ->with('branch:id,name');
                },
                'leaveType:id,name,slug',
                'approver:id,name',
            ])
            ->when($filters['branch_id'] ?? null, function ($q, $v) {
                $q->whereHas('employee', fn ($qq) => $qq->where('branch_id', $v));
            })
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->when($filters['leave_type_id'] ?? null, fn ($q, $v) => $q->where('leave_type_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('start_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('end_date', '<=', $v))
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->where(function ($qq) use ($v) {
                    $qq->whereHas('employee', function ($e) use ($v) {
                        $e->where('name', 'like', '%'.$v.'%')
                            ->orWhere('employee_id', 'like', '%'.$v.'%');
                    })->orWhere('reason', 'like', '%'.$v.'%')
                        ->orWhereHas('leaveType', function ($t) use ($v) {
                            $t->where('name', 'like', '%'.$v.'%');
                        });
                });
            })
            ->latest('start_date')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $employees = Employee::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'branch_id']);

        $leaveTypes = LeaveType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'status']);

        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Employee/Leave/Index', [
            'leaves' => $leaves,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'employee_id' => $filters['employee_id'] ?? '',
                'leave_type_id' => $filters['leave_type_id'] ?? '',
                'status' => $filters['status'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
                'q' => $filters['q'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        $employees = Employee::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'branch_id']);

        $leaveTypes = LeaveType::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Employee/Leave/Create', [
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:5000',
        ]);

        $validated['employee_id'] = (int) $validated['employee_id'];
        $validated['leave_type_id'] = (int) $validated['leave_type_id'];
        $validated['total_days'] = $this->inclusiveDayCount(
            $validated['start_date'],
            $validated['end_date']
        );
        $validated['status'] = 'pending';
        $validated['approved_by'] = null;
        $validated['approved_at'] = null;

        Leave::query()->create($validated);

        return redirect()->route('leaves.index')
            ->with('success', 'Leave request submitted.');
    }

    public function edit(Leave $leaf): Response|RedirectResponse
    {
        if ($leaf->status !== 'pending') {
            return redirect()->route('leaves.index')
                ->with('error', 'Only pending requests can be edited.');
        }

        $employees = Employee::query()
            ->where(function ($q) use ($leaf) {
                $q->where('status', 'active')
                    ->orWhere('id', $leaf->employee_id);
            })
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'branch_id', 'status']);

        $leaveTypes = LeaveType::query()
            ->where(function ($q) use ($leaf) {
                $q->where('status', 'active')
                    ->orWhere('id', $leaf->leave_type_id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'status']);

        $leaf->load(['employee', 'leaveType']);

        return Inertia::render('Employee/Leave/Edit', [
            'leave' => $leaf,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function update(Request $request, Leave $leaf): RedirectResponse
    {
        if ($leaf->status !== 'pending') {
            return redirect()->route('leaves.index')
                ->with('error', 'Only pending requests can be updated.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:5000',
        ]);

        $validated['employee_id'] = (int) $validated['employee_id'];
        $validated['leave_type_id'] = (int) $validated['leave_type_id'];
        $validated['total_days'] = $this->inclusiveDayCount(
            $validated['start_date'],
            $validated['end_date']
        );

        $leaf->update($validated);

        return redirect()->route('leaves.index')
            ->with('success', 'Leave request updated.');
    }

    public function destroy(Leave $leaf): RedirectResponse
    {
        if ($leaf->status !== 'pending') {
            return redirect()->route('leaves.index')
                ->with('error', 'Only pending requests can be deleted.');
        }

        $leaf->delete();

        return redirect()->route('leaves.index')
            ->with('success', 'Leave request removed.');
    }

    public function approve(Leave $leaf): RedirectResponse
    {
        if ($leaf->status !== 'pending') {
            return redirect()->route('leaves.index')
                ->with('error', 'This request is not pending.');
        }

        $leaf->update([
            'status' => 'approved',
            'approved_by' => (int) auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('leaves.index')
            ->with('success', 'Leave approved.');
    }

    public function reject(Leave $leaf): RedirectResponse
    {
        if ($leaf->status !== 'pending') {
            return redirect()->route('leaves.index')
                ->with('error', 'This request is not pending.');
        }

        $leaf->update([
            'status' => 'rejected',
            'approved_by' => (int) auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('leaves.index')
            ->with('success', 'Leave rejected.');
    }

    /**
     * Inclusive calendar days between two dates.
     */
    private function inclusiveDayCount(string $start, string $end): int
    {
        $s = Carbon::parse($start)->startOfDay();
        $e = Carbon::parse($end)->startOfDay();

        return (int) $s->diffInDays($e) + 1;
    }
}
