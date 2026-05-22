<?php

namespace App\Models\Customer;

use App\Models\Company\Branch;
use App\Models\Supplier\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerReceipt extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'customer_id',
        'received_by',
        'receipt_no',
        'receipt_date',
        'receipt_type',
        'amount',
        'allocated_amount',
        'unallocated_amount',
        'payment_method',
        'payment_reference',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'receipt_date' => 'date',
            'amount' => 'decimal:2',
            'allocated_amount' => 'decimal:2',
            'unallocated_amount' => 'decimal:2',
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
     * @return BelongsTo<User, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * @return HasMany<CustomerReceiptAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(CustomerReceiptAllocation::class, 'customer_receipt_id');
    }
}
