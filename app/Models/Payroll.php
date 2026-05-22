<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payroll extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'basic_salary',
        'total_allowance',
        'total_deduction',
        'net_salary',
        'status',
        'payment_date',
        'payment_mode',
        'attendance_snapshot',
        'attendance_synced_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
            'basic_salary' => 'decimal:2',
            'total_allowance' => 'decimal:2',
            'total_deduction' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'payment_date' => 'date',
            'status' => 'string',
            'payment_mode' => 'string',
            'attendance_snapshot' => 'array',
            'attendance_synced_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return HasMany<PayrollItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }
}
