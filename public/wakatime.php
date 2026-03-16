<?php
// public/wakatime.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

// Tenta carregar as senhas com segurança
if (!file_exists('config.php')) {
    echo json_encode(["error" => "Arquivo config.php ausente no servidor."]);
    exit;
}
require_once 'config.php';

$url = 'https://wakatime.com/api/v1/users/current/stats/all_time';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode($WAKATIME_TOKEN)
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status != 200 || !$response) {
    echo json_encode(["error" => "Falha ao conectar na API do Wakatime", "status" => $status]);
    exit;
}

$data = json_decode($response, true);

// Prepara a resposta filtrando apenas as 4 principais linguagens
$top_languages = [];
if (isset($data['data']['languages'])) {
    $langs = array_slice($data['data']['languages'], 0, 4);
    foreach ($langs as $lang) {
        $top_languages[] = [
            'name' => $lang['name'],
            'percent' => $lang['percent'],
            'color' => $lang['color'] ?? '#38B2AC',
            'text' => $lang['text']
        ];
    }
}

echo json_encode(["data" => $top_languages]);