<?php

namespace App\Models\Customer;

use App\Models\Company\Branch;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Sale;
use App\Models\Supplier\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class CustomerDueItem extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'customer_id',
        'source_type',
        'sale_id',
        'product_id',
        'product_variant_id',
        'product_name',
        'variant_name',
        'reference_no',
        'transaction_date',
        'due_date',
        'original_amount',
        'paid_amount',
        'adjusted_amount',
        'balance_amount',
        'status',
        'notes',
        'supporting_image_path',
        'supporting_pdf_path',
        'created_by',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'supporting_image_path',
        'supporting_pdf_path',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'supporting_image_url',
        'supporting_pdf_url',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'due_date' => 'date',
            'original_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'adjusted_amount' => 'decimal:2',
            'balance_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Branch, $this>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return BelongsTo<ProductVarient, $this>
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVarient::class, 'product_variant_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<CustomerReceiptAllocation, $this>
     */
    public function receiptAllocations(): HasMany
    {
        return $this->hasMany(CustomerReceiptAllocation::class, 'customer_due_item_id');
    }

    /**
     * @return HasMany<CustomerDueAdjustment, $this>
     */
    public function adjustments(): HasMany
    {
        return $this->hasMany(CustomerDueAdjustment::class, 'customer_due_item_id');
    }

    public function getSupportingImageUrlAttribute(): ?string
    {
        return $this->publicDiskUrl($this->attributes['supporting_image_path'] ?? null);
    }

    public function getSupportingPdfUrlAttribute(): ?string
    {
        return $this->publicDiskUrl($this->attributes['supporting_pdf_path'] ?? null);
    }

    private function publicDiskUrl(mixed $path): ?string
    {
        if (! is_string($path) || $path === '') {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($path);
    }
}
