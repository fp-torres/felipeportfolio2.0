<?php
declare(strict_types=1);

/*
 * Shared helpers for the PHP bridges (github.php, wakatime.php, spotify.php, nasa.php, news.php).
 * Not an endpoint: .htaccess denies _*.php over HTTP, and a direct request answers 404 anyway.
 *
 * - Secrets come from config.php (written by the deploy workflow) and never leave the server.
 * - Private file cache outside the web root, falling back to the system temp dir (or to no cache at all).
 * - Stale-while-revalidate with a non-blocking lock (one refresh at a time) and a negative cache: after a
 *   failure, upstream is left alone for a while and the last good copy keeps being served.
 * - Short upstream timeouts (connect 2 s, total 5 s) so PHP answers before the browser gives up (8–12 s).
 * - One error shape for every bridge: {"error":{"code","retryable","retryAfter"}} with Cache-Control: no-store.
 */

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}

ini_set('display_errors', '0');
header_remove('X-Powered-By');

const BRIDGE_CACHE_VERSION = 1;
const BRIDGE_JSON = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE;
const BRIDGE_USER_AGENT = 'FelipePortfolio/3.0 (+https://felipeportfolio.forgedevapps.com)';
const BRIDGE_MAX_BACKOFF = 21600;
const BRIDGE_PERMANENT_ERRORS = ['NOT_CONFIGURED', 'INVALID_PARAM', 'NOT_FOUND'];

// ---------------------------------------------------------------------------------------------------------------
// Configuration

/** Variables defined by config.php; empty when the file is missing or broken. */
function bridge_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $config = [];
    $path = __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
    if (!is_readable($path)) {
        return $config;
    }

    ob_start(); // stray output (e.g. a newline after a closing PHP tag) must not end up before the JSON
    try {
        $config = (static function (string $bridgeConfigPath): array {
            require $bridgeConfigPath;
            return get_defined_vars();
        })($path);
    } catch (Throwable $error) {
        error_log('bridge: config.php could not be loaded (' . get_class($error) . ')');
    } finally {
        ob_end_clean();
    }

    return $config;
}

/** One config.php variable as a trimmed string ('' when missing). */
function bridge_secret(string $name): string
{
    $value = bridge_config()[$name] ?? '';
    return is_scalar($value) ? trim((string) $value) : '';
}

// ---------------------------------------------------------------------------------------------------------------
// Private file cache

/** Account the PHP process runs as (-1 if the host disabled both functions: the bridges then run without cache). */
function bridge_uid(): int
{
    if (function_exists('posix_geteuid')) {
        return posix_geteuid();
    }

    return function_exists('getmyuid') ? (int) getmyuid() : -1;
}

/** Writable cache directory owned by this account, or null (the bridges then simply run without a cache). */
function bridge_cache_dir(): ?string
{
    static $dir = false;
    if ($dir !== false) {
        return $dir;
    }

    $candidates = [];
    $parent = dirname(__DIR__);
    // On the server the folder above the web root is private. Skip it when it is the source checkout (public/ or
    // dist/ of the repo) or when it is itself inside a web root (e.g. a subdomain folder within public_html).
    if (!bridge_is_web_path($parent) && !@is_file($parent . DIRECTORY_SEPARATOR . 'package.json')) {
        $candidates[] = $parent . DIRECTORY_SEPARATOR . '.portfolio-cache';
    }
    $candidates[] = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'portfolio-cache-' . bridge_uid();

    foreach ($candidates as $candidate) {
        if (bridge_prepare_dir($candidate)) {
            return $dir = $candidate;
        }
    }

    return $dir = null;
}

