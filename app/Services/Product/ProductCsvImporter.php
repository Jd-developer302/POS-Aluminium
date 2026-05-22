<?php

namespace App\Services\Product;

use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Product\SubCategory;
use App\Models\Setting;
use Illuminate\Support\Facades\Validator;

class ProductCsvImporter
{
    private const MAX_ROWS = 2000;

    public function __construct(
        private readonly ProductBarcodeGenerator $barcodeGenerator,
    ) {}

    /**
     * @return array{created: int, updated: int, skipped: int, errors: list<array{line: int, message: string}>}
     */
    public function import(string $absolutePath, bool $addForSync): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        $handle = fopen($absolutePath, 'rb');
        if ($handle === false) {
            return [
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [['line' => 0, 'message' => 'Could not read the uploaded file.']],
            ];
        }

        $maybeBom = fread($handle, 3);
        if ($maybeBom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $headerRow = fgetcsv($handle);
        if ($headerRow === false || $headerRow === [null]) {
            fclose($handle);

            return [
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'errors' => [['line' => 1, 'message' => 'The CSV has no header row.']],
            ];
        }

        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $headerRow);
        $requiredColumns = ['category_id', 'sub_category_id', 'unit_id', 'name', 'sku'];
        foreach ($requiredColumns as $col) {
            if (! in_array($col, $header, true)) {
                fclose($handle);

                return [
                    'created' => 0,
                    'updated' => 0,
                    'skipped' => 0,
                    'errors' => [['line' => 1, 'message' => "Missing required column: {$col}"]],
                ];
            }
        }

        $line = 1;
        $processed = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $line++;
            if ($this->rowIsEmpty($row)) {
                continue;
            }

            if ($processed >= self::MAX_ROWS) {
                $errors[] = [
                    'line' => $line,
                    'message' => 'Row limit reached ('.self::MAX_ROWS.' rows). Remaining lines were not processed.',
                ];
                break;
            }

            $processed++;
            $assoc = $this->combineRow($header, $row);
            if ($assoc === null) {
                $errors[] = ['line' => $line, 'message' => 'Column count does not match the header.'];

                continue;
            }

            if (isset($assoc['sku']) && strtoupper(trim((string) $assoc['sku'])) === 'EXAMPLE-SKU') {
                continue;
            }

            $payload = $this->normalizePayload($assoc);
            if (is_string($payload)) {
                $errors[] = ['line' => $line, 'message' => $payload];

                continue;
            }

            $existingVariant = ProductVarient::query()
                ->where('sku', $payload['variant']['sku'])
                ->first();

            if ($existingVariant !== null) {
                if (! $addForSync) {
                    $skipped++;

                    continue;
                }

                $nextBarcode = $this->resolveBarcodeForUpdate(
                    $payload['variant']['barcode'],
                    $existingVariant->barcode,
                );

                $barcodeErr = $this->validateBarcodeUnique(
                    $nextBarcode,
                    $existingVariant->id,
                );
                if ($barcodeErr !== null) {
                    $errors[] = ['line' => $line, 'message' => $barcodeErr];

                    continue;
                }

                $product = $existingVariant->product;
                $product->fill($payload['product']);
                $product->save();
                $existingVariant->update([
                    'name' => $payload['product']['name'],
                    'barcode' => $nextBarcode,
                    'cost_price' => $payload['variant']['cost_price'],
                    'selling_price' => $payload['variant']['selling_price'],
                ]);
                $updated++;

                continue;
            }

            $nextBarcode = $this->resolveBarcodeForCreate(
                $payload['variant']['barcode'],
            );

            $barcodeErr = $this->validateBarcodeUnique($nextBarcode, null);
            if ($barcodeErr !== null) {
                $errors[] = ['line' => $line, 'message' => $barcodeErr];

                continue;
            }

            $payload['variant']['barcode'] = $nextBarcode;

