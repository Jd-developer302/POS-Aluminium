<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockAdjustment extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'warehouse_id',
        'branch_id',
        'created_by',
        'adjustment_date',
        'reference_number',
        'type',
        'reason',
        'status',
        'total_quantity',
    ];

    protected function casts(): array
    {
        return [
            'adjustment_date' => 'date',
            'total_quantity' => 'decimal:4',
        ];
    }

    /**
     * @return HasMany<StockAdjustmentItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class, 'stock_adjustment_id');
    }
}
