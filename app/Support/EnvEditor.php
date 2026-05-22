<?php

namespace App\Support;

use Illuminate\Filesystem\Filesystem;

class EnvEditor
{
    public function __construct(private readonly Filesystem $files) {}

    public function update(array $pairs, ?string $path = null): void
    {
        $path = $path ?: base_path('.env');
        if (! $this->files->exists($path)) {
            return;
        }

        $original = $this->files->get($path);
        $content = str_replace(["\r\n", "\r"], "\n", $original);

        // Backup once per update call
        $backupPath = $path.'.bak';
        if (! $this->files->exists($backupPath)) {
            $this->files->put($backupPath, $original);
        }

        foreach ($pairs as $key => $value) {
            $content = $this->setKey($content, (string) $key, $value);
        }

        // Keep original line endings as much as possible (Windows friendly)
        $eol = str_contains($original, "\r\n") ? "\r\n" : "\n";
        $this->files->put($path, str_replace("\n", $eol, $content));
    }

    private function setKey(string $content, string $key, mixed $value): string
    {
        $valueString = $this->stringifyValue($value);
        $pattern = '/^'.preg_quote($key, '/').'=.*/m';

        if (preg_match($pattern, $content) === 1) {
            return preg_replace($pattern, $key.'='.$valueString, $content) ?? $content;
        }

        $trimmed = rtrim($content, "\n");

        return $trimmed."\n".$key.'='.$valueString."\n";
    }

    private function stringifyValue(mixed $value): string
    {
        if ($value === null || $value === '') {
            return 'null';
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        $s = (string) $value;

        // Quote if contains spaces or special chars
        if (preg_match('/\s|#|=|"/', $s)) {
            $s = str_replace('"', '\"', $s);

            return '"'.$s.'"';
        }

        return $s;
    }
}