            $product = Product::create($payload['product']);
            ProductVarient::create([
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $payload['variant']['sku'],
                'barcode' => $nextBarcode,
                'cost_price' => $payload['variant']['cost_price'],
                'selling_price' => $payload['variant']['selling_price'],
                'status' => 'active',
            ]);
            $created++;
        }

        fclose($handle);

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * @param  list<string|null>  $row
     */
    private function rowIsEmpty(array $row): bool
    {
        $joined = trim(implode('', array_map(fn ($c) => (string) $c, $row)));

        return $joined === '';
    }

    /**
     * @param  list<string>  $header
     * @param  list<string|null>  $row
     * @return array<string, string>|null
     */
    private function combineRow(array $header, array $row): ?array
    {
        $count = count($header);
        if (count($row) < $count) {
            $row = [...$row, ...array_fill(0, $count - count($row), '')];
        } elseif (count($row) > $count) {
            $row = array_slice($row, 0, $count);
        }

        /** @var array<string, string> $out */
        $out = array_combine($header, array_map(fn ($v) => trim((string) $v), $row));

        return $out;
    }

    /**
     * @param  array<string, string>  $assoc
     * @return array{product: array<string, mixed>, variant: array<string, mixed>}|string
     */
    private function normalizePayload(array $assoc): array|string
    {
        $categoryId = (int) ($assoc['category_id'] ?? 0);
        $subCategoryId = (int) ($assoc['sub_category_id'] ?? 0);
        $unitId = (int) ($assoc['unit_id'] ?? 0);
        $name = trim((string) ($assoc['name'] ?? ''));
        $sku = trim((string) ($assoc['sku'] ?? ''));

        if ($name === '' || $sku === '') {
            return 'Name and SKU are required.';
        }

        if ($categoryId < 1 || $subCategoryId < 1 || $unitId < 1) {
            return 'category_id, sub_category_id, and unit_id must be positive integers.';
        }

        if (! SubCategory::query()->where('id', $subCategoryId)->where('category_id', $categoryId)->exists()) {
            return 'sub_category_id must belong to the given category_id.';
        }

        $brandRaw = $assoc['brand_id'] ?? '';
        $taxRaw = $assoc['tax_id'] ?? '';
        $brandId = $brandRaw === '' ? null : (int) $brandRaw;
        $taxId = $taxRaw === '' ? null : (int) $taxRaw;

        if ($brandId !== null && $brandId < 1) {
            $brandId = null;
        }
        if ($taxId !== null && $taxId < 1) {
            $taxId = null;
        }

        if ($taxId === null) {
            $taxId = Setting::taxIdMatchingDefaultPercentage();
        }

        $barcode = trim((string) ($assoc['barcode'] ?? ''));
        $barcode = $barcode === '' ? null : $barcode;

        $csvType = strtolower(trim((string) ($assoc['type'] ?? 'normal')));
        if (! in_array($csvType, ['normal', 'recipe', 'variation', 'master'], true)) {
            $csvType = 'normal';
        }

        $dbType = match ($csvType) {
            'normal', 'recipe' => 'simple',
            'variation', 'master' => 'variable',
            default => 'simple',
        };

        $saleType = strtolower(trim((string) ($assoc['sale_type'] ?? 'quantity')));
        if (! in_array($saleType, ['quantity', 'weight'], true)) {
            $saleType = 'quantity';
        }

        $status = strtolower(trim((string) ($assoc['status'] ?? 'active')));
        if (! in_array($status, ['active', 'inactive'], true)) {
            $status = 'active';
        }

        $purchase = $this->decimalOrDefault($assoc['purchase_price'] ?? '0');
        $sale = $this->decimalOrDefault($assoc['sale_price'] ?? '0');
        $packSale = $this->decimalOrDefault($assoc['pack_sale_price'] ?? '0');
        $cartonSale = $this->decimalOrDefault($assoc['carton_sale_price'] ?? '0');

        $qtyPack = max(1, (int) ($assoc['quantity_in_pack'] ?? 1));
        $packCarton = max(1, (int) ($assoc['pack_in_carton'] ?? 1));

        $description = trim((string) ($assoc['description'] ?? ''));
        $description = $description === '' ? null : $description;

        $validator = Validator::make(
            [
                'category_id' => $categoryId,
                'sub_category_id' => $subCategoryId,
                'brand_id' => $brandId,
                'unit_id' => $unitId,
                'tax_id' => $taxId,
                'name' => $name,
                'sku' => $sku,
                'barcode' => $barcode,
                'type' => $dbType,
                'sale_type' => $saleType,
                'purchase_price' => $purchase,
                'sale_price' => $sale,
                'pack_sale_price' => $packSale,
                'carton_sale_price' => $cartonSale,
                'quantity_in_pack' => $qtyPack,
                'pack_in_carton' => $packCarton,
                'status' => $status,
            ],
            [
                'category_id' => ['required', 'integer', 'exists:categories,id'],
                'sub_category_id' => ['required', 'integer', 'exists:sub_categories,id'],
                'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
                'unit_id' => ['required', 'integer', 'exists:units,id'],
                'tax_id' => ['nullable', 'integer', 'exists:taxes,id'],
                'name' => ['required', 'string', 'max:255'],
                'sku' => ['required', 'string', 'max:100'],
                'barcode' => ['nullable', 'string', 'regex:/^\d{12}$/'],
                'type' => ['required', 'in:simple,variable'],
                'sale_type' => ['required', 'in:quantity,weight'],
                'purchase_price' => ['required', 'numeric', 'min:0'],
                'sale_price' => ['required', 'numeric', 'min:0'],
                'pack_sale_price' => ['nullable', 'numeric', 'min:0'],
                'carton_sale_price' => ['nullable', 'numeric', 'min:0'],
                'quantity_in_pack' => ['required', 'integer', 'min:1'],
                'pack_in_carton' => ['required', 'integer', 'min:1'],
                'status' => ['required', 'in:active,inactive'],
            ],
        );

        if ($validator->fails()) {
            return $validator->errors()->first() ?? 'Validation failed.';
        }

        return [
            'product' => [
                'category_id' => $categoryId,
                'sub_category_id' => $subCategoryId,
                'brand_id' => $brandId,
                'unit_id' => $unitId,
                'tax_id' => $taxId,
                'name' => $name,
                'type' => $dbType,
                'sale_type' => $saleType,
                'quantity_in_pack' => $qtyPack,
                'pack_in_carton' => $packCarton,
                'description' => $description,
                'status' => $status,
                'alert' => false,
                'alert_message' => null,
                'expiry_alert' => null,
                'quantity_alert' => null,
            ],
            'variant' => [
                'sku' => $sku,
                'barcode' => $barcode,
                'cost_price' => $purchase,
                'selling_price' => $sale,
            ],
        ];
    }

    private function decimalOrDefault(string $value): string
    {
        if (! is_numeric(trim($value))) {
            return '0.00';
        }

        return number_format((float) $value, 2, '.', '');
    }

    private function validateBarcodeUnique(?string $barcode, ?int $ignoreVariantId): ?string
    {
        if ($barcode === null || $barcode === '') {
            return 'Barcode is required after import normalization.';
        }

        $q = ProductVarient::query()->where('barcode', $barcode);
        if ($ignoreVariantId !== null) {
            $q->where('id', '!=', $ignoreVariantId);
        }

        if ($q->exists()) {
            return 'Barcode is already used by another variant.';
        }

        return null;
    }

    private function resolveBarcodeForCreate(?string $fromCsv): string
    {
        $b = trim((string) $fromCsv);

        if ($b !== '' && preg_match('/^\d{12}$/', $b) === 1) {
            return $b;
        }

        return $this->barcodeGenerator->generateUnique();
    }

    private function resolveBarcodeForUpdate(
        ?string $fromCsv,
        ?string $existing,
    ): string {
        $b = trim((string) $fromCsv);

        if ($b === '') {
            $keep = trim((string) $existing);

            return $keep !== '' ? $keep : $this->barcodeGenerator->generateUnique();
        }

        if (preg_match('/^\d{12}$/', $b) === 1) {
            return $b;
        }

        return $this->barcodeGenerator->generateUnique();
    }
}
