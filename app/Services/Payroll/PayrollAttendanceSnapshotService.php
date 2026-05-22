<?php

namespace App\Services\Payroll;

use App\Models\Attendance;
use Illuminate\Support\Carbon;

class PayrollAttendanceSnapshotService
{
    /**
     * Summarize attendance for one employee in a calendar month.
     * Intended to be stored on payrolls when saving, and returned by the live preview API.
     *
     * @return array{
     *     period: array{start: string, end: string},
     *     records: int,
     *     by_status: array{present: int, absent: int, late: int, leave: int, other: int},
     *     totals: array{working_hours: float, late_minutes: int, overtime_minutes: int}
     * }
     */
    public function build(int $employeeId, int $year, int $month): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $rows = Attendance::query()
            ->where('employee_id', $employeeId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get(['status', 'working_hours', 'late_minutes', 'overtime_minutes']);

        $by = [
            'present' => 0,
            'absent' => 0,
            'late' => 0,
            'leave' => 0,
            'other' => 0,
        ];
        $totalWorking = 0.0;
        $lateM = 0;
        $otM = 0;

        foreach ($rows as $row) {
            $s = (string) $row->status;
            if (isset($by[$s])) {
                $by[$s]++;
            } else {
                $by['other']++;
            }
            $totalWorking += (float) $row->working_hours;
            $lateM += (int) $row->late_minutes;
            $otM += (int) $row->overtime_minutes;
        }

        return [
            'period' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'records' => $rows->count(),
            'by_status' => $by,
            'totals' => [
                'working_hours' => round($totalWorking, 2),
                'late_minutes' => $lateM,
                'overtime_minutes' => $otM,
            ],
        ];
    }
}