function bridge_is_web_path(string $path): bool
{
    $segments = preg_split('#[/\\\\]+#', strtolower($path), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    return array_intersect($segments, ['public_html', 'htdocs', 'httpdocs', 'html', 'www', 'wwwroot']) !== [];
}

function bridge_prepare_dir(string $dir): bool
{
    if (!@is_dir($dir)) {
        if (!@mkdir($dir, 0700, true) && !@is_dir($dir)) {
            return false;
        }
        // Defence in depth, in case this folder is ever reachable over HTTP.
        @file_put_contents($dir . DIRECTORY_SEPARATOR . '.htaccess', "Require all denied\n");
    }
    clearstatcache(true, $dir);

    return @is_dir($dir) && !@is_link($dir) && @is_writable($dir) && @fileowner($dir) === bridge_uid();
}

function bridge_cache_path(string $key, string $extension = 'json'): ?string
{
    $dir = bridge_cache_dir();
    // D: "$" must be the very end — without it a key ending in "\n" would pass and name a file.
    if ($dir === null || !preg_match('/^[a-z0-9][a-z0-9_-]{0,80}$/D', $key)) {
        return null;
    }

    return $dir . DIRECTORY_SEPARATOR . $key . '.' . $extension;
}

function bridge_cache_get(string $key): ?array
{
    $path = bridge_cache_path($key);
    if ($path === null || !@is_file($path)) {
        return null;
    }

    $entry = json_decode((string) @file_get_contents($path), true);
    return is_array($entry) && ($entry['v'] ?? null) === BRIDGE_CACHE_VERSION ? $entry : null;
}

/** Atomic write: a private temp file (tempnam creates it 0600) renamed over the old entry. */
function bridge_cache_put(string $key, array $entry): void
{
    $path = bridge_cache_path($key);
    $json = json_encode(['v' => BRIDGE_CACHE_VERSION] + $entry, BRIDGE_JSON);
    if ($path === null || $json === false) {
        return;
    }

    $dir = dirname($path);
    $temporary = @tempnam($dir, 'tmp-');
    if ($temporary === false) {
        return;
    }
    if (realpath(dirname($temporary)) !== realpath($dir)) { // tempnam silently falls back to the system temp dir
        @unlink($temporary);
        return;
    }
    if (@file_put_contents($temporary, $json) !== strlen($json) || !@rename($temporary, $path)) {
        @unlink($temporary);
    }
}

/**
 * Copy written by the previous version of the bridges ({storedAt, payload} in the system temp dir), used only
 * as a last resort right after the upgrade. Returns [storedAt, payload] or null.
 */
function bridge_legacy_cache(string $file): ?array
{
    $path = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'felipe-portfolio-cache' . DIRECTORY_SEPARATOR . $file;
    if (!@is_file($path) || @is_link($path) || @fileowner($path) !== bridge_uid()) {
        return null;
    }

    $entry = json_decode((string) @file_get_contents($path), true);
    if (!is_array($entry) || !is_int($entry['storedAt'] ?? null) || !is_array($entry['payload'] ?? null)) {
        return null;
    }

    return [$entry['storedAt'], $entry['payload']];
}

/**
 * Non-blocking exclusive lock: a handle when acquired, false when another request holds it, null when locking is
 * unavailable (no cache dir, or a filesystem without flock) — the caller then simply goes ahead without it.
 */
function bridge_lock(string $key)
{
    $path = bridge_cache_path($key, 'lock');
    $handle = $path === null ? false : @fopen($path, 'c');
    if ($handle === false) {
        return null;
    }
    $wouldBlock = 0;
    if (!@flock($handle, LOCK_EX | LOCK_NB, $wouldBlock)) {
        fclose($handle);
        return $wouldBlock ? false : null;
    }

    return $handle;
}

function bridge_unlock($handle): void
{
    if (is_resource($handle)) {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Upstream HTTP

function bridge_empty_response(): array
{
    return ['status' => 0, 'body' => '', 'json' => null, 'headers' => []];
}

function bridge_http_handle(string $url, array $options, array &$headers)
{
    $curl = curl_init($url);
    if ($curl === false) {
        return false;
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => (int) ($options['timeout'] ?? 5),
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_ENCODING => '',
        CURLOPT_USERAGENT => BRIDGE_USER_AGENT,
        CURLOPT_HTTPHEADER => $options['headers'] ?? [],
        CURLOPT_HEADERFUNCTION => static function ($handle, string $line) use (&$headers): int {
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) {
                $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
            }
            return strlen($line);
        },
    ]);
    if (array_key_exists('body', $options)) {
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, (string) $options['body']);
    }

    return $curl;
}

