<?php

namespace App\Models\Product;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $symbol
 * @property string $status
 */
class Unit extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'symbol',
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
        static::creating(function (Unit $unit): void {
            $unit->slug = static::uniqueSlugFromName($unit->name);
        });

        static::updating(function (Unit $unit): void {
            if ($unit->isDirty('name')) {
                $unit->slug = static::uniqueSlugFromName($unit->name, $unit->getKey());
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
        return $this->hasMany(Product::class);
    }

    public static function uniqueSlugFromName(string $name, ?int $exceptId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'unit';
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
