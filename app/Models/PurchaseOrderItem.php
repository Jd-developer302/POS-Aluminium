<?php

namespace App\Models;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrderItem extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'product_variant_id',
        'billing_mode',
        'length_pairs',
        'quantity',
        'received_quantity',
        'unit_cost',
        'tax_rate',
        'tax_amount',
        'discount',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'length_pairs' => 'array',
            'quantity' => 'decimal:4',
            'received_quantity' => 'decimal:4',
            'unit_cost' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
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
