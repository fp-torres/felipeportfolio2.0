<?php
declare(strict_types=1);

require __DIR__ . '/_bridge.php';

// NASA Astronomy Picture of the Day for the "Laboratório" sheets (NASA hoje + Máquina do tempo).
// The API key stays on the server ($NASA_API_KEY in config.php, optional: NASA's DEMO_KEY otherwise), every date
// is fetched once and cached (past dates never change), and the Portuguese text is translated once per date.
//
// GET /nasa.php?date=YYYY-MM-DD&lang=pt|en   (date optional = today in New York, where APOD is published)
//   → 200 {"data":{"date","title","explanation","mediaType":"image"|"video"|"other","url","hdUrl","thumbnailUrl",
//          "copyright","lang","translated","source","stale","fetchedAt"}}
//   → 400 {"error":{"code":"INVALID_PARAM"}}  (bad date/lang, or a day missing from NASA's archive → 404)
//   → 503/429 {"error":{"code":"UPSTREAM"|"RATE_LIMITED","retryable":true,"retryAfter"}}

const APOD_FIRST_DATE = '1995-06-16';
const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod';
const APOD_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t';
const APOD_PAST_POLICY = ['ttl' => 30 * 86400, 'maxStale' => 3650 * 86400, 'backoff' => 600, 'maxAge' => 86400];
const APOD_TODAY_POLICY = ['ttl' => 6 * 3600, 'maxStale' => 2 * 86400, 'backoff' => 600, 'maxAge' => 1800];
const APOD_BAD_KEY_CODES = ['API_KEY_INVALID', 'API_KEY_MISSING', 'API_KEY_DISABLED', 'API_KEY_UNAUTHORIZED'];

function apod_valid_date(string $date, string $today): bool
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $parts)
        || !checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
        return false;
    }

    return $date >= APOD_FIRST_DATE && $date <= $today; // ISO dates compare as strings
}

function apod_text($value): string
{
    return is_string($value) ? trim((string) preg_replace('/\s+/', ' ', $value)) : '';
}

/** Absolute https URL ('' when unusable): NASA still returns some http:// and protocol-relative links. */
function apod_url($value): string
{
    if (!is_string($value) || ($value = trim($value)) === '') {
        return '';
    }
    if (str_starts_with($value, '//')) {
        $value = 'https:' . $value;
    } elseif (!preg_match('#^[a-z][a-z0-9+.-]*:#i', $value)) {
        $value = 'https://apod.nasa.gov/apod/' . ltrim($value, '/');
    }

    $parts = parse_url($value);
    if (!is_array($parts) || empty($parts['host']) || !in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)) {
        return '';
    }

    return (string) preg_replace('#^http:#i', 'https:', $value);
}

function apod_payload(array $apod): ?array
{
    $date = $apod['date'] ?? null;
    $title = apod_text($apod['title'] ?? '');
    if ($title === '' || !is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return null;
    }

    $url = apod_url($apod['url'] ?? '');
    $mediaType = in_array($apod['media_type'] ?? '', ['image', 'video'], true) && $url !== ''
        ? $apod['media_type']
        : 'other';

    return [
        'date' => $date,
        'title' => $title,
        'explanation' => apod_text($apod['explanation'] ?? ''),
        'mediaType' => $mediaType,
        'url' => $url,
        'hdUrl' => apod_url($apod['hdurl'] ?? ''),
        'thumbnailUrl' => apod_url($apod['thumbnail_url'] ?? ''),
        'copyright' => apod_text($apod['copyright'] ?? ''),
    ];
}

function apod_fetch(string $date, string $apiKey, bool $isToday): array
{
    // A rejected NASA_API_KEY falls back to DEMO_KEY (for 6 h) instead of breaking the feature.
    $response = bridge_empty_response();
    foreach (array_unique([$apiKey, 'DEMO_KEY']) as $key) {
        $keyId = substr(hash('sha256', $key), 0, 12);
        if ($key !== 'DEMO_KEY' && (int) (bridge_cache_get('apod-badkey-' . $keyId)['until'] ?? 0) > time()) {
            continue;
        }
        // Rate limited: answer the real wait (at most 6 h, see bridge_retry_after) so the client can say when NASA
        // accepts requests again; this date is not asked again before then either.
        $limitKey = 'apod-limit-' . $keyId;
        $wait = (int) (bridge_cache_get($limitKey)['until'] ?? 0) - time();
        if ($wait > 0) {
            return bridge_fail('RATE_LIMITED', 429, $wait);
        }

        $response = bridge_http(
            APOD_ENDPOINT . '?' . http_build_query(['api_key' => $key, 'date' => $date, 'thumbs' => 'true']),
            ['timeout' => 6]
        );
        $error = $response['json']['error']['code'] ?? '';
        if ($response['status'] === 403 && $key !== 'DEMO_KEY' && in_array($error, APOD_BAD_KEY_CODES, true)) {
            error_log('nasa.php: NASA_API_KEY was rejected (' . $error . '), using DEMO_KEY');
            bridge_cache_put('apod-badkey-' . $keyId, ['until' => time() + BRIDGE_MAX_BACKOFF]);
            continue;
        }
        if ($response['status'] === 429 || $error === 'OVER_RATE_LIMIT') {
            $retry = bridge_retry_after($response, 3600);
            bridge_cache_put($limitKey, ['until' => time() + $retry]);
            return bridge_fail('RATE_LIMITED', 429, $retry);
        }
        break;
    }

    $payload = $response['status'] === 200 && is_array($response['json']) ? apod_payload($response['json']) : null;
    if ($payload !== null) {
        return bridge_ok($payload);
    }
    if (in_array($response['status'], [400, 404], true)) {
        // No picture for that day: not published yet (today) or a gap in the 1995 archive.
        return bridge_fail('NOT_FOUND', 404, $isToday ? 900 : 86400);
    }

    return bridge_fail('UPSTREAM', 503);
}

