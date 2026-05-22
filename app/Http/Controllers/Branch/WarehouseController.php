<?php

namespace App\Http\Controllers\Branch;

use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreWarehouseRequest;
use App\Http\Requests\Branch\UpdateWarehouseRequest;
use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Warehouse::class, 'warehouse');
    }

    public function index(): Response
    {
        $warehouses = Warehouse::query()
            ->with(['branch' => fn ($q) => $q->select('branches.id', 'branches.name')])
            ->orderBy('branch_id')
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Warehouse $warehouse) => [
                'id' => $warehouse->id,
                'name' => $warehouse->name,
                'code' => $warehouse->code,
                'branch' => $warehouse->branch?->only(['id', 'name']),
                'status' => $warehouse->status,
                'is_default' => $warehouse->is_default,
            ])
            ->withQueryString();

        return Inertia::render('Warehouse/Index', [
            'warehouses' => $warehouses,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Warehouse/Create', [
            'branches' => $this->branchesForForm(),
        ]);
    }

    public function store(StoreWarehouseRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $warehouse = Warehouse::create($data);

        if ($warehouse->is_default) {
            Warehouse::query()
                ->where('branch_id', $warehouse->branch_id)
                ->whereKeyNot($warehouse->id)
                ->update(['is_default' => false]);
        }

        return redirect()->route('warehouses.show', $warehouse)
            ->with('success', 'Warehouse created.');
    }

    public function show(Warehouse $warehouse): Response
    {
        $warehouse->load(['branch' => fn ($q) => $q->select('branches.id', 'branches.name')]);

        return Inertia::render('Warehouse/Show', [
            'warehouse' => [
                'id' => $warehouse->id,
                'branch_id' => $warehouse->branch_id,
                'branch' => $warehouse->branch?->only(['id', 'name']),
                'name' => $warehouse->name,
                'code' => $warehouse->code,
                'address' => $warehouse->address,
                'phone' => $warehouse->phone,
                'is_default' => $warehouse->is_default,
                'status' => $warehouse->status,
            ],
        ]);
    }

    public function edit(Warehouse $warehouse): Response
    {
        return Inertia::render('Warehouse/Edit', [
            'warehouse' => [
                'id' => $warehouse->id,
                'branch_id' => $warehouse->branch_id,
                'name' => $warehouse->name,
                'code' => $warehouse->code,
                'address' => $warehouse->address ?? '',
                'phone' => $warehouse->phone ?? '',
                'is_default' => $warehouse->is_default,
                'status' => $warehouse->status,
            ],
            'branches' => $this->branchesForForm(),
        ]);
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $data = $request->validated();

        $warehouse->update($data);

        if ($warehouse->is_default) {
            Warehouse::query()
                ->where('branch_id', $warehouse->branch_id)
                ->whereKeyNot($warehouse->id)
                ->update(['is_default' => false]);
        }

        return redirect()->route('warehouses.show', $warehouse)
            ->with('success', 'Warehouse updated.');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $warehouse->delete();

        return redirect()->route('warehouses.index')
            ->with('success', 'Warehouse deleted.');
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    private function branchesForForm(): array
    {
        return Branch::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Branch $branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
            ])
            ->values()
            ->all();
    }
}
