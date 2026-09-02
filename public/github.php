<?php
declare(strict_types=1);

const GITHUB_LOGIN = 'fp-torres';
const GITHUB_CACHE_TTL = 3600;
const GITHUB_CACHE_MAX_STALE = 2592000;

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

function cache_path(): string
{
    $directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'felipe-portfolio-cache';

    if (!is_dir($directory)) {
        @mkdir($directory, 0700, true);
    }

    return $directory . DIRECTORY_SEPARATOR . 'github-contributions.json';
}

function read_cache(): ?array
{
    $path = cache_path();
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

function write_cache(array $payload): void
{
    $path = cache_path();
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

function public_payload(array $calendar, string $source, bool $stale): array
{
    $weeks = [];
    foreach ($calendar['weeks'] ?? [] as $week) {
        $days = [];
        foreach ($week['contributionDays'] ?? [] as $day) {
            $days[] = [
                'date' => (string) ($day['date'] ?? ''),
                'weekday' => (int) ($day['weekday'] ?? 0),
                'count' => (int) ($day['contributionCount'] ?? 0),
            ];
        }
        $weeks[] = ['days' => $days];
    }

    return [
        'totalContributions' => (int) ($calendar['totalContributions'] ?? 0),
        'weeks' => $weeks,
        'source' => $source,
        'stale' => $stale,
    ];
}

$cache = read_cache();
$cacheAge = $cache ? time() - (int) $cache['storedAt'] : PHP_INT_MAX;

if ($cache && $cacheAge <= GITHUB_CACHE_TTL) {
    $payload = $cache['payload'];
    $payload['source'] = 'cache';
    $payload['stale'] = false;
    send_json(['data' => $payload]);
}

$configPath = __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
if (!is_readable($configPath)) {
    if ($cache && $cacheAge <= GITHUB_CACHE_MAX_STALE) {
        $payload = $cache['payload'];
        $payload['source'] = 'cache';
        $payload['stale'] = true;
        send_json(['data' => $payload]);
    }

    send_json(['error' => 'Integração GitHub não configurada.', 'retryable' => false], 503);
}

require $configPath;

if (!isset($GITHUB_TOKEN) || trim((string) $GITHUB_TOKEN) === '') {
    if ($cache && $cacheAge <= GITHUB_CACHE_MAX_STALE) {
        $payload = $cache['payload'];
        $payload['source'] = 'cache';
        $payload['stale'] = true;
        send_json(['data' => $payload]);
    }

    send_json(['error' => 'Integração GitHub não configurada.', 'retryable' => false], 503);
}

$query = <<<'GRAPHQL'
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            weekday
            contributionCount
          }
        }
      }
    }
  }
}
GRAPHQL;

$body = json_encode(['query' => $query, 'variables' => ['login' => GITHUB_LOGIN]]);

$curl = curl_init('https://api.github.com/graphql');
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_USERAGENT => 'FelipePortfolio/2.1',
    CURLOPT_HTTPHEADER => [
        'Accept: application/vnd.github+json',
        'Content-Type: application/json',
        'Authorization: Bearer ' . $GITHUB_TOKEN,
    ],
]);

$response = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_error($curl);
curl_close($curl);

$decoded = is_string($response) ? json_decode($response, true) : null;
$calendar = $decoded['data']['user']['contributionsCollection']['contributionCalendar'] ?? null;
$hasCalendar = is_array($calendar) && isset($calendar['weeks']);

if ($status === 200 && $hasCalendar) {
    $payload = public_payload($calendar, 'live', false);
    write_cache($payload);
    send_json(['data' => $payload]);
}

if ($cache && $cacheAge <= GITHUB_CACHE_MAX_STALE) {
    $payload = $cache['payload'];
    $payload['source'] = 'cache';
    $payload['stale'] = true;
    send_json(['data' => $payload]);
}

send_json([
    'error' => 'GitHub temporariamente indisponível.',
    'retryable' => true,
    'upstreamStatus' => $status,
    'details' => $curlError !== '' ? 'connection_failed' : 'upstream_unavailable',
], 503);
