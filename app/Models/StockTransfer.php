<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransfer extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'from_branch_id',
        'to_branch_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'created_by',
        'approved_by',
        'transfer_date',
        'reference_number',
        'notes',
        'status',
        'total_quantity',
    ];

    protected function casts(): array
    {
        return [
            'transfer_date' => 'date',
            'total_quantity' => 'decimal:4',
        ];
    }

    /**
     * @return HasMany<StockTransferItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class, 'stock_transfer_id');
    }
}
