<?php
// Copy this file to config.php for local development.
// Never commit config.php or include it in shared ZIP files.

$SPOTIFY_CLIENT_ID = getenv('SPOTIFY_CLIENT_ID') ?: '';
$SPOTIFY_CLIENT_SECRET = getenv('SPOTIFY_CLIENT_SECRET') ?: '';
$SPOTIFY_REFRESH_TOKEN = getenv('SPOTIFY_REFRESH_TOKEN') ?: '';
$WAKATIME_TOKEN = getenv('WAKATIME_TOKEN') ?: '';
$GITHUB_TOKEN = getenv('GITHUB_TOKEN') ?: '';
