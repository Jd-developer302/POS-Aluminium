<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Company\Branch;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'employee_id', 'date_from', 'date_to', 'status', 'q']);

        $attendances = Attendance::query()
            ->with([
                'employee' => function ($q) {
                    $q->select('id', 'employee_id', 'name', 'email', 'branch_id')
                        ->with('branch:id,name');
                },
            ])
            ->when($filters['branch_id'] ?? null, function ($q, $v) {
                $q->whereHas('employee', fn ($qq) => $qq->where('branch_id', $v));
            })
            ->when($filters['employee_id'] ?? null, fn ($q, $v) => $q->where('employee_id', $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('date', '<=', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->whereHas('employee', function ($qq) use ($v) {
                    $qq->where('name', 'like', '%'.$v.'%')
                        ->orWhere('employee_id', 'like', '%'.$v.'%')
                        ->orWhere('email', 'like', '%'.$v.'%');
                });
            })
            ->latest('date')
            ->latest('id')
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

        return Inertia::render('Employee/Attendance/Index', [
            'attendances' => $attendances,
            'employees' => $employees,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'employee_id' => $filters['employee_id'] ?? '',
                'date_from' => $filters['date_from'] ?? '',
                'date_to' => $filters['date_to'] ?? '',
                'status' => $filters['status'] ?? '',
                'q' => $filters['q'] ?? '',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->mergeNullableTimes($request);

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'date' => [
                'required',
                'date',
                Rule::unique('attendances', 'date')
                    ->where('employee_id', (int) $request->input('employee_id')),
            ],
            'check_in' => ['nullable', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i'],
            'working_hours' => ['nullable', 'numeric', 'min:0'],
            'late_minutes' => ['nullable', 'integer', 'min:0'],
            'overtime_minutes' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'in:present,absent,late,leave'],
        ]);

        $validated = $this->normalizeNumericFields($validated);
        $validated['employee_id'] = (int) $validated['employee_id'];

        Attendance::query()->create($validated);

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance recorded.');
    }

    public function update(Request $request, Attendance $attendance): RedirectResponse
    {
        $this->mergeNullableTimes($request);

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'date' => [
                'required',
                'date',
                Rule::unique('attendances', 'date')
                    ->ignore($attendance->id)
                    ->where('employee_id', (int) $request->input('employee_id')),
            ],
            'check_in' => ['nullable', 'date_format:H:i'],
            'check_out' => ['nullable', 'date_format:H:i'],
            'working_hours' => ['nullable', 'numeric', 'min:0'],
            'late_minutes' => ['nullable', 'integer', 'min:0'],
            'overtime_minutes' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'in:present,absent,late,leave'],
        ]);

        $validated = $this->normalizeNumericFields($validated);
        $validated['employee_id'] = (int) $validated['employee_id'];

        $attendance->update($validated);

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance updated.');
    }

    public function destroy(Attendance $attendance): RedirectResponse
    {
        $attendance->delete();

        return redirect()->route('attendances.index')
            ->with('success', 'Attendance removed.');
    }

    private function mergeNullableTimes(Request $request): void
    {
        foreach (['check_in', 'check_out'] as $key) {
            $v = $request->input($key);
            if ($v === '' || $v === null) {
                $request->merge([$key => null]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function normalizeNumericFields(array $validated): array
    {
        $validated['working_hours'] = isset($validated['working_hours']) && $validated['working_hours'] !== ''
            ? (float) $validated['working_hours']
            : 0;
        $validated['late_minutes'] = isset($validated['late_minutes']) && $validated['late_minutes'] !== ''
            ? (int) $validated['late_minutes']
            : 0;
        $validated['overtime_minutes'] = isset($validated['overtime_minutes']) && $validated['overtime_minutes'] !== ''
            ? (int) $validated['overtime_minutes']
            : 0;

        return $validated;
    }
}
