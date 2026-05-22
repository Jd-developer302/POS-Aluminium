<?php

namespace App\Models;

use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'warehouse_id',
        'product_id',
        'product_variant_id',
        'product_batch_id',
        'direction',
        'quantity',
        'before_qty',
        'after_qty',
        'source_type',
        'source_id',
        'reference',
        'created_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'before_qty' => 'decimal:4',
            'after_qty' => 'decimal:4',
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
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
