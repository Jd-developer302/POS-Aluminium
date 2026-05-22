<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreUnitRequest;
use App\Http\Requests\Product\UpdateUnitRequest;
use App\Models\Product\Unit;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Unit::class, 'unit');
    }

    public function index(): Response
    {
        $units = Unit::query()
            ->withCount('products')
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Unit $unit) => [
                'id' => $unit->id,
                'name' => $unit->name,
                'slug' => $unit->slug,
                'symbol' => $unit->symbol,
                'status' => $unit->status,
                'products_count' => $unit->products_count,
            ])
            ->withQueryString();

        return Inertia::render('Unit/Index', [
            'units' => $units,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Unit/Create');
    }

    public function store(StoreUnitRequest $request): RedirectResponse
    {
        Unit::create($request->validated());

        return redirect()->route('units.index')
            ->with('success', 'Unit created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $this->authorize('create', Unit::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['nullable', 'string', 'max:50'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $unit = Unit::create($validated);

        return response()->json([
            'unit' => [
                'id' => $unit->id,
                'name' => $unit->name,
                'slug' => $unit->slug,
                'symbol' => $unit->symbol,
            ],
        ], 201);
    }

    public function show(Unit $unit): Response
    {
        $unit->loadCount('products');

        return Inertia::render('Unit/Show', [
            'unit' => [
                'id' => $unit->id,
                'name' => $unit->name,
                'slug' => $unit->slug,
                'symbol' => $unit->symbol,
                'status' => $unit->status,
                'products_count' => $unit->products_count,
            ],
        ]);
    }

    public function edit(Unit $unit): Response
    {
        return Inertia::render('Unit/Edit', [
            'unit' => [
                'id' => $unit->id,
                'name' => $unit->name,
                'slug' => $unit->slug,
                'symbol' => $unit->symbol ?? '',
                'status' => $unit->status,
            ],
        ]);
    }

    public function update(UpdateUnitRequest $request, Unit $unit): RedirectResponse
    {
        $unit->update($request->validated());

        return redirect()->route('units.index')
            ->with('success', 'Unit updated.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        if ($unit->products()->exists()) {
            return redirect()->route('units.show', $unit)
                ->with('error', 'Cannot delete a unit that is assigned to products.');
        }

        $unit->delete();

        return redirect()->route('units.index')
            ->with('success', 'Unit deleted.');
    }
}
