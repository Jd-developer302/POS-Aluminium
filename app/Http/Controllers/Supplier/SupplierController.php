<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Supplier\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Supplier::query()->withCount('purchaseInvoices');

        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $term = '%'.trim($q).'%';
            $query->where(function ($sub) use ($term): void {
                $sub->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('business_name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term);
            });
        }

        $status = $request->query('status');
        if (is_string($status) && in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }

        $suppliers = $query
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Supplier/Index', [
            'suppliers' => $suppliers,
            'filters' => [
                'q' => is_string($q) ? $q : '',
                'status' => is_string($status) ? $status : '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Supplier/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedSupplierPayload($request);
        $data['slug'] = $this->uniqueSlugFromName($data['name']);

        Supplier::query()->create($data);

        return redirect()->route('suppliers.index')->with('success', 'Supplier created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64', Rule::unique('suppliers', 'code')],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'business_name' => ['nullable', 'string', 'max:255'],
        ]);

        $code = isset($validated['code']) ? trim((string) $validated['code']) : '';
        if ($code === '') {
            $code = $this->generateUniqueSupplierCode();
        }

        $name = trim($validated['name']);
        $slug = $this->uniqueSlugFromName($name);

        $supplier = Supplier::query()->create([
            'name' => $name,
            'business_name' => isset($validated['business_name'])
                ? (trim((string) $validated['business_name']) !== ''
                    ? trim((string) $validated['business_name'])
                    : null)
                : null,
            'slug' => $slug,
            'code' => $code,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'opening_balance' => 0,
            'credit_limit' => 0,
            'current_balance' => 0,
            'status' => 'active',
        ]);

        return response()->json([
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'code' => $supplier->code,
            ],
        ], 201);
    }

    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('Supplier/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $this->validatedSupplierPayload($request, $supplier->id);
        if ($supplier->name !== $data['name']) {
            $data['slug'] = $this->uniqueSlugFromName($data['name'], $supplier->id);
        }

        $supplier->update($data);

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        if ($supplier->purchaseInvoices()->exists()) {
            return redirect()->route('suppliers.index')
                ->with('error', 'Cannot delete a supplier that has purchase invoices. You can set status to inactive instead.');
        }

        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedSupplierPayload(Request $request, ?int $supplierId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('suppliers', 'code')->ignore($supplierId),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'tax_number' => ['nullable', 'string', 'max:120'],
            'opening_balance' => ['nullable', 'numeric'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'current_balance' => ['nullable', 'numeric'],
            'status' => ['required', 'in:active,inactive'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function uniqueSlugFromName(string $name, ?int $ignoreSupplierId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'supplier';
        }

        $slug = $base;
        $n = 0;

        while (Supplier::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreSupplierId !== null, static fn ($q) => $q->where('id', '!=', $ignoreSupplierId))
            ->exists()) {
            $n++;
            $slug = $base.'-'.$n;
        }

        return $slug;
    }

    private function generateUniqueSupplierCode(): string
    {
        for ($attempt = 0; $attempt < 25; $attempt++) {
            $candidate = 'S-'.strtoupper(substr(bin2hex(random_bytes(5)), 0, 9));
            if (! Supplier::query()->where('code', $candidate)->exists()) {
                return $candidate;
            }
        }

        throw new RuntimeException('Could not generate a unique supplier code.');
    }
}
