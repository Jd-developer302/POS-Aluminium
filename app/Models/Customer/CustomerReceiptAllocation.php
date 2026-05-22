<?php

namespace App\Models\Customer;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerReceiptAllocation extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'customer_receipt_id',
        'customer_due_item_id',
        'amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<CustomerReceipt, $this>
     */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(CustomerReceipt::class, 'customer_receipt_id');
    }

    /**
     * @return BelongsTo<CustomerDueItem, $this>
     */
    public function dueItem(): BelongsTo
    {
        return $this->belongsTo(CustomerDueItem::class, 'customer_due_item_id');
    }
}
