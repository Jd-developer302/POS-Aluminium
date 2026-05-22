<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\User;
use App\Services\Employee\EmployeeCodeGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'department_id', 'designation_id', 'status', 'q']);

        $employees = Employee::query()
            ->with([
                'branch:id,name',
                'department:id,name',
                'designation:id,name',
                'user' => function ($q) {
                    $q->select('id', 'name', 'email')
                        ->with(['roles' => fn ($r) => $r->orderBy('name')]);
                },
            ])
            ->when($filters['branch_id'] ?? null, fn ($q, $v) => $q->where('branch_id', $v))
            ->when($filters['department_id'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
            ->when($filters['designation_id'] ?? null, fn ($q, $v) => $q->where('designation_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['q'] ?? null, function ($q, $v) {
                $q->where(function ($qq) use ($v) {
                    $qq->where('name', 'like', '%'.$v.'%')
                        ->orWhere('email', 'like', '%'.$v.'%')
                        ->orWhere('employee_id', 'like', '%'.$v.'%')
                        ->orWhere('phone', 'like', '%'.$v.'%');
                });
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $departments = Department::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        $designations = Designation::query()
            ->where('status', 'active')
            ->with('department:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'department_id']);

        return Inertia::render('Employee/Employee/Index', [
            'employees' => $employees,
            'branches' => $branches,
            'departments' => $departments,
            'designations' => $designations,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'department_id' => $filters['department_id'] ?? '',
                'designation_id' => $filters['designation_id'] ?? '',
                'status' => $filters['status'] ?? '',
                'q' => $filters['q'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Employee/Employee/Create', $this->formSharedData(null, includeAssignableRoles: true));
    }

    public function store(Request $request, EmployeeCodeGenerator $employeeCodeGenerator): RedirectResponse
    {
        $this->mergeNullableSalary($request);
        $this->prepareEmployeeIdInput($request);

        $assignableNames = $this->assignableRoleNames();

        $rules = [
            'app_roles' => ['required', 'array', 'min:1'],
            'app_roles.*' => [Rule::in($assignableNames)],
            'branch_id' => 'required|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'employee_id' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('employees', 'employee_id'),
            ],
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('employees', 'email'),
                Rule::unique('users', 'email'),
            ],
            'phone' => 'nullable|string|max:50',
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'user_id' => ['nullable'],
            'photo' => 'nullable|image|max:4096',
            'salary' => 'nullable|numeric|min:0',
            'joining_date' => 'required|date',
            'gender' => 'nullable|in:male,female,other',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive,terminated',
        ];

        $validated = $request->validate($rules);

        $appRoles = $validated['app_roles'];
        $aligned = $this->alignOrgFields($validated);
        if ($aligned instanceof RedirectResponse) {
            return $aligned;
        }
        $validated = $aligned;

        unset($validated['app_roles'], $validated['password'], $validated['password_confirmation'], $validated['user_id']);

        if (empty($validated['employee_id'])) {
            $validated['employee_id'] = $employeeCodeGenerator->next();
        }

        $uploaded = $request->file('photo');
        if ($uploaded?->isValid()) {
            $validated['photo'] = $uploaded->store('employees/photos', 'public');
        } else {
            unset($validated['photo']);
        }

        DB::transaction(function () use ($request, $validated, $appRoles) {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'branch_id' => (int) $validated['branch_id'],
                'password' => (string) $request->input('password'),
            ]);
            $user->syncRoles($appRoles);
            $validated['user_id'] = $user->id;
            $validated['slug'] = $this->uniqueEmployeeSlug($validated['name']);
            Employee::query()->create($validated);
        });

        return redirect()->route('employees.index')
            ->with('success', 'Employee created successfully.');
    }

    private function prepareEmployeeIdInput(Request $request): void
    {
        $raw = $request->input('employee_id');
        if ($raw === null || (is_string($raw) && trim($raw) === '')) {
            $request->merge(['employee_id' => null]);
        } elseif (is_string($raw)) {
            $request->merge(['employee_id' => trim($raw)]);
        }
    }

    public function edit(Employee $employee): Response
    {
        return Inertia::render('Employee/Employee/Edit', array_merge(
            $this->formSharedData($employee, includeAssignableRoles: true),
            [
                'employee' => $employee->load([
                    'branch:id,name',
                    'department:id,name,branch_id',
                    'designation:id,name,department_id',
                    'user' => function ($q) {
                        $q->select('id', 'name', 'email')
                            ->with(['roles' => fn ($r) => $r->orderBy('name')]);
                    },
                ]),
            ]
        ));
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $this->mergeNullableSalary($request);

        $assignableNames = $this->assignableRoleNames();

        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'user_id' => [
                'nullable',
                'exists:users,id',
                Rule::unique('employees', 'user_id')->ignore($employee->id),
            ],
            'employee_id' => [
                'required',
                'string',
                'max:100',
                Rule::unique('employees', 'employee_id')->ignore($employee->id),
            ],
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('employees', 'email')->ignore($employee->id),
            ],
            'phone' => 'nullable|string|max:50',
            'photo' => 'nullable|image|max:4096',
            'remove_photo' => 'nullable|boolean',
            'salary' => 'nullable|numeric|min:0',
            'joining_date' => 'required|date',
            'gender' => 'nullable|in:male,female,other',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive,terminated',
            'app_roles' => ['required', 'array', 'min:1'],
            'app_roles.*' => [Rule::in($assignableNames)],
        ]);

        $appRoles = $validated['app_roles'];
        unset($validated['app_roles']);

        $aligned = $this->alignOrgFields($validated);
        if ($aligned instanceof RedirectResponse) {
            return $aligned;
        }
        $validated = $aligned;

        $removePhoto = $request->boolean('remove_photo');
        $uploaded = $request->file('photo');

        if ($uploaded?->isValid()) {
            if ($employee->photo && str_starts_with($employee->photo, 'employees/')) {
                Storage::disk('public')->delete($employee->photo);
            }
            $validated['photo'] = $uploaded->store('employees/photos', 'public');
        } elseif ($removePhoto) {
            if ($employee->photo && str_starts_with($employee->photo, 'employees/')) {
                Storage::disk('public')->delete($employee->photo);
            }
            $validated['photo'] = null;
        } else {
            unset($validated['photo']);
        }

        unset($validated['remove_photo']);

        if (($validated['name'] ?? '') !== $employee->name) {
            $validated['slug'] = $this->uniqueEmployeeSlug($validated['name'], (int) $employee->id);
        }

        $targetUserId = (int) ($validated['user_id'] ?? $employee->user_id);
        if ($targetUserId === 0) {
            $targetUserId = (int) $employee->user_id;
        }

        DB::transaction(function () use ($employee, $validated, $appRoles, $targetUserId) {
            $employee->update($validated);
            if ($targetUserId > 0) {
                $u = User::query()->findOrFail($targetUserId);
                $this->syncUserFormRoles($u, $appRoles);
            }
        });

        return redirect()->route('employees.index')
            ->with('success', 'Employee updated successfully.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        if ($employee->photo && str_starts_with($employee->photo, 'employees/')) {
            Storage::disk('public')->delete($employee->photo);
        }

        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee deleted successfully.');
    }

    private function mergeNullableSalary(Request $request): void
    {
        $s = $request->input('salary');
        if ($s === '' || $s === null) {
            $request->merge(['salary' => null]);
        }
    }

    /**
     * @return array<string, mixed>|RedirectResponse
     */
    private function alignOrgFields(array $validated)
    {
        foreach (['department_id', 'designation_id', 'user_id'] as $key) {
            if (array_key_exists($key, $validated) && $validated[$key] === '') {
                $validated[$key] = null;
            }
        }

        foreach (['gender', 'birth_date', 'address', 'phone', 'salary'] as $key) {
            if (array_key_exists($key, $validated) && $validated[$key] === '') {
                $validated[$key] = null;
            }
        }

        $branchId = (int) $validated['branch_id'];
        $departmentId = $validated['department_id'] ?? null;

        if ($departmentId) {
            $dept = Department::query()->find((int) $departmentId);
            if (! $dept || (int) $dept->branch_id !== $branchId) {
                return back()
                    ->withErrors(['department_id' => 'Department must belong to the selected branch.'])
                    ->withInput();
            }
        } else {
            $validated['department_id'] = null;
            $validated['designation_id'] = null;
        }

        if (! empty($validated['designation_id']) && ! empty($validated['department_id'])) {
            $des = Designation::query()->find((int) $validated['designation_id']);
            if (! $des || (int) $des->department_id !== (int) $validated['department_id']) {
                return back()
                    ->withErrors(['designation_id' => 'Designation must belong to the selected department.'])
                    ->withInput();
            }
        } elseif (empty($validated['department_id'])) {
            $validated['designation_id'] = null;
        }

        return $validated;
    }

    /**
     * @return array{
     *   branches: Collection,
     *   departments: Collection,
     *   designations: Collection,
     *   users: Collection,
     *   assignableAppRoles?: list<string>
     * }
     */
    private function formSharedData(?Employee $forEdit, bool $includeAssignableRoles = false): array
    {
        $branches = Branch::query()
            ->where(function ($q) use ($forEdit) {
                $q->where('status', 'active');
                if ($forEdit?->branch_id) {
                    $q->orWhere('id', $forEdit->branch_id);
                }
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        $departments = Department::query()
            ->where(function ($q) use ($forEdit) {
                $q->where('status', 'active');
                if ($forEdit?->department_id) {
                    $q->orWhere('id', $forEdit->department_id);
                }
            })
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        $designations = Designation::query()
            ->where(function ($q) use ($forEdit) {
                $q->where('status', 'active');
                if ($forEdit?->designation_id) {
                    $q->orWhere('id', $forEdit->designation_id);
                }
            })
            ->with('department:id,name,branch_id')
            ->orderBy('name')
            ->get(['id', 'name', 'department_id']);

        $out = [
            'branches' => $branches,
            'departments' => $departments,
            'designations' => $designations,
            'users' => $forEdit === null ? collect() : $this->linkableUsers($forEdit),
        ];
        if ($includeAssignableRoles) {
            $out['assignableAppRoles'] = $this->assignableRoleNames();
        }

        return $out;
    }

    /**
     * App roles that may be set from the employee form (never Super Admin).
     *
     * @return list<string>
     */
    private function assignableRoleNames(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->where('name', '!=', 'Super Admin')
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();
    }

    /**
     * Apply roles chosen on the employee form, but keep any roles not managed here (e.g. Super Admin).
     *
     * @param  list<string>  $formRoleNames
     */
    private function syncUserFormRoles(User $user, array $formRoleNames): void
    {
        $user->loadMissing('roles');
        $assignable = $this->assignableRoleNames();
        $current = $user->roles->pluck('name')->all();
        $preserved = array_values(array_filter(
            $current,
            static fn (string $n) => ! in_array($n, $assignable, true)
        ));
        $merged = array_values(array_unique([...$preserved, ...$formRoleNames]));
        $user->syncRoles($merged);
    }

    private function uniqueEmployeeSlug(string $name, ?int $ignoreEmployeeId = null): string
    {
        $base = Str::slug($name) ?: 'employee';
        $slug = $base;
        $n = 1;
        while (true) {
            $q = Employee::query()->withTrashed()->where('slug', $slug);
            if ($ignoreEmployeeId) {
                $q->where('id', '!=', $ignoreEmployeeId);
            }
            if (! $q->exists()) {
                return $slug;
            }
            $n++;
            $slug = $base.'-'.$n;
        }
    }

    /**
     * Users that may be linked to an employee: no employee yet, or the current record’s user (edit).
     *
     * @return Collection<int, array{id: int, name: string, email: string, roles: list<string>}>
     */
    private function linkableUsers(?Employee $forEdit): Collection
    {
        return User::query()
            ->where(function ($q) use ($forEdit) {
                $q->whereDoesntHave('employee');
                if ($forEdit?->user_id) {
                    $q->orWhere('id', (int) $forEdit->user_id);
                }
            })
            ->with(['roles' => fn ($r) => $r->orderBy('name')])
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'roles' => $u->roles->pluck('name')->values()->all(),
            ]);
    }
}
