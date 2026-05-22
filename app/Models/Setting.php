<?php

namespace App\Models;

use App\Models\Product\Taxes;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'key' => 'string',
            'value' => 'string',
            'type' => 'string',
        ];
    }

    public static function getMany(array $keys): array
    {
        $rows = static::query()
            ->whereIn('key', $keys)
            ->get(['key', 'value', 'type'])
            ->keyBy('key');

        $out = [];
        foreach ($keys as $key) {
            /** @var self|null $row */
            $row = $rows->get($key);
            $out[$key] = $row ? static::castValue($row->value, $row->type) : null;
        }

        return $out;
    }

    public static function setMany(array $values, array $types = []): void
    {
        foreach ($values as $key => $value) {
            $type = $types[$key] ?? (is_numeric($value) ? 'number' : 'string');

            static::query()->updateOrCreate(
                ['key' => (string) $key],
                ['value' => $value === null ? null : (string) $value, 'type' => (string) $type],
            );
        }
    }

    private static function castValue(?string $value, ?string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'number', 'int', 'integer' => (int) $value,
            'float', 'decimal' => (float) $value,
            'bool', 'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            default => $value,
        };
    }

    /**
     * Invoice / sale number prefix from settings (Settings → Invoice).
     */
    public static function invoicePrefix(): string
    {
        $v = static::query()->where('key', 'invoice_prefix')->value('value');
        $p = is_string($v) && $v !== '' ? trim($v) : 'INV';
        $p = preg_replace('/[^A-Za-z0-9\-_]/', '', $p) ?: 'INV';

        return strlen($p) > 20 ? substr($p, 0, 20) : $p;
    }

    /**
     * Default low-stock alert level (Settings → Stock). Used when product has no quantity_alert.
     */
    public static function lowStockThreshold(): int
    {
        $row = static::query()->where('key', 'low_stock_threshold')->first(['value', 'type']);
        if ($row === null) {
            return 10;
        }

        $n = static::castValue($row->value, $row->type);
        if (is_int($n)) {
            return max(0, $n);
        }
        if (is_float($n)) {
            return max(0, (int) round($n));
        }

        return max(0, (int) $row->value);
    }

    /**
     * Default tax percentage from Settings → Tax (0–100).
     */
    public static function defaultTaxPercentage(): float
    {
        $row = static::query()->where('key', 'default_tax_percentage')->first(['value', 'type']);
        if ($row === null) {
            return 0.0;
        }

        $n = static::castValue($row->value, $row->type);
        $v = is_numeric($n) ? (float) $n : (float) $row->value;

        return max(0.0, min(100.0, $v));
    }

    /**
     * First active percentage-type catalog tax whose rate matches {@see defaultTaxPercentage()}.
     * New products can use this as the default `tax_id` when one exists.
     */
    public static function taxIdMatchingDefaultPercentage(): ?int
    {
        $pct = self::defaultTaxPercentage();

        $id = Taxes::query()
            ->where('status', 'active')
            ->where('type', 'percentage')
            ->whereRaw('ABS(CAST(rate AS DECIMAL(12,4)) - ?) < 0.005', [$pct])
            ->orderBy('id')
            ->value('id');

        return $id !== null ? (int) $id : null;
    }

    public static function currencyCode(): string
    {
        $v = static::query()->where('key', 'currency')->value('value');

        return is_string($v) && $v !== '' ? $v : 'PKR';
    }

    public static function currencySymbol(): string
    {
        $v = static::query()->where('key', 'currency_symbol')->value('value');

        return is_string($v) && $v !== '' ? trim($v) : 'Rs.';
    }

    public static function brandingPublicUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $normalized = str_replace('\\', '/', trim($path));
        $normalized = ltrim($normalized, '/');
        if ($normalized === '' || str_contains($normalized, '..')) {
            return null;
        }

        $absolute = storage_path('app/public/'.$normalized);
        if (! is_file($absolute)) {
            return null;
        }

        // Root-relative URL: works for localhost vs 127.0.0.1 and any port (avoids APP_URL host mismatch).
        return '/storage/'.$normalized;
    }

    /**
     * @return array{logo_large_url: ?string, logo_small_url: ?string, favicon_url: ?string, invoice_logo_url: ?string, receipt_signature_url: ?string}
     */
    public static function brandingUrls(): array
    {
        $paths = static::getMany([
            'logo_large_path',
            'logo_small_path',
            'favicon_path',
            'invoice_logo_path',
            'receipt_signature_path',
        ]);

        return [
            'logo_large_url' => static::brandingPublicUrl(
                is_string($paths['logo_large_path'] ?? null) ? $paths['logo_large_path'] : null,
            ),
            'logo_small_url' => static::brandingPublicUrl(
                is_string($paths['logo_small_path'] ?? null) ? $paths['logo_small_path'] : null,
            ),
            'favicon_url' => static::brandingPublicUrl(
                is_string($paths['favicon_path'] ?? null) ? $paths['favicon_path'] : null,
            ),
            'invoice_logo_url' => static::brandingPublicUrl(
                is_string($paths['invoice_logo_path'] ?? null) ? $paths['invoice_logo_path'] : null,
            ),
            'receipt_signature_url' => static::brandingPublicUrl(
                is_string($paths['receipt_signature_path'] ?? null) ? $paths['receipt_signature_path'] : null,
            ),
        ];
    }

    /** URL shown on printed/PDF invoices (invoice logo, else large logo). */
    public static function invoiceLogoUrl(): ?string
    {
        $urls = static::brandingUrls();

        return $urls['invoice_logo_url'] ?? $urls['logo_large_url'] ?? null;
    }

    /** Full http(s) URL for email clients (Gmail cannot load local disk paths). */
    public static function invoiceLogoAbsoluteUrl(): ?string
    {
        $relative = static::invoiceLogoUrl();
        if ($relative === null || $relative === '') {
            return null;
        }
        if (str_starts_with($relative, 'http://') || str_starts_with($relative, 'https://')) {
            return $relative;
        }

        return url($relative);
    }

    /** Absolute filesystem path for dompdf (invoice logo, else large logo). */
    public static function invoiceLogoPathForPdf(): ?string
    {
        $paths = static::getMany(['invoice_logo_path', 'logo_large_path']);
        $path = is_string($paths['invoice_logo_path'] ?? null) && $paths['invoice_logo_path'] !== ''
            ? $paths['invoice_logo_path']
            : (is_string($paths['logo_large_path'] ?? null) ? $paths['logo_large_path'] : null);

        return static::brandingAbsolutePath($path);
    }

    public static function brandingAbsolutePath(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        $normalized = str_replace('\\', '/', trim($path));
        $normalized = ltrim($normalized, '/');
        if ($normalized === '' || str_contains($normalized, '..')) {
            return null;
        }

        $absolute = storage_path('app/public/'.$normalized);

        return is_file($absolute) ? $absolute : null;
    }
}
