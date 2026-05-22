<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Supplier\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Customer::query()->withCount(['sales', 'saleReturns']);

        $q = $request->query('q');
        if (is_string($q) && trim($q) !== '') {
            $term = '%'.trim($q).'%';
            $query->where(function ($sub) use ($term): void {
                $sub->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term);
            });
        }

        $status = $request->query('status');
        if (is_string($status) && in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }

        $group = $request->query('customer_group');
        if (is_string($group) && in_array($group, ['regular', 'silver', 'gold', 'platinum'], true)) {
            $query->where('customer_group', $group);
        }

        $customers = $query
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Customer/Index', [
            'customers' => $customers,
            'filters' => [
                'q' => is_string($q) ? $q : '',
                'status' => is_string($status) ? $status : '',
                'customer_group' => is_string($group) ? $group : '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Customer/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedCustomerPayload($request);

        Customer::query()->create($data);

        return redirect()->route('customers.index')->with('success', 'Customer created.');
    }

    public function quickStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64', Rule::unique('customers', 'code')],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
        ]);

        $code = isset($validated['code']) ? trim((string) $validated['code']) : '';
        if ($code === '') {
            $code = $this->generateUniqueCustomerCode();
        }

        $customer = Customer::query()->create([
            'name' => $validated['name'],
            'code' => $code,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'customer_group' => 'regular',
            'status' => 'active',
            'opening_balance' => 0,
            'loyalty_points' => 0,
            'credit_limit' => 0,
        ]);

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'code' => $customer->code,
            ],
        ], 201);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('Customer/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $data = $this->validatedCustomerPayload($request, $customer->id);

        $customer->update($data);

        return redirect()->route('customers.index')->with('success', 'Customer updated.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        if ($customer->sales()->exists() || $customer->saleReturns()->exists()) {
            return redirect()->route('customers.index')
                ->with('error', 'Cannot delete a customer linked to sales or returns. Set status to inactive instead.');
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Customer deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedCustomerPayload(Request $request, ?int $customerId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('customers', 'code')->ignore($customerId),
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
            'loyalty_points' => ['nullable', 'numeric', 'min:0'],
            'customer_group' => ['required', Rule::in(['regular', 'silver', 'gold', 'platinum'])],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:active,inactive'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function generateUniqueCustomerCode(): string
    {
        for ($attempt = 0; $attempt < 25; $attempt++) {
            $candidate = 'C-'.strtoupper(substr(bin2hex(random_bytes(5)), 0, 9));
            if (! Customer::query()->where('code', $candidate)->exists()) {
                return $candidate;
            }
        }

        throw new RuntimeException('Could not generate a unique customer code.');
    }
}
