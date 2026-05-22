<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockAdjustmentItem extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'stock_adjustment_id',
        'product_id',
        'product_variant_id',
        'product_batch_id',
        'quantity',
        'before_qty',
        'after_qty',
        'purchase_price',
        'selling_price',
        'expiry_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'before_qty' => 'decimal:4',
            'after_qty' => 'decimal:4',
            'purchase_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }
}
