<?php
declare(strict_types=1);

require __DIR__ . '/_bridge.php';

// GitHub contribution calendar + public profile counts (Activity section) through ONE GraphQL query made with the
// server's token ($GITHUB_TOKEN in config.php). Fresh for 1 h; the last good copy is served for up to 30 days.
//
// GET /github.php → 200 {"data":{"totalContributions","weeks":[{"days":[{"date","weekday","count"}]}],
//                        "profile":{"repos","followers","htmlUrl"}|null,"source","stale","fetchedAt"}}
//                 → 503/429 {"error":{"code":"UPSTREAM"|"RATE_LIMITED"|"NOT_CONFIGURED","retryable","retryAfter"}}

const GITHUB_LOGIN = 'fp-torres';
const GITHUB_POLICY = ['ttl' => 3600, 'maxStale' => 30 * 86400, 'backoff' => 600, 'maxAge' => 300];

// Two aliases of the same user: an error in the profile part can only null "profile", never the calendar.
const GITHUB_QUERY = <<<'GRAPHQL'
query($login: String!) {
  calendar: user(login: $login) {
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
  profile: user(login: $login) {
    url
    followers {
      totalCount
    }
    repositories(privacy: PUBLIC, ownerAffiliations: [OWNER]) {
      totalCount
    }
  }
}
GRAPHQL;

function github_payload(array $calendar, $profile): array
{
    $weeks = [];
    foreach (is_array($calendar['weeks'] ?? null) ? $calendar['weeks'] : [] as $week) {
        $days = [];
        foreach (is_array($week['contributionDays'] ?? null) ? $week['contributionDays'] : [] as $day) {
            $date = $day['date'] ?? null;
            if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                continue;
            }
            $days[] = [
                'date' => $date,
                'weekday' => (int) ($day['weekday'] ?? 0),
                'count' => max(0, (int) ($day['contributionCount'] ?? 0)),
            ];
        }
        $weeks[] = ['days' => $days];
    }

    return [
        'totalContributions' => max(0, (int) ($calendar['totalContributions'] ?? 0)),
        'weeks' => $weeks,
        'profile' => github_profile($profile),
    ];
}

/** {repos, followers, htmlUrl}, or null when GitHub didn't send the counts (the UI then hides them — never 0). */
function github_profile($profile): ?array
{
    if (!is_array($profile)) {
        return null;
    }

    $count = static fn ($value): ?int => is_int($value) && $value >= 0 ? $value : null;
    $repos = $count($profile['repositories']['totalCount'] ?? null);
    $followers = $count($profile['followers']['totalCount'] ?? null);
    if ($repos === null && $followers === null) {
        return null;
    }

    $url = $profile['url'] ?? null;
    return [
        'repos' => $repos,
        'followers' => $followers,
        'htmlUrl' => is_string($url) && str_starts_with($url, 'https://github.com/') ? $url : 'https://github.com/' . GITHUB_LOGIN,
    ];
}

function github_rate_limited(array $response): bool
{
    if ($response['status'] === 429) {
        return true;
    }
    if ($response['status'] === 403 && ($response['headers']['x-ratelimit-remaining'] ?? '') === '0') {
        return true;
    }
    $errors = $response['json']['errors'] ?? null;
    foreach (is_array($errors) ? $errors : [] as $error) {
        if (is_array($error) && ($error['type'] ?? '') === 'RATE_LIMITED') {
            return true;
        }
    }

    return false;
}

function github_fetch(string $token): array
{
    $response = bridge_http('https://api.github.com/graphql', [
        'headers' => [
            'Accept: application/vnd.github+json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        'body' => json_encode(['query' => GITHUB_QUERY, 'variables' => ['login' => GITHUB_LOGIN]]),
    ]);

    $data = $response['json']['data'] ?? null;
    $calendar = $data['calendar']['contributionsCollection']['contributionCalendar'] ?? null;
    if ($response['status'] === 200 && is_array($calendar) && is_array($calendar['weeks'] ?? null)) {
        return bridge_ok(github_payload($calendar, $data['profile'] ?? null));
    }
    if (github_rate_limited($response)) {
        return bridge_fail('RATE_LIMITED', 429, bridge_retry_after($response, 600));
    }

    return bridge_fail('UPSTREAM', 503);
}

$token = bridge_secret('GITHUB_TOKEN');
$result = bridge_resolve(
    'github',
    GITHUB_POLICY,
    $token === '' ? null : static fn (): array => github_fetch($token),
    static fn (): ?array => bridge_legacy_cache('github-contributions.json')
);
bridge_respond($result);
bridge_after($result);
