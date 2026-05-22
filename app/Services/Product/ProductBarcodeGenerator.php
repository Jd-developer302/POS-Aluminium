<?php

namespace App\Services\Product;

use App\Models\Product\ProductVarient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ProductBarcodeGenerator
{
    /** First barcode issued when nothing higher exists yet. */
    private const START_SEQUENCE = 100000123456;

    private const MAX_SEQUENCE = 999999999999;

    private const LOCK_KEY = 'product-barcode-sequence';

    /**
     * Next unique 12-digit numeric barcode, sequential from {@see START_SEQUENCE}.
     */
    public function generateUnique(): string
    {
        $lock = Cache::lock(self::LOCK_KEY, 10);

        return $lock->block(5, function (): string {
            return DB::transaction(function (): string {
                $maxInt = $this->maxAssignedNumeric12();

                $next = max(self::START_SEQUENCE, $maxInt + 1);

                if ($next > self::MAX_SEQUENCE) {
                    throw new RuntimeException('12-digit barcode range is exhausted.');
                }

                return str_pad((string) $next, 12, '0', STR_PAD_LEFT);
            });
        });
    }

    /**
     * Highest existing 12-digit numeric barcode (including soft-deleted variants).
     */
    private function maxAssignedNumeric12(): int
    {
        $q = ProductVarient::query()
            ->withTrashed()
            ->whereNotNull('barcode');

        $q = match ($this->driver()) {
            'mysql', 'mariadb' => $q->whereRaw('barcode REGEXP ?', ['^[0-9]{12}$']),
            'sqlite' => $q->whereRaw(
                "barcode GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'",
            ),
            default => $q->whereRaw("barcode ~ '^[0-9]{12}$'"),
        };

        $cast = match ($this->driver()) {
            'mysql', 'mariadb' => 'CAST(barcode AS UNSIGNED)',
            'sqlite' => 'CAST(barcode AS INTEGER)',
            default => 'CAST(barcode AS BIGINT)',
        };

        $max = $q->lockForUpdate()->max(DB::raw($cast));

        return $max !== null ? (int) $max : 0;
    }

    private function driver(): string
    {
        return ProductVarient::query()->getConnection()->getDriverName();
    }
}
