<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreTaxRequest;
use App\Http\Requests\Catalog\UpdateTaxRequest;
use App\Models\Product\Taxes;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TaxController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorizeResource(Taxes::class, 'tax');
    }

    public function index(): Response
    {
        $taxes = Taxes::query()
            ->orderBy('name')
            ->paginate(15)
            ->through(fn (Taxes $tax) => [
                'id' => $tax->id,
                'name' => $tax->name,
                'code' => $tax->code,
                'slug' => $tax->slug,
                'rate' => (string) $tax->rate,
                'type' => $tax->type,
                'status' => $tax->status,
            ])
            ->withQueryString();

        return Inertia::render('Tax/Index', [
            'taxes' => $taxes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Tax/Create');
    }

    public function store(StoreTaxRequest $request): RedirectResponse
    {
        Taxes::create($request->validated());

        return redirect()->route('taxes.index')
            ->with('success', 'Tax created.');
    }

    public function show(Taxes $tax): Response
    {
        return Inertia::render('Tax/Show', [
            'tax' => [
                'id' => $tax->id,
                'name' => $tax->name,
                'code' => $tax->code,
                'slug' => $tax->slug,
                'rate' => (string) $tax->rate,
                'type' => $tax->type,
                'status' => $tax->status,
            ],
        ]);
    }

    public function edit(Taxes $tax): Response
    {
        return Inertia::render('Tax/Edit', [
            'tax' => [
                'id' => $tax->id,
                'name' => $tax->name,
                'code' => $tax->code,
                'slug' => $tax->slug,
                'rate' => (string) $tax->rate,
                'type' => $tax->type,
                'status' => $tax->status,
            ],
        ]);
    }

    public function update(UpdateTaxRequest $request, Taxes $tax): RedirectResponse
    {
        $tax->update($request->validated());

        return redirect()->route('taxes.index')
            ->with('success', 'Tax updated.');
    }

    public function destroy(Taxes $tax): RedirectResponse
    {
        $tax->delete();

        return redirect()->route('taxes.index')
            ->with('success', 'Tax deleted.');
    }
}
