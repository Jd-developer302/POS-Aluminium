<?php

namespace App\Models;

use App\Models\Company\Branch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Employee extends Model
{
    use SoftDeletes;

    public function getRouteKeyName(): string
    {
        return 'employee_id';
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'department_id',
        'designation_id',
        'user_id',
        'employee_id',
        'name',
        'slug',
        'email',
        'phone',
        'photo',
        'salary',
        'joining_date',
        'gender',
        'birth_date',
        'address',
        'status',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'photo_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'salary' => 'decimal:2', // nullable: current salary
            'joining_date' => 'date',
            'birth_date' => 'date',
            'status' => 'string',
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
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * @return BelongsTo<Designation, $this>
     */
    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Attendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * @return HasMany<LeaveBalance, $this>
     */
    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }

    /**
     * @return HasMany<Leave, $this>
     */
    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }

    /**
     * @return HasMany<Payroll, $this>
     */
    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        $photo = $this->attributes['photo'] ?? null;
        if (! $photo) {
            return null;
        }

        if (str_starts_with($photo, 'employees/')) {
            if (! Storage::disk('public')->exists($photo)) {
                return null;
            }

            return '/storage/'.$photo;
        }

        return $photo;
    }
}
