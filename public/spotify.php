<?php
declare(strict_types=1);

require __DIR__ . '/_bridge.php';

// What Felipe is playing on Spotify, for the floating mini player (each visitor polls every 30 s).
// - One answer is shared by every visitor for 15 s; the access token is reused until it expires.
// - When Spotify rejects the credentials, the bridge stops trying for 15 min and answers at once
//   200 {"isPlaying":false,"available":false,"retryAfter":N} (the widget then uses its Lanyard fallback).
//
// GET /spotify.php → 200 {"isPlaying":true,"title","artist","albumImageUrl","songUrl","fetchedAt"}
//                  → 200 {"isPlaying":false,"available":true,"fetchedAt"} | {"isPlaying":false,"available":false,…}
//                  → 503/429 {"isPlaying":false,"error":{"code":"UPSTREAM"|"RATE_LIMITED","retryable":true,"retryAfter"}}

const SPOTIFY_POLICY = ['ttl' => 15, 'maxStale' => 120, 'backoff' => 30, 'maxAge' => 0, 'background' => false];
const SPOTIFY_AUTH_BACKOFF = 900;

function spotify_unavailable(string $reason, int $retryAfter): void
{
    bridge_send(['isPlaying' => false, 'available' => false, 'reason' => $reason, 'retryAfter' => $retryAfter]);
}

function spotify_text($value): string
{
    return is_scalar($value) ? trim((string) $value) : '';
}

/** Smallest cover that still looks sharp at 40 px on a 3x screen (Spotify sends 640, 300 and 64 px). */
function spotify_cover($images): string
{
    $best = '';
    $bestWidth = PHP_INT_MAX;
    $largest = '';
    $largestWidth = -1;
    foreach (is_array($images) ? $images : [] as $image) {
        $url = spotify_text($image['url'] ?? '');
        if (!str_starts_with($url, 'https://')) {
            continue;
        }
        $width = (int) ($image['width'] ?? 0);
        if ($width >= 128 && $width < $bestWidth) {
            [$best, $bestWidth] = [$url, $width];
        }
        if ($width > $largestWidth) {
            [$largest, $largestWidth] = [$url, $width];
        }
    }

    return $best !== '' ? $best : $largest;
}

function spotify_payload(array $playback): array
{
    $item = $playback['item'] ?? null;
    if (empty($playback['is_playing']) || !is_array($item) || ($playback['currently_playing_type'] ?? 'track') !== 'track') {
        return ['isPlaying' => false, 'available' => true];
    }

    return [
        'isPlaying' => true,
        'title' => spotify_text($item['name'] ?? ''),
        'artist' => spotify_text($item['artists'][0]['name'] ?? ''),
        'albumImageUrl' => spotify_cover($item['album']['images'] ?? []),
        'songUrl' => spotify_text($item['external_urls']['spotify'] ?? ''),
    ];
}

/**
 * Access token from the private cache, or a new one from the refresh token.
 * Returns [token, null] or [null, bridge_fail(...)] (AUTH_FAILED when Spotify rejects the credentials).
 */
