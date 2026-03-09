<?php
// public/spotify.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

// Suas credenciais oficiais
$client_id = "9207258357794e99b8f058f14a6ad933";
$client_secret = "dc47ec4b3f194681bbc3e8f9b5f7727b";
$refresh_token = "AQCb6Hm4LSJXVQP7KO2haveoZTdsbtDXiaNQd9SxYmViX1z4NdEjLzl319KMcR8d3LoAhp1iBMhFabatvUvK7hCr3tLmSZxkLPq93t0PMk3mghDibf5p2-MVpOC3BoXVoAg";

// 1. Solicitação de Access Token
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://accounts.spotify.com/api/token'); // URL REAL
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=refresh_token&refresh_token=$refresh_token");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($client_id . ':' . $client_secret),
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);
$token_data = json_decode($response);
$access_token = $token_data->access_token;
curl_close($ch);

// 2. Busca da música atual
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.spotify.com/v1/me/player/currently-playing'); // URL REAL
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

// 3. Retorno padronizado
echo json_encode([
    "isPlaying" => $song->is_playing,
    "title" => $song->item->name,
    "artist" => $song->item->artists[0]->name,
    "albumImageUrl" => $song->item->album->images[0]->url,
    "songUrl" => $song->item->external_urls->spotify
]);