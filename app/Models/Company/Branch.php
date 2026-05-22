<?php

namespace App\Models\Company;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $name
 * @property string|null $address
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $website
 * @property string|null $logo
 * @property string $status
 */
class Branch extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'website',
        'logo',
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

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<Warehouse, $this>
     */
    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    /**
     * @return HasMany<Department, $this>
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    /**
     * @return HasMany<Employee, $this>
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function logoPublicUrl(): ?string
    {
        if (! $this->logo) {
            return null;
        }

        $logo = $this->logo;

        if (str_starts_with($logo, 'branches/')) {
            if (! Storage::disk('public')->exists($logo)) {
                return asset('images/branch-placeholder.svg');
            }

            return '/storage/'.$logo;
        }

        if (file_exists(public_path($logo))) {
            return asset($logo);
        }

        return asset('images/branch-placeholder.svg');
    }
}
