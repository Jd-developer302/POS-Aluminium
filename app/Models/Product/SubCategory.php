<?php

namespace App\Models\Product;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $category_id
 * @property string $name
 * @property string $slug
 * @property string|null $image
 * @property string $status
 */
class SubCategory extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'image',
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
        static::creating(function (SubCategory $subCategory): void {
            $subCategory->slug = static::uniqueSlugFromName($subCategory->name);
        });

        static::updating(function (SubCategory $subCategory): void {
            if ($subCategory->isDirty('name')) {
                $subCategory->slug = static::uniqueSlugFromName(
                    $subCategory->name,
                    $subCategory->getKey(),
                );
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function imagePublicUrl(): ?string
    {
        if (! $this->image) {
            return null;
        }

        if (str_starts_with($this->image, 'sub_categories/')) {
            if (! Storage::disk('public')->exists($this->image)) {
                return null;
            }

            return '/storage/'.$this->image;
        }

        if (file_exists(public_path($this->image))) {
            return asset($this->image);
        }

        return null;
    }

    public static function uniqueSlugFromName(string $name, ?int $exceptId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'subcategory';
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
