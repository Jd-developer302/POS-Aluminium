<?php

namespace App\Models\Product;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVarient extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'name',
        'sku',
        'barcode',
        'cost_price',
        'selling_price',
        'status',
    ];

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Pivot rows linking this variant to attribute values (name avoids clashing with Model::$attributes).
     *
     * @return HasMany<ProductVarientAttribute, $this>
     */
    public function varientAttributes(): HasMany
    {
        return $this->hasMany(ProductVarientAttribute::class);
    }
}
