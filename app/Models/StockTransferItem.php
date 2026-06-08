<?php

namespace App\Models;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransferItem extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'stock_transfer_id',
        'product_id',
        'product_variant_id',
        'product_batch_id',
        'billing_mode',
        'length_pairs',
        'quantity',
        'received_quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'length_pairs' => 'array',
            'quantity' => 'decimal:4',
            'received_quantity' => 'decimal:4',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productVarient(): BelongsTo
    {
        return $this->belongsTo(ProductVarient::class, 'product_variant_id');
    }
}
