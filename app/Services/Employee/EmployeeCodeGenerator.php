<?php

namespace App\Services\Employee;

use App\Models\Employee;

class EmployeeCodeGenerator
{
    private const PREFIX = 'EMP';

    private const WIDTH = 5;

    /**
     * Next code in `EMP` + 5 zero-padded digits (e.g. EMP00001), based on existing rows matching the pattern.
     * Includes soft-deleted rows for numbering so codes are not reused.
     */
    public function next(): string
    {
        $max = 0;
        $query = Employee::query()->withTrashed()->where('employee_id', 'like', self::PREFIX.'%');
        foreach ($query->pluck('employee_id') as $code) {
            if (is_string($code) && preg_match('/^'.preg_quote(self::PREFIX, '/').'(\d+)$/i', $code, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        return self::PREFIX.str_pad((string) ($max + 1), self::WIDTH, '0', STR_PAD_LEFT);
    }
}