function apod_resolve(string $date, bool $isToday, string $apiKey): array
{
    return bridge_resolve(
        'apod-' . $date,
        $isToday ? APOD_TODAY_POLICY : APOD_PAST_POLICY,
        static fn (): array => apod_fetch($date, $apiKey, $isToday)
    );
}

function apod_join_translation($json): string
{
    $text = '';
    foreach (is_array($json[0] ?? null) ? $json[0] : [] as $segment) {
        if (is_array($segment) && is_string($segment[0] ?? null)) {
            $text .= $segment[0];
        }
    }

    return trim($text);
}

/** Portuguese title + explanation, translated once per date and cached; null when the translator fails. */
function apod_translation(array $apod): ?array
{
    $key = 'apod-' . $apod['date'] . '-pt';
    $source = hash('sha256', $apod['title'] . "\n" . $apod['explanation']);
    $entry = bridge_cache_get($key) ?? [];
    $cached = $entry['payload'] ?? null;
    if (is_array($cached) && ($cached['source'] ?? '') === $source) {
        return $cached;
    }
    if ((int) ($entry['failedAt'] ?? 0) > time() - 600) {
        return null;
    }

    $requests = [];
    foreach (['title', 'explanation'] as $field) {
        if ($apod[$field] !== '') {
            $requests[$field] = [
                'url' => APOD_TRANSLATE_ENDPOINT,
                'timeout' => 4,
                'headers' => ['Content-Type: application/x-www-form-urlencoded;charset=UTF-8'],
                'body' => http_build_query(['q' => $apod[$field]]),
            ];
        }
    }

    $translated = ['title' => '', 'explanation' => '', 'source' => $source];
    foreach (bridge_http_all($requests) as $field => $response) {
        $text = $response['status'] === 200 ? apod_join_translation($response['json']) : '';
        if ($text === '') {
            bridge_cache_put($key, ['failedAt' => time()]);
            return null;
        }
        $translated[$field] = apod_text($text);
    }
    bridge_cache_put($key, ['storedAt' => time(), 'payload' => $translated]);

    return $translated;
}

$now = new DateTimeImmutable('now', new DateTimeZone('America/New_York'));
$today = $now->format('Y-m-d');
$lang = $_GET['lang'] ?? 'en';
$requested = $_GET['date'] ?? '';
if (!is_string($lang) || !in_array($lang, ['pt', 'en'], true)
    || !is_string($requested) || ($requested !== '' && !apod_valid_date($requested, $today))) {
    bridge_error('INVALID_PARAM', 400);
    return;
}

$apiKey = bridge_secret('NASA_API_KEY');
if ($apiKey === '') {
    $apiKey = 'DEMO_KEY';
}

$date = $requested !== '' ? $requested : $today;
$result = apod_resolve($date, $date === $today, $apiKey);
$fellBack = false;
if (!$result['ok'] && $result['code'] === 'NOT_FOUND' && $date === $today) {
    // Today's picture is published during the morning in New York: until then, show yesterday's.
    $result = apod_resolve($now->modify('-1 day')->format('Y-m-d'), false, $apiKey);
    $fellBack = true;
}
if (!$result['ok']) {
    if ($result['code'] === 'NOT_FOUND') {
        bridge_error('INVALID_PARAM', 404); // a day missing from NASA's archive
    } else {
        bridge_error($result['code'], $result['status'], $result['retryAfter']);
    }
    return;
}

$apod = $result['payload'];
$translated = false;
if ($lang === 'pt') {
    $portuguese = apod_translation($apod);
    if ($portuguese !== null) {
        $apod['title'] = $portuguese['title'] !== '' ? $portuguese['title'] : $apod['title'];
        $apod['explanation'] = $portuguese['explanation'] !== '' ? $portuguese['explanation'] : $apod['explanation'];
        $translated = true;
    }
}

// Past days are immutable; "today" may change at midnight in New York; an untranslated answer is retried soon.
$untilMidnight = $now->setTime(0, 0)->modify('+1 day')->getTimestamp() - $now->getTimestamp();
if ($result['stale']) {
    $maxAge = 60;
} elseif ($fellBack) {
    $maxAge = 300;
} elseif ($apod['date'] === $today) {
    $maxAge = max(60, min(1800, $untilMidnight));
} else {
    $maxAge = 86400;
}
if ($lang === 'pt' && !$translated) {
    $maxAge = min($maxAge, 300);
}

$result['payload'] = $apod;
// Never longer than the bridge's own max-age: 60 s for a copy answered while it is being refreshed.
$result['maxAge'] = min($maxAge, $result['maxAge']);
bridge_respond($result, ['lang' => $lang, 'translated' => $translated]);
bridge_after($result);
