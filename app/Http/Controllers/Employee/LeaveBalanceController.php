<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaveBalanceController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'employee_id', 'leave_type_id', 'q']);

        $leaveBalances = LeaveBalance::query()
            ->with([
                'employee' => function ($q) {
                    $q->select('id', 'employee_id', 'name', 'branch_id')
                        ->with('branch:id,name');
                },
                'leaveType' => function ($q) {
                    $q->select('id', 'name', 'slug', 'is_paid');
                },
            ])
            ->when($filters['branch_id'] ?? null, function ($q, $v) {
                $q->whereHas('employee', fn ($qq) => $qq->where('branch_id', $v));
            })
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->when($filters['leave_type_id'] ?? null, fn ($q, $v) => $q->where('leave_type_id', $v))
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->where(function ($qq) use ($v) {
                    $qq->whereHas('employee', function ($e) use ($v) {
                        $e->where('name', 'like', '%'.$v.'%')
                            ->orWhere('employee_id', 'like', '%'.$v.'%');
                    })->orWhereHas('leaveType', function ($t) use ($v) {
                        $t->where('name', 'like', '%'.$v.'%');
                    });
                });
            })
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

        return Inertia::render('Employee/LeaveBalance/Index', [
            'leaveBalances' => $leaveBalances,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'employee_id' => $filters['employee_id'] ?? '',
                'leave_type_id' => $filters['leave_type_id'] ?? '',
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
            ->get(['id', 'name', 'slug', 'days_per_year']);

        return Inertia::render('Employee/LeaveBalance/Create', [
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $eid = (int) $request->input('employee_id');
        $ltid = (int) $request->input('leave_type_id');

        $validated = $request->validate([
            'employee_id' => [
                'required',
                'exists:employees,id',
                Rule::unique('leave_balances', 'employee_id')
                    ->where('leave_type_id', $ltid),
            ],
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'total_days' => 'required|integer|min:0',
            'used_days' => 'required|integer|min:0|lte:total_days',
        ]);

        $validated['employee_id'] = $eid;
        $validated['leave_type_id'] = $ltid;

        LeaveBalance::query()->create($validated);

        return redirect()->route('leave-balances.index')
            ->with('success', 'Leave balance created successfully.');
    }

    public function edit(LeaveBalance $leave_balance): Response
    {
        $employees = Employee::query()
            ->where(function ($q) use ($leave_balance) {
                $q->where('status', 'active')
                    ->orWhere('id', $leave_balance->employee_id);
            })
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'branch_id', 'status']);

        $leaveTypes = LeaveType::query()
            ->where(function ($q) use ($leave_balance) {
                $q->where('status', 'active')
                    ->orWhere('id', $leave_balance->leave_type_id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'days_per_year', 'status']);

        $leave_balance->load(['employee', 'leaveType']);

        return Inertia::render('Employee/LeaveBalance/Edit', [
            'leaveBalance' => $leave_balance,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function update(Request $request, LeaveBalance $leave_balance): RedirectResponse
    {
        $eid = (int) $request->input('employee_id');
        $ltid = (int) $request->input('leave_type_id');

        $validated = $request->validate([
            'employee_id' => [
                'required',
                'exists:employees,id',
                Rule::unique('leave_balances', 'employee_id')
                    ->ignore($leave_balance->id)
                    ->where('leave_type_id', $ltid),
            ],
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'total_days' => 'required|integer|min:0',
            'used_days' => 'required|integer|min:0|lte:total_days',
        ]);

        $validated['employee_id'] = $eid;
        $validated['leave_type_id'] = $ltid;

        $leave_balance->update($validated);

        return redirect()->route('leave-balances.index')
            ->with('success', 'Leave balance updated successfully.');
    }

    public function destroy(LeaveBalance $leave_balance): RedirectResponse
    {
        $leave_balance->delete();

        return redirect()->route('leave-balances.index')
            ->with('success', 'Leave balance removed successfully.');
    }
}
