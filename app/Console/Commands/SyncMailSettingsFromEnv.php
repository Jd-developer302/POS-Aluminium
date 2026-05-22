<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyncMailSettingsFromEnv extends Command
{
    protected $signature = 'settings:sync-mail-from-env';

    protected $description = 'Copy MAIL_* values from .env into Settings (used by the app for outgoing mail).';

    public function handle(): int
    {
        $scheme = env('MAIL_SCHEME');
        if (($scheme === null || $scheme === '') && strtolower((string) env('MAIL_ENCRYPTION', '')) === 'ssl') {
            $scheme = 'smtps';
        }

        Setting::setMany([
            'mail_mailer' => env('MAIL_MAILER', 'smtp'),
            'mail_host' => env('MAIL_HOST'),
            'mail_port' => (int) env('MAIL_PORT', 587),
            'mail_username' => env('MAIL_USERNAME'),
            'mail_password' => env('MAIL_PASSWORD'),
            'mail_scheme' => $scheme ?? '',
            'mail_from_address' => env('MAIL_FROM_ADDRESS'),
            'mail_from_name' => env('MAIL_FROM_NAME'),
        ], [
            'mail_port' => 'number',
        ]);

        Cache::store('file')->forget('settings.mail');

        $this->info('Mail settings synced from .env.');
        $this->line('Host: '.(string) env('MAIL_HOST'));
        $this->line('Port: '.(string) env('MAIL_PORT'));
        $this->line('Scheme: '.(string) ($scheme ?? ''));

        return self::SUCCESS;
    }
}