function spotify_access_token(array $credentials, bool $forceRefresh): array
{
    $configHash = hash('sha256', implode("\n", $credentials));
    $cached = bridge_cache_get('spotify-token') ?? [];
    if (($cached['configHash'] ?? '') !== $configHash) {
        $cached = []; // the credentials changed since: forget the old token
    }
    if (!$forceRefresh && is_string($cached['accessToken'] ?? null) && (int) ($cached['expiresAt'] ?? 0) > time() + 60) {
        return [$cached['accessToken'], null];
    }

    // Spotify may rotate the refresh token: the newest one is kept next to the access token.
    $refreshTokens = array_values(array_unique(array_filter(
        [$cached['refreshToken'] ?? null, $credentials['refreshToken']],
        static fn ($token): bool => is_string($token) && $token !== ''
    )));
    foreach ($refreshTokens as $refreshToken) {
        $response = bridge_http('https://accounts.spotify.com/api/token', [
            'headers' => [
                'Accept: application/json',
                'Authorization: Basic ' . base64_encode($credentials['clientId'] . ':' . $credentials['clientSecret']),
                'Content-Type: application/x-www-form-urlencoded',
            ],
            'body' => http_build_query(['grant_type' => 'refresh_token', 'refresh_token' => $refreshToken]),
        ]);
        $json = $response['json'] ?? [];
        $token = $json['access_token'] ?? null;
        if ($response['status'] === 200 && is_string($token) && $token !== '') {
            $entry = [
                'configHash' => $configHash,
                'accessToken' => $token,
                'expiresAt' => time() + max(300, (int) ($json['expires_in'] ?? 3600)),
            ];
            $rotated = $json['refresh_token'] ?? null;
            if (is_string($rotated) && $rotated !== '' && $rotated !== $credentials['refreshToken']) {
                $entry['refreshToken'] = $rotated;
            } elseif ($refreshToken !== $credentials['refreshToken']) {
                $entry['refreshToken'] = $refreshToken;
            }
            bridge_cache_put('spotify-token', $entry);
            return [$token, null];
        }
        if (!in_array($response['status'], [400, 401, 403], true)) { // network, 429 or 5xx: try again soon
            return [null, $response['status'] === 429
                ? bridge_fail('RATE_LIMITED', 429, bridge_retry_after($response, 60))
                : bridge_fail('UPSTREAM', 503, 60)];
        }
    }

    bridge_cache_put('spotify-token', ['configHash' => $configHash]);
    return [null, bridge_fail('AUTH_FAILED', 503, SPOTIFY_AUTH_BACKOFF)];
}

function spotify_fetch(array $credentials): array
{
    [$token, $failure] = spotify_access_token($credentials, false);
    if ($token === null) {
        return $failure;
    }

    $request = static fn (string $accessToken): array => bridge_http(
        'https://api.spotify.com/v1/me/player/currently-playing',
        ['headers' => ['Accept: application/json', 'Authorization: Bearer ' . $accessToken]]
    );
    $response = $request($token);
    if ($response['status'] === 401) { // token revoked before its expiry: get a new one, once
        [$token, $failure] = spotify_access_token($credentials, true);
        if ($token === null) {
            return $failure;
        }
        $response = $request($token);
    }

    if ($response['status'] === 204) {
        return bridge_ok(['isPlaying' => false, 'available' => true]);
    }
    if ($response['status'] === 200 && is_array($response['json'])) {
        return bridge_ok(spotify_payload($response['json']));
    }
    if ($response['status'] === 403) { // missing scope (user-read-currently-playing)
        return bridge_fail('AUTH_FAILED', 503, SPOTIFY_AUTH_BACKOFF);
    }
    if ($response['status'] === 429) {
        return bridge_fail('RATE_LIMITED', 429, bridge_retry_after($response, 30));
    }

    return bridge_fail('UPSTREAM', 503, 30);
}

$credentials = [
    'clientId' => bridge_secret('SPOTIFY_CLIENT_ID'),
    'clientSecret' => bridge_secret('SPOTIFY_CLIENT_SECRET'),
    'refreshToken' => bridge_secret('SPOTIFY_REFRESH_TOKEN'),
];
if (in_array('', $credentials, true)) {
    spotify_unavailable('NOT_CONFIGURED', SPOTIFY_AUTH_BACKOFF);
    return;
}

// Keyed by the credentials, so new secrets are tried at once instead of after the 15-minute pause.
$nowKey = 'spotify-now-' . substr(hash('sha256', implode("\n", $credentials)), 0, 12);
$result = bridge_resolve($nowKey, SPOTIFY_POLICY, static fn (): array => spotify_fetch($credentials));
if ($result['ok']) {
    bridge_send($result['payload'] + ['fetchedAt' => bridge_iso($result['storedAt'])]);
} elseif ($result['code'] === 'AUTH_FAILED') {
    spotify_unavailable('AUTH_FAILED', (int) $result['retryAfter']);
} else {
    bridge_error($result['code'], $result['status'], $result['retryAfter'], ['isPlaying' => false]);
}
