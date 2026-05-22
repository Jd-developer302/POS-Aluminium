<?php

namespace App\Models;

use App\Models\Company\Warehouse;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Stock extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'product_variant_id',
        'warehouse_id',
        'billing_mode',
        'length_pairs',
        'quantity',
        'reserved_quantity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'length_pairs' => 'array',
            'quantity' => 'decimal:4',
            'reserved_quantity' => 'decimal:4',
            'status' => 'string',
        ];
    }

    /**
     * @return HasMany<StockLengthItem, $this>
     */
    public function stockLengthItems(): HasMany
    {
        return $this->hasMany(StockLengthItem::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<ProductVarient, $this>
     */
    public function productVarient(): BelongsTo
    {
        return $this->belongsTo(ProductVarient::class, 'product_variant_id');
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
