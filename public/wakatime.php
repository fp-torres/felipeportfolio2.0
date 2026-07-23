<?php
declare(strict_types=1);

const WAKATIME_CACHE_TTL = 900;
const WAKATIME_CACHE_MAX_STALE = 2592000;
const WAKATIME_TOP_LANGUAGES = 6;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300, stale-while-revalidate=86400');
header('X-Content-Type-Options: nosniff');

function send_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function cache_path(string $range): string
{
    $directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'felipe-portfolio-cache';

    if (!is_dir($directory)) {
        @mkdir($directory, 0700, true);
    }

    return $directory . DIRECTORY_SEPARATOR . 'wakatime-' . $range . '.json';
}

function read_cache(string $range): ?array
{
    $path = cache_path($range);
    if (!is_readable($path)) {
        return null;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    if (
        !is_array($decoded)
        || !isset($decoded['storedAt'], $decoded['payload'])
        || !is_array($decoded['payload'])
    ) {
        return null;
    }

    return $decoded;
}

function write_cache(string $range, array $payload): void
{
    $path = cache_path($range);
    $temporaryPath = $path . '.tmp';
    $encoded = json_encode(
        ['storedAt' => time(), 'payload' => $payload],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );

    if ($encoded === false || @file_put_contents($temporaryPath, $encoded, LOCK_EX) === false) {
        return;
    }

    @chmod($temporaryPath, 0600);
    @rename($temporaryPath, $path);
}

function human_time(float $seconds): string
{
    $totalMinutes = (int) round($seconds / 60);
    $hours = intdiv($totalMinutes, 60);
    $minutes = $totalMinutes % 60;

    if ($hours > 0 && $minutes > 0) {
        return sprintf('%dh %dmin', $hours, $minutes);
    }

    if ($hours > 0) {
        return sprintf('%dh', $hours);
    }

    return sprintf('%dmin', max($minutes, 0));
}

function public_payload(
    array $stats,
    string $range,
    string $source,
    bool $stale,
    string $fetchedAt
): array {
    $languages = [];

    foreach (array_slice($stats['languages'] ?? [], 0, WAKATIME_TOP_LANGUAGES) as $language) {
        if (!isset($language['name'], $language['percent'])) {
            continue;
        }

        $languages[] = [
            'name' => (string) $language['name'],
            'percent' => round((float) $language['percent'], 2),
            'color' => (string) ($language['color'] ?? '#ffd100'),
            'text' => (string) (
                $language['text']
                ?? human_time((float) ($language['total_seconds'] ?? 0))
            ),
        ];
    }

    return [
        'languages' => $languages,
        'range' => $range,
        'totalText' => (string) (
            $stats['human_readable_total']
            ?? human_time((float) ($stats['total_seconds'] ?? 0))
        ),
        'dailyAverageText' => (string) (
            $stats['human_readable_daily_average']
            ?? human_time((float) ($stats['daily_average'] ?? 0))
        ),
        'updatedAt' => (string) (
            $stats['modified_at']
            ?? $stats['range']['end']
            ?? $fetchedAt
        ),
        'source' => $source,
        'stale' => $stale,
        'isUpToDate' => (bool) ($stats['is_up_to_date'] ?? !$stale),
    ];
}

$allowedRanges = ['last_7_days', 'last_30_days', 'all_time'];
$range = isset($_GET['range']) ? (string) $_GET['range'] : 'last_30_days';

if (!in_array($range, $allowedRanges, true)) {
    send_json(['error' => 'Período inválido.'], 400);
}

$cache = read_cache($range);
$cacheAge = $cache ? time() - (int) $cache['storedAt'] : PHP_INT_MAX;

if ($cache && $cacheAge <= WAKATIME_CACHE_TTL) {
    $payload = $cache['payload'];
    $payload['source'] = 'cache';
    $payload['stale'] = false;
    send_json(['data' => $payload]);
}

$configPath = __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
if (!is_readable($configPath)) {
    if ($cache && $cacheAge <= WAKATIME_CACHE_MAX_STALE) {
        $payload = $cache['payload'];
        $payload['source'] = 'cache';
        $payload['stale'] = true;
        send_json(['data' => $payload]);
    }

    send_json(['error' => 'Integração WakaTime não configurada.', 'retryable' => false], 503);
}

require $configPath;

if (!isset($WAKATIME_TOKEN) || trim((string) $WAKATIME_TOKEN) === '') {
    send_json(['error' => 'Integração WakaTime não configurada.', 'retryable' => false], 503);
}

$url = 'https://api.wakatime.com/api/v1/users/current/stats/' . rawurlencode($range);
$curl = curl_init($url);

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_ENCODING => '',
    CURLOPT_USERAGENT => 'FelipePortfolio/2.1',
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Basic ' . base64_encode((string) $WAKATIME_TOKEN),
    ],
]);

$response = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);

$decoded = is_string($response) ? json_decode($response, true) : null;
$stats = is_array($decoded) && isset($decoded['data']) && is_array($decoded['data'])
    ? $decoded['data']
    : null;
$hasLanguages = is_array($stats) && !empty($stats['languages']);
$upstreamIsFresh = $hasLanguages && (bool) ($stats['is_up_to_date'] ?? true);
$fetchedAt = gmdate(DATE_ATOM);

if ($status === 200 && $upstreamIsFresh) {
    $payload = public_payload($stats, $range, 'live', false, $fetchedAt);
    write_cache($range, $payload);
    send_json(['data' => $payload]);
}

if ($cache && $cacheAge <= WAKATIME_CACHE_MAX_STALE) {
    $payload = $cache['payload'];
    $payload['source'] = 'cache';
    $payload['stale'] = true;
    send_json(['data' => $payload]);
}

if (($status === 200 || $status === 202) && $hasLanguages) {
    $payload = public_payload($stats, $range, 'live', true, $fetchedAt);
    send_json(['data' => $payload]);
}

send_json([
    'error' => 'WakaTime temporariamente indisponível.',
    'retryable' => true,
    'upstreamStatus' => $status,
    'details' => $curlError !== '' ? 'connection_failed' : 'upstream_unavailable',
], 503);
