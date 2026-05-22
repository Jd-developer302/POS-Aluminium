<?php

namespace App\Models\Product;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVarientAttribute extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_varient_id',
        'attribute_id',
        'attribute_value_id',
    ];

    /**
     * @return BelongsTo<ProductVarient, $this>
     */
    public function productVarient(): BelongsTo
    {
        return $this->belongsTo(ProductVarient::class);
    }

    /**
     * @return BelongsTo<Attribute, $this>
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    /**
     * @return BelongsTo<AttributeValue, $this>
     */
    public function attributeValue(): BelongsTo
    {
        return $this->belongsTo(AttributeValue::class);
    }
}
