<?php

namespace App\Http\Controllers\Branch;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Models\Company\Branch;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Branch::class, 'branch');
    }

    public function index(): Response
    {
        $branches = Branch::query()
            ->with([
                'users' => fn ($query) => $query->orderBy('name')->select('users.id', 'users.name', 'users.branch_id'),
                'warehouses' => fn ($query) => $query->orderBy('name')->select('warehouses.id', 'warehouses.name', 'warehouses.branch_id'),
            ])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Branch/Index', [
            'branches' => $branches,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Branch/Create');
    }

    public function store(StoreBranchRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('logo');

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('branches/logos', 'public');
        }

        $branch = Branch::create($data);

        return redirect()->route('branches.show', $branch)
            ->with('success', 'Branch created.');
    }

    public function show(Branch $branch): Response
    {
        $branch->loadCount('warehouses');
        $branch->load([
            'users' => fn ($query) => $query->orderBy('name')->select('users.id', 'users.name', 'users.branch_id'),
        ]);

        return Inertia::render('Branch/Show', [
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'phone' => $branch->phone,
                'email' => $branch->email,
                'website' => $branch->website,
                'logo' => $branch->logo,
                'logo_url' => $branch->logoPublicUrl(),
                'status' => $branch->status,
                'users' => $branch->users->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                ])->values()->all(),
                'warehouses_count' => $branch->warehouses_count,
            ],
        ]);
    }

    public function edit(Branch $branch): Response
    {
        return Inertia::render('Branch/Edit', [
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'phone' => $branch->phone,
                'email' => $branch->email,
                'website' => $branch->website,
                'logo' => $branch->logo,
                'logo_url' => $branch->logoPublicUrl(),
                'status' => $branch->status,
            ],
        ]);
    }

    public function update(UpdateBranchRequest $request, Branch $branch): RedirectResponse
    {
        $data = $request->safe()->except('logo');

        if ($request->hasFile('logo')) {
            if ($branch->logo && str_starts_with($branch->logo, 'branches/')) {
                Storage::disk('public')->delete($branch->logo);
            }

            $data['logo'] = $request->file('logo')->store('branches/logos', 'public');
        }

        $branch->update($data);

        return redirect()->route('branches.show', $branch)
            ->with('success', 'Branch updated.');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        if ($branch->users()->exists()) {
            return redirect()->route('branches.index')
                ->with('error', 'Cannot delete a branch that has users assigned.');
        }

        if ($branch->warehouses()->exists()) {
            return redirect()->route('branches.index')
                ->with('error', 'Cannot delete a branch that has warehouses.');
        }

        if ($branch->logo && str_starts_with($branch->logo, 'branches/')) {
            Storage::disk('public')->delete($branch->logo);
        }

        $branch->delete();

        return redirect()->route('branches.index')
            ->with('success', 'Branch deleted.');
    }
}
