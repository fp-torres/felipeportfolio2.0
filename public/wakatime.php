<?php
declare(strict_types=1);

require __DIR__ . '/_bridge.php';

// WakaTime coding stats (Activity section) with the server's key ($WAKATIME_TOKEN in config.php).
// Fresh for 15 min; the last good copy is served for up to 30 days. Only the public subset below leaves the
// server (the API also returns project, machine and dependency names).
//
// GET /wakatime.php?range=last_7_days|last_30_days|all_time
//   → 200 {"data":{"languages":[{"name","percent","color","text","seconds"}],"range","totalText","dailyAverageText",
//          "totalSeconds","dailyAverageSeconds","updatedAt","isUpToDate","source","stale","fetchedAt"}}
//   → 400 {"error":{"code":"INVALID_PARAM"}} · 503/429 {"error":{"code":"UPSTREAM"|"RATE_LIMITED"|"NOT_CONFIGURED",…}}
// Durations are numbers (seconds) for the client to format per language; the *Text fields are WakaTime's
// English strings, kept for older clients.

const WAKATIME_RANGES = ['last_7_days', 'last_30_days', 'all_time'];
const WAKATIME_POLICY = ['ttl' => 900, 'maxStale' => 30 * 86400, 'backoff' => 300, 'maxAge' => 300];
const WAKATIME_TOP_LANGUAGES = 6;
// Languages left out of the ranking, e.g. ['Markdown', 'Text', 'Other'] (empty = WakaTime's ranking as is).
const WAKATIME_HIDDEN_LANGUAGES = [];
// The stats endpoint sends no colours: a neutral categorical palette (DESIGN.md data-1…7), never the accent.
const WAKATIME_PALETTE = ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#64d2ff', '#ff375f', '#8e8e93'];

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

function wakatime_payload(array $stats, string $range): array
{
    $languages = [];
    foreach (is_array($stats['languages'] ?? null) ? $stats['languages'] : [] as $language) {
        if (!is_array($language) || !is_scalar($language['name'] ?? null) || !is_numeric($language['percent'] ?? null)) {
            continue;
        }
        $name = (string) $language['name'];
        if (in_array($name, WAKATIME_HIDDEN_LANGUAGES, true)) {
            continue;
        }

        $seconds = is_numeric($language['total_seconds'] ?? null) ? (float) $language['total_seconds'] : 0.0;
        $color = $language['color'] ?? null;
        $languages[] = [
            'name' => $name,
            'percent' => round((float) $language['percent'], 2),
            'color' => is_string($color) && preg_match('/^#[0-9a-f]{6}$/i', $color)
                ? $color
                : WAKATIME_PALETTE[count($languages) % count(WAKATIME_PALETTE)],
            'text' => is_string($language['text'] ?? null) ? $language['text'] : human_time($seconds),
            'seconds' => (int) round($seconds),
        ];
        if (count($languages) === WAKATIME_TOP_LANGUAGES) {
            break;
        }
    }

    $totalSeconds = is_numeric($stats['total_seconds'] ?? null) ? (float) $stats['total_seconds'] : 0.0;
    $dailyAverage = is_numeric($stats['daily_average'] ?? null) ? (float) $stats['daily_average'] : 0.0;

    return [
        'languages' => $languages,
        'range' => $range,
        'totalText' => is_string($stats['human_readable_total'] ?? null)
            ? $stats['human_readable_total']
            : human_time($totalSeconds),
        'dailyAverageText' => is_string($stats['human_readable_daily_average'] ?? null)
            ? $stats['human_readable_daily_average']
            : human_time($dailyAverage),
        'totalSeconds' => (int) round($totalSeconds),
        'dailyAverageSeconds' => (int) round($dailyAverage),
        'updatedAt' => is_string($stats['modified_at'] ?? null) ? $stats['modified_at'] : bridge_iso(time()),
        'isUpToDate' => (bool) ($stats['is_up_to_date'] ?? true),
    ];
}

function wakatime_fetch(string $token, string $range): array
{
    $response = bridge_http('https://api.wakatime.com/api/v1/users/current/stats/' . rawurlencode($range), [
        'headers' => [
            'Accept: application/json',
            'Authorization: Basic ' . base64_encode($token),
        ],
    ]);

    $stats = $response['json']['data'] ?? null;
    $languages = is_array($stats) ? ($stats['languages'] ?? null) : null;
    // An empty list is a period without coding (the client shows its empty state), but only once WakaTime's numbers
    // are final: while it is still computing (202 / is_up_to_date false) it must not replace the last good copy.
    $final = $response['status'] === 200 && (bool) ($stats['is_up_to_date'] ?? true);
    if (in_array($response['status'], [200, 202], true) && is_array($languages) && ($languages !== [] || $final)) {
        $payload = wakatime_payload($stats, $range);
        // WakaTime is still recalculating: keep these numbers but ask again in 5 minutes.
        return bridge_ok($payload, $payload['isUpToDate'] ? null : 300);
    }
    if ($response['status'] === 429) {
        return bridge_fail('RATE_LIMITED', 429, bridge_retry_after($response, 300));
    }

    return bridge_fail('UPSTREAM', 503);
}

$range = $_GET['range'] ?? 'last_30_days';
if (!is_string($range) || !in_array($range, WAKATIME_RANGES, true)) {
    bridge_error('INVALID_PARAM', 400);
    return;
}

$token = bridge_secret('WAKATIME_TOKEN');
$result = bridge_resolve(
    'wakatime-' . $range,
    WAKATIME_POLICY,
    $token === '' ? null : static fn (): array => wakatime_fetch($token, $range),
    static fn (): ?array => bridge_legacy_cache('wakatime-' . $range . '.json')
);
if ($result['ok'] && ($result['payload']['isUpToDate'] ?? true) === false) {
    $result['stale'] = true;
}
bridge_respond($result);
bridge_after($result);