function bridge_http_result($curl, $raw, array $headers): array
{
    $status = curl_errno($curl) === 0 ? (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE) : 0;
    $body = is_string($raw) ? $raw : '';
    $json = $body === '' ? null : json_decode($body, true);

    return ['status' => $status, 'body' => $body, 'json' => is_array($json) ? $json : null, 'headers' => $headers];
}

/**
 * HTTPS request with short timeouts. $options: headers (list), body (string → POST), timeout (seconds, default 5).
 * Returns ['status' => int (0 = network error/timeout), 'body', 'json' => ?array, 'headers' => lower-case map].
 */
function bridge_http(string $url, array $options = []): array
{
    if (!function_exists('curl_init')) {
        return bridge_empty_response();
    }

    $headers = [];
    $curl = bridge_http_handle($url, $options, $headers);
    if ($curl === false) {
        return bridge_empty_response();
    }

    $raw = curl_exec($curl);
    return bridge_http_result($curl, $raw, $headers);
}

/** Several requests in parallel (same options as bridge_http + 'url'); the slowest one bounds the total time. */
function bridge_http_all(array $requests): array
{
    if (!function_exists('curl_multi_init')) {
        return array_map(static fn (array $request): array => bridge_http($request['url'], $request), $requests);
    }

    $multi = curl_multi_init();
    $handles = [];
    $headers = [];
    $results = [];
    foreach ($requests as $name => $request) {
        $headers[$name] = [];
        $curl = bridge_http_handle($request['url'], $request, $headers[$name]);
        if ($curl === false) {
            $results[$name] = bridge_empty_response();
            continue;
        }
        $handles[$name] = $curl;
        curl_multi_add_handle($multi, $curl);
    }

    do {
        $code = curl_multi_exec($multi, $running);
        if ($running > 0 && curl_multi_select($multi, 1.0) === -1) {
            usleep(50000);
        }
    } while ($running > 0 && $code === CURLM_OK);
    while (curl_multi_info_read($multi) !== false) {
        // Reading the messages records each transfer's error code, so curl_errno() reports timeouts.
    }

    foreach ($handles as $name => $curl) {
        $results[$name] = bridge_http_result($curl, curl_multi_getcontent($curl), $headers[$name]);
        curl_multi_remove_handle($multi, $curl);
    }
    curl_multi_close($multi);

    return $results;
}

/** Seconds to wait from Retry-After / X-RateLimit-Reset, clamped to [30 s, 6 h]. */
function bridge_retry_after(array $response, int $default): int
{
    $headers = $response['headers'];
    $seconds = $default;
    if (preg_match('/^\d+$/', $headers['retry-after'] ?? '')) {
        $seconds = (int) $headers['retry-after'];
    } elseif (preg_match('/^\d+$/', $headers['x-ratelimit-reset'] ?? '')) {
        $seconds = (int) $headers['x-ratelimit-reset'] - time();
    }

    return max(30, min(BRIDGE_MAX_BACKOFF, $seconds));
}

// ---------------------------------------------------------------------------------------------------------------
// Stale-while-revalidate

function bridge_ok(array $payload, ?int $ttl = null): array
{
    return ['ok' => true, 'payload' => $payload, 'ttl' => $ttl];
}

/** Upstream failure. $retryAfter null = the bridge's default backoff. */
function bridge_fail(string $code = 'UPSTREAM', int $status = 503, ?int $retryAfter = null): array
{
    return ['ok' => false, 'code' => $code, 'status' => $status, 'retryAfter' => $retryAfter];
}

function bridge_hit(array $payload, string $source, bool $stale, int $storedAt, int $maxAge): array
{
    return [
        'ok' => true,
        'payload' => $payload,
        'source' => $source,
        'stale' => $stale,
        'storedAt' => $storedAt,
        'maxAge' => $maxAge,
    ];
}

