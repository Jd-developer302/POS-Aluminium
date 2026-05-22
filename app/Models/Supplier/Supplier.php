<?php

namespace App\Models\Supplier;

use App\Models\PurchaseInvoice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'business_name',
        'slug',
        'code',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'tax_number',
        'opening_balance',
        'credit_limit',
        'current_balance',
        'status',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'credit_limit' => 'decimal:2',
            'current_balance' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<PurchaseInvoice, $this>
     */
    public function purchaseInvoices(): HasMany
    {
        return $this->hasMany(PurchaseInvoice::class, 'supplier_id');
    }
}
