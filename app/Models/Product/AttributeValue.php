<?php

namespace App\Models\Product;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class AttributeValue extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'attribute_id',
        'value',
        'slug',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (AttributeValue $attributeValue): void {
            $attributeValue->slug = static::uniqueSlugFromValue($attributeValue->value);
        });

        static::updating(function (AttributeValue $attributeValue): void {
            if ($attributeValue->isDirty('value')) {
                $attributeValue->slug = static::uniqueSlugFromValue($attributeValue->value, $attributeValue->getKey());
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return BelongsTo<Attribute, $this>
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    public static function uniqueSlugFromValue(string $value, ?int $exceptId = null): string
    {
        $base = Str::slug($value);
        if ($base === '') {
            $base = 'attribute-value';
        }

        $slug = $base;
        $n = 1;
        while (static::query()
            ->where('slug', $slug)
            ->when($exceptId !== null, fn ($q) => $q->where('id', '!=', $exceptId))
            ->withTrashed()
            ->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
