<?php
// public/spotify.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

// Tenta carregar as senhas com segurança
if (!file_exists('config.php')) {
    echo json_encode(["isPlaying" => false, "error" => "Arquivo config.php ausente no servidor."]);
    exit;
}
require_once 'config.php';

// 1. Pede o Access Token usando as variáveis seguras
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://accounts.spotify.com/api/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=refresh_token&refresh_token=" . $SPOTIFY_REFRESH_TOKEN);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($SPOTIFY_CLIENT_ID . ':' . $SPOTIFY_CLIENT_SECRET),
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);
$token_data = json_decode($response);

// Proteção caso o token expire ou dê erro
if (!isset($token_data->access_token)) {
    echo json_encode(["isPlaying" => false, "error" => "Falha ao gerar access token"]);
    exit;
}

$access_token = $token_data->access_token;
curl_close($ch);

// 2. Busca a música atual
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.spotify.com/v1/me/player/currently-playing');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $access_token"]);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status == 204 || !$result) {
    echo json_encode(["isPlaying" => false]);
    exit;
}

$song = json_decode($result);

// Verifica se realmente tem uma música tocando
if (!isset($song->is_playing) || !$song->is_playing || !isset($song->item)) {
    echo json_encode(["isPlaying" => false]);
    exit;
}

// 3. Retorno padronizado para o React
echo json_encode([
    "isPlaying" => true,
    "title" => $song->item->name,
    "artist" => $song->item->artists[0]->name,
    "albumImageUrl" => $song->item->album->images[0]->url,
    "songUrl" => $song->item->external_urls->spotify
]);