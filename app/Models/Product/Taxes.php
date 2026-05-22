<?php

namespace App\Models\Product;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string $slug
 * @property string $rate
 * @property string $type
 * @property string $status
 */
class Taxes extends Model
{
    use SoftDeletes;

    protected $table = 'taxes';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'slug',
        'rate',
        'type',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'type' => 'string',
            'status' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Taxes $tax): void {
            $tax->slug = static::uniqueSlugFromName($tax->name);
        });

        static::updating(function (Taxes $tax): void {
            if ($tax->isDirty('name')) {
                $tax->slug = static::uniqueSlugFromName($tax->name, $tax->getKey());
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'tax_id');
    }

    public static function uniqueSlugFromName(string $name, ?int $exceptId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'tax';
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
