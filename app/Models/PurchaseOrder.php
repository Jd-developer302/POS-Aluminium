<?php

namespace App\Models;

use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Supplier\Supplier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'warehouse_id',
        'supplier_id',
        'created_by',
        'order_number',
        'order_date',
        'expected_date',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_cost',
        'total',
        'paid_amount',
        'received_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_date' => 'date',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'received_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<PurchaseOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class, 'purchase_order_id');
    }

    /**
     * @return HasMany<PurchaseInvoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(PurchaseInvoice::class, 'purchase_order_id');
    }

    /**
     * @return HasMany<PurchaseOrderNotificationLog, $this>
     */
    public function notificationLogs(): HasMany
    {
        return $this->hasMany(PurchaseOrderNotificationLog::class)->latest('id');
    }
}
