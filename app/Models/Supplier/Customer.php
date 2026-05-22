<?php

namespace App\Models\Supplier;

use App\Models\Customer\CustomerDueItem;
use App\Models\Customer\CustomerReceipt;
use App\Models\Quotation;
use App\Models\Sale;
use App\Models\SaleReturn;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
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
        'loyalty_points',
        'customer_group',
        'credit_limit',
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
            'loyalty_points' => 'decimal:2',
            'credit_limit' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }

    /**
     * @return HasMany<Quotation, $this>
     */
    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class, 'customer_id');
    }

    /**
     * @return HasMany<SaleReturn, $this>
     */
    public function saleReturns(): HasMany
    {
        return $this->hasMany(SaleReturn::class, 'customer_id');
    }

    /**
     * @return HasMany<CustomerDueItem, $this>
     */
    public function dueItems(): HasMany
    {
        return $this->hasMany(CustomerDueItem::class, 'customer_id');
    }

    /**
     * @return HasMany<CustomerReceipt, $this>
     */
    public function customerReceipts(): HasMany
    {
        return $this->hasMany(CustomerReceipt::class, 'customer_id');
    }
}
