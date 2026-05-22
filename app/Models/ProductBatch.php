<?php

namespace App\Models;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBatch extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'product_variant_id',
        'batch_number',
        'manufacture_date',
        'expiry_date',
        'cost_price',
        'selling_price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
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
}
