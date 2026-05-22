<?php

namespace Database\Seeders;

use App\Models\Product\Brand;
use App\Models\Product\Category;
use App\Models\Product\Product;
use App\Models\Product\ProductVarient;
use App\Models\Product\SubCategory;
use App\Models\Product\Taxes;
use App\Models\Product\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $category = Category::firstOrCreate(
            ['slug' => 'general'],
            [
                'name' => 'General',
                'status' => 'active',
            ]
        );

        $sub = SubCategory::firstOrCreate(
            ['slug' => 'misc'],
            [
                'category_id' => $category->id,
                'name' => 'Miscellaneous',
                'status' => 'active',
            ]
        );

        $brand = Brand::firstOrCreate(
            ['slug' => 'generic'],
            [
                'name' => 'Generic',
                'status' => 'active',
            ]
        );

        $unit = Unit::firstOrCreate(
            ['slug' => 'piece'],
            [
                'name' => 'Piece',
                'symbol' => 'PC',
                'status' => 'active',
            ]
        );

        $tax = Taxes::firstOrCreate(
            ['code' => 'GST-STD'],
            [
                'name' => 'Standard GST',
                'slug' => 'standard-gst',
                'rate' => 18,
                'type' => 'percentage',
                'status' => 'active',
            ]
        );

        $demoProducts = [
            [
                'name' => 'Demo Product A',
            ],
            [
                'name' => 'Demo Product B',
            ],
        ];

        foreach ($demoProducts as $row) {
            $slug = Str::slug($row['name']);
            $product = Product::firstOrCreate(
                ['slug' => $slug],
                [
                    'category_id' => $category->id,
                    'sub_category_id' => $sub->id,
                    'brand_id' => $brand->id,
                    'unit_id' => $unit->id,
                    'tax_id' => $tax->id,
                    'name' => $row['name'],
                    'slug' => $slug,
                    'type' => 'simple',
                    'sale_type' => 'quantity',
                    'status' => 'active',
                ]
            );

            ProductVarient::firstOrCreate(
                ['product_id' => $product->id],
                [
                    'name' => $product->name,
                    'sku' => 'SEED-'.$product->id,
                    'barcode' => null,
                    'cost_price' => 0,
                    'selling_price' => 0,
                    'status' => 'active',
                ]
            );
        }
    }
}
