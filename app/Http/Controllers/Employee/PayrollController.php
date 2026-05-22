<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Services\Payroll\PayrollAttendanceSnapshotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    public function __construct(
        protected PayrollAttendanceSnapshotService $attendanceSnapshots
    ) {}

    public function attendanceSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $snapshot = $this->attendanceSnapshots->build(
            (int) $validated['employee_id'],
            (int) $validated['year'],
            (int) $validated['month'],
        );

        return response()->json(['snapshot' => $snapshot]);
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'employee_id', 'year', 'month', 'status', 'q']);

        $payrolls = Payroll::query()
            ->select([
                'payrolls.id',
                'payrolls.employee_id',
                'payrolls.month',
                'payrolls.year',
                'payrolls.basic_salary',
                'payrolls.total_allowance',
                'payrolls.total_deduction',
                'payrolls.net_salary',
                'payrolls.status',
                'payrolls.payment_date',
                'payrolls.payment_mode',
                'payrolls.attendance_synced_at',
                'payrolls.created_at',
                'payrolls.updated_at',
            ])
            ->with([
                'employee' => function ($q) {
                    $q->select('id', 'employee_id', 'name', 'branch_id')
                        ->with('branch:id,name');
                },
            ])
            ->when($filters['branch_id'] ?? null, function ($q, $v) {
                $q->whereHas('employee', fn ($qq) => $qq->where('branch_id', $v));
            })
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->when($filters['year'] ?? null, fn ($q, $v) => $q->where('year', $v))
            ->when($filters['month'] ?? null, fn ($q, $v) => $q->where('month', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->whereHas('employee', function ($e) use ($v) {
                    $e->where('name', 'like', '%'.$v.'%')
                        ->orWhere('employee_id', 'like', '%'.$v.'%');
                });
            })
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $employees = Employee::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'branch_id']);

        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $currentYear = (int) now()->format('Y');
        $years = range($currentYear - 2, $currentYear + 1);

        return Inertia::render('Employee/Payroll/Index', [
            'payrolls' => $payrolls,
            'employees' => $employees,
            'branches' => $branches,
            'years' => $years,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'employee_id' => $filters['employee_id'] ?? '',
                'year' => $filters['year'] ?? '',
                'month' => $filters['month'] ?? '',
                'status' => $filters['status'] ?? '',
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
            ->get(['id', 'employee_id', 'name', 'branch_id', 'salary']);

        $y = (int) now()->format('Y');
        $m = (int) now()->format('n');

        return Inertia::render('Employee/Payroll/Create', [
            'employees' => $employees,
            'defaultYear' => $y,
            'defaultMonth' => $m,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->mergeEmptyMoney($request);
        $itemsPayload = $this->coerceItems($request->input('items', []));
        $request->merge(['items' => $itemsPayload]);

        $eid = (int) $request->input('employee_id');
        $m = (int) $request->input('month');
        $y = (int) $request->input('year');

        $validated = $request->validate([
            'employee_id' => [
                'required',
                'exists:employees,id',
                Rule::unique('payrolls', 'employee_id')
                    ->where('month', $m)
                    ->where('year', $y),
            ],
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'basic_salary' => 'required|numeric|min:0',
            'status' => 'required|in:unpaid,processed,paid',
            'payment_date' => 'nullable|date',
            'payment_mode' => [
                'nullable',
                Rule::requiredIf(fn () => $request->input('status') === 'paid'),
                'in:cash,bank,cheque',
            ],
            'items' => 'array',
            'items.*.type' => 'required|in:allowance,deduction',
            'items.*.name' => 'required|string|max:255',
            'items.*.amount' => 'required|numeric|min:0',
        ]);

        $validated['employee_id'] = $eid;
        $validated['month'] = $m;
        $validated['year'] = $y;
        if (($validated['status'] ?? '') !== 'paid') {
            $validated['payment_mode'] = null;
        }
        [$ta, $td] = $this->totalsFromItems($validated['items'] ?? []);
        $validated['total_allowance'] = $ta;
        $validated['total_deduction'] = $td;
        $validated['net_salary'] = $this->computeNet(
            (float) $validated['basic_salary'],
            $ta,
            $td
        );
        if (empty($validated['payment_date'] ?? null)) {
            $validated['payment_date'] = null;
        }

        $validated['attendance_snapshot'] = $this->attendanceSnapshots->build($eid, $y, $m);
        $validated['attendance_synced_at'] = now();

        DB::transaction(function () use ($validated) {
            $rows = $validated['items'] ?? [];
            unset($validated['items']);
            $payroll = Payroll::query()->create($validated);
            foreach ($rows as $row) {
                $payroll->items()->create([
                    'type' => $row['type'],
                    'name' => $row['name'],
                    'amount' => $row['amount'],
                ]);
            }
        });

        return redirect()->route('payrolls.index')
            ->with('success', 'Payroll record saved.');
    }

    public function edit(Payroll $payroll): Response
    {
        $employees = Employee::query()
            ->where(function ($q) use ($payroll) {
                $q->where('status', 'active')
                    ->orWhere('id', $payroll->employee_id);
            })
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'branch_id', 'status', 'salary']);

        $payroll->load(['employee', 'items']);

        return Inertia::render('Employee/Payroll/Edit', [
            'payroll' => $payroll,
            'employees' => $employees,
        ]);
    }

    public function update(Request $request, Payroll $payroll): RedirectResponse
    {
        $this->mergeEmptyMoney($request);
        $itemsPayload = $this->coerceItems($request->input('items', []));
        $request->merge(['items' => $itemsPayload]);

        $eid = (int) $request->input('employee_id');
        $m = (int) $request->input('month');
        $y = (int) $request->input('year');

        $validated = $request->validate([
            'employee_id' => [
                'required',
                'exists:employees,id',
                Rule::unique('payrolls', 'employee_id')
                    ->ignore($payroll->id)
                    ->where('month', $m)
                    ->where('year', $y),
            ],
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000|max:2100',
            'basic_salary' => 'required|numeric|min:0',
            'status' => 'required|in:unpaid,processed,paid',
            'payment_date' => 'nullable|date',
            'payment_mode' => [
                'nullable',
                Rule::requiredIf(fn () => $request->input('status') === 'paid'),
                'in:cash,bank,cheque',
            ],
            'items' => 'array',
            'items.*.type' => 'required|in:allowance,deduction',
            'items.*.name' => 'required|string|max:255',
            'items.*.amount' => 'required|numeric|min:0',
        ]);

        $validated['employee_id'] = $eid;
        $validated['month'] = $m;
        $validated['year'] = $y;
        if (($validated['status'] ?? '') !== 'paid') {
            $validated['payment_mode'] = null;
        }
        [$ta, $td] = $this->totalsFromItems($validated['items'] ?? []);
        $validated['total_allowance'] = $ta;
        $validated['total_deduction'] = $td;
        $validated['net_salary'] = $this->computeNet(
            (float) $validated['basic_salary'],
            $ta,
            $td
        );
        if (empty($validated['payment_date'] ?? null)) {
            $validated['payment_date'] = null;
        }

        $validated['attendance_snapshot'] = $this->attendanceSnapshots->build($eid, $y, $m);
        $validated['attendance_synced_at'] = now();

        DB::transaction(function () use ($payroll, $validated) {
            $rows = $validated['items'] ?? [];
            unset($validated['items']);
            PayrollItem::query()->where('payroll_id', $payroll->id)->forceDelete();
            $payroll->update($validated);
            foreach ($rows as $row) {
                $payroll->items()->create([
                    'type' => $row['type'],
                    'name' => $row['name'],
                    'amount' => $row['amount'],
                ]);
            }
        });

        return redirect()->route('payrolls.index')
            ->with('success', 'Payroll updated.');
    }

    public function destroy(Payroll $payroll): RedirectResponse
    {
        $payroll->delete();

        return redirect()->route('payrolls.index')
            ->with('success', 'Payroll removed.');
    }

    private function mergeEmptyMoney(Request $request): void
    {
        if ($request->input('payment_date') === '') {
            $request->merge(['payment_date' => null]);
        }
        if ($request->input('payment_mode') === '') {
            $request->merge(['payment_mode' => null]);
        }
    }

    /**
     * @return array<int, array{type: string, name: string, amount: float}>
     */
    private function coerceItems(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $out = [];
        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }
            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue;
            }
            $type = (string) ($row['type'] ?? 'allowance');
            if (! in_array($type, ['allowance', 'deduction'], true)) {
                $type = 'allowance';
            }
            $out[] = [
                'type' => $type,
                'name' => $name,
                'amount' => (float) ($row['amount'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * @param  array<int, array{type: string, name: string, amount: float}>  $items
     * @return array{0: float, 1: float}
     */
    private function totalsFromItems(array $items): array
    {
        $allow = 0.0;
        $ded = 0.0;
        foreach ($items as $row) {
            $amt = (float) ($row['amount'] ?? 0);
            if (($row['type'] ?? '') === 'deduction') {
                $ded += $amt;
            } else {
                $allow += $amt;
            }
        }

        return [round($allow, 2), round($ded, 2)];
    }

    private function computeNet(float $basic, float $allowance, float $deduction): string
    {
        $n = $basic + $allowance - $deduction;

        return number_format(max(0, $n), 2, '.', '');
    }
}