/**
 * Resolves $key from the cache or upstream. Returns a hit (bridge_hit() shape, maybe with an 'after' closure that
 * refreshes the cache once the response is sent) or a failure (bridge_fail() shape with retryAfter set).
 *
 * $policy: ttl (seconds a copy is fresh), maxStale (oldest copy still served when upstream fails), backoff
 *          (seconds upstream is left alone after a failure), maxAge (browser/CDN max-age of a fresh answer),
 *          background (default true: an expired copy is answered at once and refreshed after the response,
 *          when the server can finish a response early — LiteSpeed/FPM).
 * $fetch:  null when the bridge has no credentials; otherwise returns bridge_ok() or bridge_fail().
 * $legacy: optional callable returning bridge_legacy_cache(), read only when there is no entry yet.
 */
function bridge_resolve(string $key, array $policy, ?callable $fetch, ?callable $legacy = null): array
{
    $now = time();
    $entry = bridge_cache_get($key) ?? [];
    $payload = is_array($entry['payload'] ?? null) ? $entry['payload'] : null;
    $storedAt = (int) ($entry['storedAt'] ?? 0);
    $ttl = (int) ($entry['ttl'] ?? $policy['ttl']);

    $fromLegacy = false;
    if ($payload === null && $legacy !== null) {
        $old = $legacy();
        if (is_array($old)) {
            [$storedAt, $payload] = $old;
            $ttl = 0; // never fresh: refresh first (synchronously) and keep it only as a fallback
            $entry['ttl'] = 0;
            $fromLegacy = true;
        }
    }

    $age = $payload === null ? PHP_INT_MAX : max(0, $now - $storedAt);
    $usable = $payload !== null && $age <= $policy['maxStale'];
    $failedAt = (int) ($entry['failedAt'] ?? 0);
    // "stale" means "the last refresh failed", never just "old": the UI shows a warning for it. A copy that is merely
    // due is answered as is while it is refreshed (after the response, or by the request holding the lock).
    $refreshFailed = $failedAt > $storedAt;

    if ($payload !== null && $age < $ttl) {
        return bridge_hit($payload, 'cache', false, $storedAt, (int) $policy['maxAge']);
    }

    $retryIn = $failedAt + (int) ($entry['backoff'] ?? $policy['backoff']) - $now;
    if ($fetch === null || $retryIn > 0) {
        if ($usable) {
            return bridge_hit($payload, 'cache', true, $storedAt, 60);
        }
        if ($fetch === null) {
            return bridge_fail('NOT_CONFIGURED', 503, 0);
        }
        $failure = is_array($entry['failure'] ?? null) ? $entry['failure'] : [];
        return bridge_fail((string) ($failure['code'] ?? 'UPSTREAM'), (int) ($failure['status'] ?? 503), $retryIn);
    }

    $lock = bridge_lock($key);
    if ($lock === false && $usable) { // another request is refreshing this entry right now
        return bridge_hit($payload, 'cache', $refreshFailed, $storedAt, 60);
    }

    $background = ($policy['background'] ?? true) && !$fromLegacy
        && (function_exists('litespeed_finish_request') || function_exists('fastcgi_finish_request'));
    if ($usable && $background) {
        $hit = bridge_hit($payload, 'cache', $refreshFailed, $storedAt, 60);
        $hit['after'] = static function () use ($key, $policy, $fetch, $entry, $payload, $storedAt, $lock): void {
            bridge_refresh($key, $policy, $fetch, $entry, $payload, $storedAt);
            bridge_unlock($lock);
        };
        return $hit;
    }

    $result = bridge_refresh($key, $policy, $fetch, $entry, $payload, $storedAt);
    bridge_unlock($lock);
    if ($result['ok']) {
        return bridge_hit($result['payload'], 'live', false, time(), (int) $policy['maxAge']);
    }
    if ($usable) {
        return bridge_hit($payload, 'cache', true, $storedAt, 60);
    }

    return $result;
}

