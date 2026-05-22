<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveBalance extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'leave_type_id',
        'total_days',
        'used_days',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'remaining_days',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_days' => 'integer',
            'used_days' => 'integer',
        ];
    }

    public function getRemainingDaysAttribute(): int
    {
        $t = (int) ($this->attributes['total_days'] ?? 0);
        $u = (int) ($this->attributes['used_days'] ?? 0);

        return max(0, $t - $u);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * @return BelongsTo<LeaveType, $this>
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }
}
