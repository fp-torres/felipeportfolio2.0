<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function send_spotify_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

function spotify_token_cache_path(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'felipe-portfolio-spotify-token.json';
}

function read_spotify_token(): ?string
{
    $path = spotify_token_cache_path();
    if (!is_readable($path)) {
        return null;
    }

    $cache = json_decode((string) file_get_contents($path), true);
    if (
        !is_array($cache)
        || empty($cache['accessToken'])
        || (int) ($cache['expiresAt'] ?? 0) <= time() + 60
    ) {
        return null;
    }

    return (string) $cache['accessToken'];
}

function write_spotify_token(string $token, int $expiresIn): void
{
    $path = spotify_token_cache_path();
    $encoded = json_encode([
        'accessToken' => $token,
        'expiresAt' => time() + max($expiresIn, 300),
    ]);

    if ($encoded !== false) {
        @file_put_contents($path, $encoded, LOCK_EX);
        @chmod($path, 0600);
    }
}

function request_spotify_token(
    string $clientId,
    string $clientSecret,
    string $refreshToken
): ?string {
    $curl = curl_init('https://accounts.spotify.com/api/token');
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]),
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
            'Content-Type: application/x-www-form-urlencoded',
        ],
    ]);

    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    $data = is_string($response) ? json_decode($response, true) : null;
    if ($status !== 200 || !is_array($data) || empty($data['access_token'])) {
        return null;
    }

    $token = (string) $data['access_token'];
    write_spotify_token($token, (int) ($data['expires_in'] ?? 3600));
    return $token;
}

$configPath = __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
if (!is_readable($configPath)) {
    send_spotify_json(['isPlaying' => false, 'error' => 'Spotify não configurado.'], 503);
}

require $configPath;

$clientId = trim((string) ($SPOTIFY_CLIENT_ID ?? ''));
$clientSecret = trim((string) ($SPOTIFY_CLIENT_SECRET ?? ''));
$refreshToken = trim((string) ($SPOTIFY_REFRESH_TOKEN ?? ''));

if ($clientId === '' || $clientSecret === '' || $refreshToken === '') {
    send_spotify_json(['isPlaying' => false, 'error' => 'Spotify não configurado.'], 503);
}

$accessToken = read_spotify_token()
    ?? request_spotify_token($clientId, $clientSecret, $refreshToken);

if ($accessToken === null) {
    send_spotify_json(['isPlaying' => false, 'error' => 'Falha na autenticação do Spotify.'], 503);
}

$curl = curl_init('https://api.spotify.com/v1/me/player/currently-playing');
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 3,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $accessToken,
    ],
]);

$response = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($status === 204) {
    send_spotify_json(['isPlaying' => false]);
}

$song = is_string($response) ? json_decode($response, true) : null;
if (
    $status !== 200
    || !is_array($song)
    || empty($song['is_playing'])
    || empty($song['item'])
) {
    send_spotify_json(['isPlaying' => false]);
}

$item = $song['item'];
$artists = $item['artists'] ?? [];
$images = $item['album']['images'] ?? [];

send_spotify_json([
    'isPlaying' => true,
    'title' => (string) ($item['name'] ?? ''),
    'artist' => (string) ($artists[0]['name'] ?? ''),
    'albumImageUrl' => (string) ($images[0]['url'] ?? ''),
    'songUrl' => (string) ($item['external_urls']['spotify'] ?? ''),
]);
