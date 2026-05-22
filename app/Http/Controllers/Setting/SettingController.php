<?php

namespace App\Http\Controllers\Setting;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrderNotificationLog;
use App\Models\Setting;
use App\Support\EnvEditor;
use App\Support\TwilioWhatsAppSender;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $keys = [
            'app_name',
            'tagline',
            'currency',
            'currency_symbol',
            'business_name',
            'business_phone',
            'business_email',
            'business_address',
            'invoice_prefix',
            'invoice_footer_text',
            'low_stock_threshold',
            'default_tax_percentage',
            'mail_mailer',
            'mail_scheme',
            'mail_host',
            'mail_port',
            'mail_username',
            'mail_password',
            'mail_from_address',
            'mail_from_name',
            'logo_large_path',
            'logo_small_path',
            'favicon_path',
            'invoice_logo_path',
            'receipt_signature_path',
            'twilio_account_sid',
            'twilio_auth_token',
            'twilio_whatsapp_from',
            'twilio_phone_country_code',
        ];

        $defaults = [
            'app_name' => 'POS System',
            'tagline' => 'Modern Point of Sale Solution',
            'currency' => 'PKR',
            'currency_symbol' => 'Rs.',
            'business_name' => 'My POS Store',
            'business_phone' => '+92 300 1234567',
            'business_email' => 'info@posstore.com',
            'business_address' => '123 Business Street, City, Country',
            'invoice_prefix' => 'INV',
            'invoice_footer_text' => 'Thank you for your business!',
            'low_stock_threshold' => 10,
            'default_tax_percentage' => 0,
            'mail_mailer' => (string) config('mail.default', 'log'),
            'mail_scheme' => (string) (config('mail.mailers.smtp.scheme') ?? ''),
            'mail_host' => (string) config('mail.mailers.smtp.host', '127.0.0.1'),
            'mail_port' => (int) config('mail.mailers.smtp.port', 2525),
            'mail_username' => (string) (config('mail.mailers.smtp.username') ?? ''),
            'mail_password' => (string) (config('mail.mailers.smtp.password') ?? ''),
            'mail_from_address' => (string) config('mail.from.address', 'hello@example.com'),
            'mail_from_name' => (string) config('mail.from.name', config('app.name', 'Laravel')),
            'twilio_account_sid' => (string) (config('services.twilio.account_sid') ?? ''),
            'twilio_auth_token' => (string) (config('services.twilio.auth_token') ?? ''),
            'twilio_whatsapp_from' => (string) (config('services.twilio.whatsapp_from') ?? ''),
            'twilio_phone_country_code' => (string) (config('services.twilio.phone_country_code') ?? '+92'),
        ];

        $settings = Setting::getMany($keys);
        foreach ($defaults as $k => $v) {
            if (! array_key_exists($k, $settings) || $settings[$k] === null || $settings[$k] === '') {
                $settings[$k] = $v;
            }
        }

        foreach (['logo_large_path', 'logo_small_path', 'favicon_path', 'invoice_logo_path', 'receipt_signature_path'] as $pathKey) {
            if (! is_string($settings[$pathKey] ?? null)) {
                $settings[$pathKey] = '';
            }
        }

        $ccRaw = (string) ($settings['twilio_phone_country_code'] ?? '');
        if (
            $ccRaw !== ''
            && ! str_starts_with($ccRaw, '+')
            && preg_match('/^[0-9]{1,9}$/', $ccRaw) === 1
        ) {
            $settings['twilio_phone_country_code'] = '+'.$ccRaw;
        }

        $currencies = [
            ['code' => 'PKR', 'name' => 'Pakistani Rupee (PKR)', 'symbol' => 'Rs.'],
            ['code' => 'USD', 'name' => 'US Dollar (USD)', 'symbol' => '$'],
            ['code' => 'EUR', 'name' => 'Euro (EUR)', 'symbol' => '€'],
            ['code' => 'GBP', 'name' => 'British Pound (GBP)', 'symbol' => '£'],
            ['code' => 'SAR', 'name' => 'Saudi Riyal (SAR)', 'symbol' => 'ر.س'],
            ['code' => 'AED', 'name' => 'UAE Dirham (AED)', 'symbol' => 'د.إ'],
        ];

        $sender = app(TwilioWhatsAppSender::class);

        return Inertia::render('Setting/Index', [
            'settings' => $settings,
            'currencies' => $currencies,
            'brandingUrls' => Setting::brandingUrls(),
            'notificationAnalysis' => self::notificationAnalysisPayload($sender),
            'canViewReports' => $request->user()?->can('reports.view') ?? false,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private static function notificationAnalysisPayload(TwilioWhatsAppSender $sender): array
    {
        $whatsappByStatus = PurchaseOrderNotificationLog::query()
            ->selectRaw('whatsapp_status as k, COUNT(*) as c')
            ->groupBy('whatsapp_status')
            ->pluck('c', 'k')
            ->map(fn ($n) => (int) $n)
            ->all();

        $emailByStatus = PurchaseOrderNotificationLog::query()
            ->selectRaw('email_status as k, COUNT(*) as c')
            ->groupBy('email_status')
            ->pluck('c', 'k')
            ->map(fn ($n) => (int) $n)
            ->all();

        $recent = PurchaseOrderNotificationLog::query()
            ->with(['purchaseOrder:id,order_number', 'user:id,name'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(static function (PurchaseOrderNotificationLog $log) {
                return [
                    'id' => $log->id,
                    'created_at' => $log->created_at?->toIso8601String(),
                    'order_number' => $log->purchaseOrder?->order_number,
                    'purchase_order_id' => $log->purchase_order_id,
                    'whatsapp_status' => $log->whatsapp_status,
                    'whatsapp_detail' => Str::limit((string) ($log->whatsapp_detail ?? ''), 96),
                    'email_status' => $log->email_status,
                    'email_detail' => Str::limit((string) ($log->email_detail ?? ''), 96),
                    'user_name' => $log->user?->name,
                ];
            })
            ->values()
            ->all();

        return [
            'whatsapp_ready' => $sender->configured(),
            'log_total' => PurchaseOrderNotificationLog::query()->count(),
            'whatsapp_by_status' => $whatsappByStatus,
            'email_by_status' => $emailByStatus,
            'recent' => $recent,
        ];
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:160'],
            'currency' => ['required', 'string', 'max:10'],
            'currency_symbol' => ['required', 'string', 'max:10'],
            'business_name' => ['required', 'string', 'max:160'],
            'business_phone' => ['nullable', 'string', 'max:30'],
            'business_email' => ['nullable', 'email', 'max:160'],
            'business_address' => ['nullable', 'string', 'max:500'],
            'invoice_prefix' => ['required', 'string', 'max:20'],
            'invoice_footer_text' => ['nullable', 'string', 'max:500'],
            'low_stock_threshold' => ['required', 'integer', 'min:0', 'max:1000000'],
            'default_tax_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'mail_mailer' => ['required', 'string', 'max:50'],
            'mail_scheme' => ['nullable', 'string', 'max:20'],
            'mail_host' => ['nullable', 'string', 'max:255'],
            'mail_port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'mail_username' => ['nullable', 'string', 'max:255'],
            'mail_password' => ['nullable', 'string', 'max:255'],
            'mail_from_address' => ['nullable', 'email', 'max:255'],
            'mail_from_name' => ['nullable', 'string', 'max:255'],
            'twilio_account_sid' => ['nullable', 'string', 'max:255'],
            'twilio_auth_token' => ['nullable', 'string', 'max:512'],
            'twilio_whatsapp_from' => ['nullable', 'string', 'max:120'],
            'twilio_phone_country_code' => ['nullable', 'string', 'max:12', 'regex:/^(\+?[0-9]{1,9})?$/'],
            'logo_large' => ['nullable', 'file', 'max:4096', 'mimes:jpg,jpeg,png,webp,gif,svg'],
            'logo_small' => ['nullable', 'file', 'max:4096', 'mimes:jpg,jpeg,png,webp,gif,svg'],
            'favicon' => ['nullable', 'file', 'max:1024', 'mimes:jpg,jpeg,png,webp,gif,svg,ico'],
            'invoice_logo' => ['nullable', 'file', 'max:4096', 'mimes:jpg,jpeg,png,webp,gif,svg'],
            'receipt_signature' => ['nullable', 'file', 'max:2048', 'mimes:jpg,jpeg,png,webp,gif,svg'],
            'remove_logo_large' => ['sometimes', 'boolean'],
            'remove_logo_small' => ['sometimes', 'boolean'],
            'remove_favicon' => ['sometimes', 'boolean'],
            'remove_invoice_logo' => ['sometimes', 'boolean'],
            'remove_receipt_signature' => ['sometimes', 'boolean'],
        ]);

        $forSettings = collect($validated)
            ->except([
                'logo_large',
                'logo_small',
                'favicon',
                'invoice_logo',
                'receipt_signature',
                'remove_logo_large',
                'remove_logo_small',
                'remove_favicon',
                'remove_invoice_logo',
                'remove_receipt_signature',
            ])
            ->all();

        Setting::setMany($forSettings, [
            'low_stock_threshold' => 'number',
            'default_tax_percentage' => 'float',
            'mail_port' => 'number',
        ]);

        $this->syncBrandingUpload(
            $request,
            'logo_large',
            'logo_large_path',
            $request->boolean('remove_logo_large'),
        );
        $this->syncBrandingUpload(
            $request,
            'logo_small',
            'logo_small_path',
            $request->boolean('remove_logo_small'),
        );
        $this->syncBrandingUpload(
            $request,
            'favicon',
            'favicon_path',
            $request->boolean('remove_favicon'),
        );
        $this->syncBrandingUpload(
            $request,
            'invoice_logo',
            'invoice_logo_path',
            $request->boolean('remove_invoice_logo'),
        );
        $this->syncBrandingUpload(
            $request,
            'receipt_signature',
            'receipt_signature_path',
            $request->boolean('remove_receipt_signature'),
        );

        Cache::store('file')->forget('settings.mail');

        try {
            app(EnvEditor::class)->update([
                'APP_NAME' => $validated['app_name'],
                'MAIL_MAILER' => $validated['mail_mailer'] ?? null,
                'MAIL_SCHEME' => $validated['mail_scheme'] ?? null,
                'MAIL_HOST' => $validated['mail_host'] ?? null,
                'MAIL_PORT' => $validated['mail_port'] ?? null,
                'MAIL_USERNAME' => $validated['mail_username'] ?? null,
                'MAIL_PASSWORD' => $validated['mail_password'] ?? null,
                'MAIL_FROM_ADDRESS' => $validated['mail_from_address'] ?? null,
                'MAIL_FROM_NAME' => $validated['mail_from_name'] ?? null,
                'TWILIO_ACCOUNT_SID' => ($validated['twilio_account_sid'] ?? '') !== ''
                    ? $validated['twilio_account_sid']
                    : null,
                'TWILIO_AUTH_TOKEN' => ($validated['twilio_auth_token'] ?? '') !== ''
                    ? $validated['twilio_auth_token']
                    : null,
                'TWILIO_WHATSAPP_FROM' => ($validated['twilio_whatsapp_from'] ?? '') !== ''
                    ? $validated['twilio_whatsapp_from']
                    : null,
                'TWILIO_PHONE_COUNTRY_CODE' => ($validated['twilio_phone_country_code'] ?? '') !== ''
                    ? $validated['twilio_phone_country_code']
                    : null,
            ]);

            Artisan::call('config:clear');
        } catch (\Throwable $e) {
            return redirect()
                ->route('settings.index')
                ->with('error', 'Settings saved, but .env update failed: '.$e->getMessage());
        }

        return redirect()->route('settings.index')->with('success', 'Settings saved successfully.');
    }

    private function syncBrandingUpload(Request $request, string $fileKey, string $settingKey, bool $remove): void
    {
        if ($request->hasFile($fileKey)) {
            $this->deleteBrandingStoredPath($settingKey);
            $path = $request->file($fileKey)->store('settings/branding', 'public');
            Setting::setMany([$settingKey => $path], [$settingKey => 'string']);

            return;
        }

        if ($remove) {
            $this->deleteBrandingStoredPath($settingKey);
            Setting::setMany([$settingKey => ''], [$settingKey => 'string']);
        }
    }

    private function deleteBrandingStoredPath(string $settingKey): void
    {
        $path = Setting::query()->where('key', $settingKey)->value('value');
        if (is_string($path) && $path !== '' && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
