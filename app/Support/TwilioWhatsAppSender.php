<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;

final class TwilioWhatsAppSender
{
    public function configured(): bool
    {
        $sid = config('services.twilio.account_sid');
        $token = config('services.twilio.auth_token');
        $from = config('services.twilio.whatsapp_from');

        return is_string($sid) && $sid !== ''
            && is_string($token) && $token !== ''
            && is_string($from) && $from !== '';
    }

    /**
     * @return array{ok: bool, detail: string}
     */
    public function sendWhatsApp(string $toE164, string $body): array
    {
        if (! $this->configured()) {
            return ['ok' => false, 'detail' => 'Twilio WhatsApp not configured'];
        }

        $sid = (string) config('services.twilio.account_sid');
        $token = (string) config('services.twilio.auth_token');
        $from = (string) config('services.twilio.whatsapp_from');

        $fromWa = str_starts_with($from, 'whatsapp:') ? $from : 'whatsapp:'.$from;
        $toWa = str_starts_with($toE164, 'whatsapp:') ? $toE164 : 'whatsapp:'.$toE164;

        try {
            $response = Http::withBasicAuth($sid, $token)
                ->asForm()
                ->timeout(30)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                    'From' => $fromWa,
                    'To' => $toWa,
                    'Body' => $body,
                ]);

            if ($response->successful()) {
                return ['ok' => true, 'detail' => 'Queued via Twilio'];
            }

            return ['ok' => false, 'detail' => $response->body()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'detail' => $e->getMessage()];
        }
    }

    public static function normalizePhone(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $t = trim($raw);

        if (str_starts_with($t, '+')) {
            $digits = preg_replace('/\D/', '', $t);

            return ($digits !== '' && strlen($digits) >= 10) ? '+'.$digits : null;
        }

        $digits = preg_replace('/\D/', '', $t);

        if ($digits === '') {
            return null;
        }

        $cc = preg_replace('/\D/', '', (string) config('services.twilio.phone_country_code', '92'));

        if ($cc !== '' && str_starts_with($digits, '0')) {
            $digits = $cc.substr($digits, 1);
        } elseif ($cc !== '' && ! str_starts_with($digits, $cc) && strlen($digits) <= 12) {
            $digits = $cc.$digits;
        }

        return strlen($digits) >= 10 ? '+'.$digits : null;
    }
}
