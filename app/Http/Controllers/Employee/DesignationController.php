<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'department_id', 'status', 'q']);

        $designations = Designation::query()
            ->with(['department:id,name,slug,branch_id', 'department.branch:id,name'])
            ->when($filters['branch_id'] ?? null, function ($q, $v) {
                $q->whereHas('department', fn ($qq) => $qq->where('branch_id', $v));
            })
            ->when($filters['department_id'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
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

        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        $departments = Department::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Employee/Designation/Index', [
            'designations' => $designations,
            'branches' => $branches,
            'departments' => $departments,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'department_id' => $filters['department_id'] ?? '',
                'status' => $filters['status'] ?? '',
                'q' => $filters['q'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        $departments = Department::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Employee/Designation/Create', [
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['slug'] = $this->uniqueSlug($validated['name']);

        Designation::create($validated);

        return redirect()->route('designations.index')
            ->with('success', 'Designation created successfully.');
    }

    public function edit(Designation $designation): Response
    {
        $departments = Department::query()
            ->where('status', 'active')
            ->with('branch:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Employee/Designation/Edit', [
            'designation' => $designation->load('department.branch'),
            'departments' => $departments,
        ]);
    }

    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $slug = $this->uniqueSlug($validated['name'], $designation->id);
        $designation->update([...$validated, 'slug' => $slug]);

        return redirect()->route('designations.index')
            ->with('success', 'Designation updated successfully.');
    }

    public function destroy(Designation $designation): RedirectResponse
    {
        $designation->delete();

        return redirect()->route('designations.index')
            ->with('success', 'Designation deleted successfully.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'designation';
        $slug = $base;
        $n = 2;
        for (; ;) {
            $q = Designation::query()->where('slug', $slug);
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
