<?php

namespace App\Models\Customer;

use App\Models\Company\Branch;
use App\Models\Supplier\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerDueAdjustment extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'customer_id',
        'customer_due_item_id',
        'created_by',
        'adjustment_date',
        'adjustment_type',
        'amount',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'adjustment_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * @return BelongsTo<CustomerDueItem, $this>
     */
    public function dueItem(): BelongsTo
    {
        return $this->belongsTo(CustomerDueItem::class, 'customer_due_item_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
