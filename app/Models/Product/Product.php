<?php

namespace App\Models\Product;

use App\Models\Stock;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $category_id
 * @property int $sub_category_id
 * @property int|null $brand_id
 * @property int $unit_id
 * @property int|null $tax_id
 * @property string $name
 * @property string $slug
 * @property string $type
 * @property string $sale_type
 * @property int $quantity_in_pack
 * @property int $pack_in_carton
 * @property string|null $image
 * @property string|null $description
 * @property bool $alert
 * @property string|null $alert_message
 * @property int|null $expiry_alert
 * @property int|null $quantity_alert
 * @property string $status
 */
class Product extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'sub_category_id',
        'brand_id',
        'unit_id',
        'tax_id',
        'name',
        'slug',
        'type',
        'sale_type',
        'quantity_in_pack',
        'pack_in_carton',
        'image',
        'description',
        'alert',
        'alert_message',
        'expiry_alert',
        'quantity_alert',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'alert' => 'boolean',
            'status' => 'string',
            'type' => 'string',
            'sale_type' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product): void {
            $product->slug = static::uniqueSlugFromName($product->name);
        });

        static::updating(function (Product $product): void {
            if ($product->isDirty('name')) {
                $product->slug = static::uniqueSlugFromName($product->name, $product->getKey());
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
     * @return BelongsTo<SubCategory, $this>
     */
    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class);
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * @return BelongsTo<Taxes, $this>
     */
    public function tax(): BelongsTo
    {
        return $this->belongsTo(Taxes::class, 'tax_id');
    }

    /**
     * @return HasMany<ProductVarient, $this>
     */
    public function varients(): HasMany
    {
        return $this->hasMany(ProductVarient::class);
    }

    /**
     * @return HasMany<Stock, $this>
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function imagePublicUrl(): ?string
    {
        if (! $this->image) {
            return null;
        }

        if (str_starts_with($this->image, 'products/')) {
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
            $base = 'product';
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
