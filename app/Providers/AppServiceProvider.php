<?php

namespace App\Providers;

use App\Models\Company\Branch;
use App\Models\Company\Warehouse;
use App\Models\Product\Brand;
use App\Models\Product\Category;
use App\Models\Product\Product;
use App\Models\Product\SubCategory;
use App\Models\Product\Taxes;
use App\Models\Product\Unit;
use App\Models\Setting;
use App\Policies\BranchPolicy;
use App\Policies\BrandPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\ProductPolicy;
use App\Policies\SubCategoryPolicy;
use App\Policies\TaxPolicy;
use App\Policies\UnitPolicy;
use App\Policies\WarehousePolicy;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (
            ! $this->app->bound('dompdf.wrapper')
            && class_exists(\Barryvdh\DomPDF\ServiceProvider::class)
        ) {
            $this->app->register(\Barryvdh\DomPDF\ServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Use file cache here so bootstrap doesn't break
        // when CACHE_STORE=database but the cache table isn't migrated yet.
        try {
            $mail = Cache::store('file')->remember('settings.mail', now()->addMinutes(5), function () {
                return Setting::getMany([
                    'mail_mailer',
                    'mail_scheme',
                    'mail_host',
                    'mail_port',
                    'mail_username',
                    'mail_password',
                    'mail_from_address',
                    'mail_from_name',
                ]);
            });
        } catch (\Throwable) {
            $mail = [];
        }

        if (! empty($mail['mail_mailer'])) {
            Config::set('mail.default', $mail['mail_mailer']);
        }

        $smtpHost = $mail['mail_host'] ?? null;
        $smtpPort = $mail['mail_port'] ?? null;
        $smtpUser = $mail['mail_username'] ?? null;
        $smtpPass = $mail['mail_password'] ?? null;
        $smtpScheme = $mail['mail_scheme'] ?? null;

        if ($smtpHost !== null && $smtpHost !== '') {
            Config::set('mail.mailers.smtp.host', $smtpHost);
        }
        if ($smtpPort !== null && $smtpPort !== '') {
            Config::set('mail.mailers.smtp.port', (int) $smtpPort);
        }
        if ($smtpUser !== null && $smtpUser !== '') {
            Config::set('mail.mailers.smtp.username', $smtpUser);
        }
        if ($smtpPass !== null && $smtpPass !== '') {
            Config::set('mail.mailers.smtp.password', $smtpPass);
        }
        if ($smtpScheme !== null && $smtpScheme !== '') {
            Config::set('mail.mailers.smtp.scheme', $smtpScheme);
        }

        $fromAddress = $mail['mail_from_address'] ?? null;
        $fromName = $mail['mail_from_name'] ?? null;
        if ($fromAddress !== null && $fromAddress !== '') {
            Config::set('mail.from.address', $fromAddress);
        }
        if ($fromName !== null && $fromName !== '') {
            Config::set('mail.from.name', $fromName);
        }

        Gate::policy(Branch::class, BranchPolicy::class);
        Gate::policy(Warehouse::class, WarehousePolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(SubCategory::class, SubCategoryPolicy::class);
        Gate::policy(Brand::class, BrandPolicy::class);
        Gate::policy(Taxes::class, TaxPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Unit::class, UnitPolicy::class);
    }
}
