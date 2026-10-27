<?php
// Settings for the PHP bridges (github.php, wakatime.php, spotify.php, nasa.php).
//
// Production: .github/workflows/deploy.yml writes dist/config.php from the GitHub Actions secrets named below.
// Local development: copy this file to public/config.php (git-ignored, never served by Vite) and fill it in,
// or export the environment variables before `npm run dev:api`.
// Never commit config.php or include it in shared ZIP files. Every value is optional: a bridge without its
// credentials serves its last cached copy, or answers {"error":{"code":"NOT_CONFIGURED"}} and the UI hides it.

// Spotify "now playing" (spotify.php) — secrets SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN.
// App from developer.spotify.com; refresh token from the Authorization Code flow with the
// user-read-currently-playing scope only.
$SPOTIFY_CLIENT_ID = getenv('SPOTIFY_CLIENT_ID') ?: '';
$SPOTIFY_CLIENT_SECRET = getenv('SPOTIFY_CLIENT_SECRET') ?: '';
$SPOTIFY_REFRESH_TOKEN = getenv('SPOTIFY_REFRESH_TOKEN') ?: '';

// WakaTime coding stats (wakatime.php) — secret WAKATIME_TOKEN: the "Secret API Key" from
// https://wakatime.com/settings/api-key.
$WAKATIME_TOKEN = getenv('WAKATIME_TOKEN') ?: '';

// GitHub contributions + public profile counts (github.php) — secret GH_CONTRIB_TOKEN (secret names cannot start
// with GITHUB_). A fine-grained personal access token with no extra permissions is enough (public data only);
// give it an expiry date and a reminder to renew it.
$GITHUB_TOKEN = getenv('GITHUB_TOKEN') ?: '';

// NASA Astronomy Picture of the Day (nasa.php) — optional secret NASA_API_KEY: free key from https://api.nasa.gov
// (1,000 requests/hour). Without it the bridge uses NASA's DEMO_KEY, whose small limit is shared per IP address;
// every date is cached on the server either way.
$NASA_API_KEY = getenv('NASA_API_KEY') ?: '';
