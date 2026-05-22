<?php

namespace App\Models;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class QuotationItem extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'quotation_id',
        'product_id',
        'product_variant_id',
        'product_batch_id',
        'billing_mode',
        'length_pairs',
        'quantity',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'discount_type',
        'discount_value',
        'discount_amount',
        'subtotal',
        'line_total',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'length_pairs' => 'array',
            'quantity' => 'decimal:4',
            'unit_price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_value' => 'decimal:4',
            'discount_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Quotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return BelongsTo<ProductVarient, $this>
     */
    public function productVarient(): BelongsTo
    {
        return $this->belongsTo(ProductVarient::class, 'product_variant_id');
    }
}
