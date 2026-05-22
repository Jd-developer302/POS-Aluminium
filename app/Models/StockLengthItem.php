<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLengthItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'stock_id',
        'length',
        'qty',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'length' => 'decimal:4',
            'qty' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<Stock, $this>
     */
    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')->where('qty', '>', 0);
    }
}
