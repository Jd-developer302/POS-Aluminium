<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        'quantity',
        'received_quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'received_quantity' => 'decimal:4',
        ];
    }
}
