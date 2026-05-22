<?php

namespace App\Models;

use App\Models\Company\Branch;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchProduct extends Model
{
    protected $table = 'branch_products';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'product_id',
        'product_variant_id',
        'stock_qty',
        'reserved_qty',
        'min_stock_level',
        'max_stock_level',
    ];

    protected function casts(): array
    {
        return [
            'stock_qty' => 'decimal:4',
            'reserved_qty' => 'decimal:4',
            'min_stock_level' => 'decimal:4',
            'max_stock_level' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
