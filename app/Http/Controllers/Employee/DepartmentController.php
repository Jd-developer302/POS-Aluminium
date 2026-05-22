<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Company\Branch;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['branch_id', 'status', 'q']);

        $departments = Department::query()
            ->with(['branch:id,name'])
            ->when($filters['branch_id'] ?? null, fn ($q, $v) => $q->where('branch_id', $v))
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

        return Inertia::render('Employee/Department/Index', [
            'departments' => $departments,
            'branches' => $branches,
            'filters' => [
                'branch_id' => $filters['branch_id'] ?? '',
                'status' => $filters['status'] ?? '',
                'q' => $filters['q'] ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Employee/Department/Create', [
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['slug'] = $this->uniqueSlug($validated['name']);

        Department::create($validated);

        return redirect()->route('departments.index')
            ->with('success', 'Department created successfully.');
    }

    public function edit(Department $department): Response
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Employee/Department/Edit', [
            'department' => $department->load('branch:id,name'),
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $slug = $this->uniqueSlug($validated['name'], $department->id);
        $department->update([...$validated, 'slug' => $slug]);

        return redirect()->route('departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $department->delete();

        return redirect()->route('departments.index')
            ->with('success', 'Department deleted successfully.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'department';
        $slug = $base;
        $n = 2;
        for (; ;) {
            $q = Department::query()->where('slug', $slug);
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