function bridge_refresh(string $key, array $policy, callable $fetch, array $entry, ?array $payload, int $storedAt): array
{
    try {
        $result = $fetch();
    } catch (Throwable $error) {
        error_log('bridge ' . $key . ': ' . get_class($error) . ' ' . $error->getMessage());
        $result = bridge_fail();
    }

    $now = time();
    if ($result['ok']) {
        $fresh = ['storedAt' => $now, 'payload' => $result['payload']];
        if ($result['ttl'] !== null) {
            $fresh['ttl'] = $result['ttl'];
        }
        bridge_cache_put($key, $fresh);
        return $result;
    }

    $result['retryAfter'] = min(BRIDGE_MAX_BACKOFF, max(1, $result['retryAfter'] ?? (int) $policy['backoff']));
    $failed = [
        'storedAt' => $payload === null ? null : $storedAt,
        'payload' => $payload,
        'failedAt' => $now,
        'backoff' => $result['retryAfter'],
        'failure' => ['code' => $result['code'], 'status' => $result['status']],
    ];
    if (isset($entry['ttl'])) {
        $failed['ttl'] = $entry['ttl'];
    }
    bridge_cache_put($key, $failed);

    return $result;
}

/** Runs the refresh scheduled by bridge_resolve() after the response has been handed to the client. */
function bridge_after(array $result): void
{
    $after = $result['after'] ?? null;
    if (!$after instanceof Closure) {
        return;
    }

    if (function_exists('ignore_user_abort')) {
        ignore_user_abort(true); // keep refreshing even if the visitor already left
    }
    if (function_exists('litespeed_finish_request')) {
        litespeed_finish_request();
    } elseif (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    $after();
}

// ---------------------------------------------------------------------------------------------------------------
// Responses

function bridge_iso(int $timestamp): string
{
    return gmdate('Y-m-d\TH:i:s\Z', $timestamp);
}

/**
 * JSON response. Only a 200 with $maxAge > 0 may be cached (browser + CDN); everything else is no-store. Once expired,
 * a cached copy may still be used while it is refreshed for $staleWhileRevalidate seconds (default 12 × $maxAge; 0 =
 * never).
 */
function bridge_send(
    array $body,
    int $status = 200,
    int $maxAge = 0,
    int $retryAfter = 0,
    ?int $staleWhileRevalidate = null
): void {
    $json = json_encode($body, BRIDGE_JSON);
    if ($json === false) {
        $status = 500;
        $maxAge = 0;
        $json = '{"error":{"code":"UPSTREAM","retryable":true,"retryAfter":60}}';
    }

    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Robots-Tag: noindex');
        $stale = $staleWhileRevalidate ?? $maxAge * 12;
        header($status === 200 && $maxAge > 0
            ? sprintf('Cache-Control: public, max-age=%d', $maxAge)
                . ($stale > 0 ? sprintf(', stale-while-revalidate=%d', $stale) : '')
            : 'Cache-Control: no-store');
        if ($status >= 400 && $retryAfter > 0) {
            header('Retry-After: ' . $retryAfter);
        }
    }

    echo $json;
}

/** Standard error body: {"error":{"code","retryable","retryAfter"}} (+ $extra top-level fields first). */
function bridge_error(string $code, int $status, ?int $retryAfter = null, array $extra = []): void
{
    $retryable = !in_array($code, BRIDGE_PERMANENT_ERRORS, true);
    $error = ['code' => $code, 'retryable' => $retryable];
    if ($retryable && $retryAfter !== null && $retryAfter > 0) {
        $error['retryAfter'] = $retryAfter;
    }

    bridge_send($extra + ['error' => $error], $status, 0, $error['retryAfter'] ?? 0);
}

/** Sends a bridge_resolve() result in the {"data": …} envelope (github, wakatime, nasa); $result['swr'], when set,
 *  overrides the stale-while-revalidate window (see bridge_send). */
function bridge_respond(array $result, array $extra = []): void
{
    if (!$result['ok']) {
        bridge_error($result['code'], $result['status'], $result['retryAfter']);
        return;
    }

    bridge_send(['data' => array_merge($result['payload'], $extra, [
        'source' => $result['source'],
        'stale' => $result['stale'],
        'fetchedAt' => bridge_iso($result['storedAt']),
    ])], 200, $result['maxAge'], 0, $result['swr'] ?? null);
}
