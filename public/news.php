<?php
declare(strict_types=1);

require __DIR__ . '/_bridge.php';

// "Radar tech" (Laboratório): today's top DEV Community articles tagged #programming. DEV's API is public (no key):
// the bridge keeps one copy for every visitor (fresh for 30 min, the last good copy served for up to a day) and, for
// the Portuguese page, translates each title once — the same free endpoint as nasa.php, the missing titles batched
// into as few requests as possible (normally one) — and keeps the translation per article: a new article costs one
// translation for everybody, an article already seen costs nothing. When the translator fails, those titles keep
// their original text (translated: false) and the browser doesn't store that answer (it asks again on its next load
// and meanwhile translates them itself — src/hooks/useTechNews.js); translation never fails the request.
// Text fields are plain text: HTML entities decoded once, nothing else touched ("ReadonlyDeep<T>" in a title is
// text — the client renders text, never HTML). Every URL is https.
// src/hooks/useTechNews.js reads DEV directly with the same rules when this bridge can't answer: keep them in sync.
//
// GET /news.php?lang=pt|en
//   → 200 {"data":{"articles":[{"id","title","url","image","avatar","tags","author","publishedAt","readingTime",
//          "lang","translated"}],"lang","translated","source","stale","fetchedAt"}}
//          article.lang = language of the title as served · data.translated = every title is in Portuguese
//   → 400 {"error":{"code":"INVALID_PARAM","retryable":false}}  (bad lang)
//   → 503/429 {"error":{"code":"UPSTREAM"|"RATE_LIMITED","retryable":true,"retryAfter"}}

const NEWS_FEED_ENDPOINT = 'https://dev.to/api/articles?tag=programming&top=1&per_page=10';
const NEWS_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&tl=pt&dt=t';
const NEWS_LANGS = ['pt', 'en'];
const NEWS_FEED_KEY = 'news-devto';
const NEWS_FEED_POLICY = ['ttl' => 1800, 'maxStale' => 86400, 'backoff' => 300, 'maxAge' => 900];
const NEWS_TRANSLATIONS_KEY = 'news-devto-pt';
const NEWS_TRANSLATION_VERSION = '4'; // bump when titles are translated differently: every cached one is redone
const NEWS_TRANSLATION_KEEP = 7 * 86400; // a translation is dropped a week after its article left the list…
const NEWS_TRANSLATION_LIMIT = 200; // …and the least recently listed go first beyond this many
const NEWS_TRANSLATE_TIMEOUT = 4;
const NEWS_TRANSLATE_BACKOFF = 600; // seconds the translator is left alone after it failed (down, 429, not JSON)
const NEWS_GARBLED_RETRY = 6 * 3600; // a title the translator keeps garbling is tried again after this long
const NEWS_TRANSLATE_CHUNK = 4500; // characters per translate request (the endpoint takes about 5000)
// Seconds this request may spend upstream (DEV + translator), so it answers before the browser gives up (12 s).
const NEWS_TIME_BUDGET = 9;
const NEWS_TITLE_MAX = 250;
const NEWS_TAGS_MAX = 4;
// Only what the translator actually mangles stays as written: code identifiers (updated_at → "atualizados_at",
// useEffect, console.log()), CI ("IC"; CI/CD comes back intact), PR/MR ("RP"), pull/merge requests ("solicitação
// pull") and DEV's "Show DEV"/"Ask DEV". Acronyms it keeps by itself (API, REST, LLM, SDK, CLI, UI…) are left free, so
// it can still order them the Portuguese way ("API REST"); AI too, since "IA" is the Portuguese word. No "u" flag: \b
// and \w stay ASCII, as in JavaScript. Same list and steps as src/lib/translate.js (KEEP_TERMS): keep them in sync.
const NEWS_KEEP_TERMS = '~\b(?:Show|Ask) DEV\b|\b[Pp]ull [Rr]equests?\b|\b[Mm]erge [Rr]equests?\b|\bCI\b(?!/)'
    . '|\b(?:PRs?|MRs?)\b|\b[A-Za-z_]\w+(?:\.[A-Za-z_]\w*)+(?:\(\))?|\b[A-Za-z_]\w*\(\)|\b[a-z]+(?:[A-Z][a-z0-9]*)+\b'
    . '|\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b~';
// What the translator may turn the backticks into (seen: “PR”, 'solicitação pull'): [open, close, quotes of the same
// family]. Quotes only count as marks when no backtick is left and the original has no quote of that family (an
// apostrophe inside a word, "don't", isn't one) — the translator turns "…" into “…”, so a pair it may have produced
// itself is never taken for ours — and single quotes only when the translation has no apostrophe ("O'Reilly").
const NEWS_MARKS = [
    ['`', '`', ''],
    ['“', '”', '"“”'],
    ['"', '"', '"“”'],
    ['‘', '’', "'‘’´"],
    ["'", "'", "'‘’´"],
    ['´', '´', "'‘’´"],
];

/** Whitespace of any kind (line breaks included) and control characters → one space; bidi overrides out. */
function news_tidy(string $text): string
{
    $text = (string) preg_replace('/[\x{200B}\x{FEFF}\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', '', $text);

    return trim((string) preg_replace('/[\p{Z}\p{Cc}]+/u', ' ', $text));
}

/** Plain text of a DEV field: entities decoded once ("Q&amp;A" → "Q&A"), whitespace tidied; '' if not a string. */
function news_text($value): string
{
    return is_string($value) ? news_tidy(html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8')) : '';
}

/** At most $max characters (+ "…"), cut at a word when one ends near the limit. */
function news_clip(string $text, int $max): string
{
    if (!preg_match('/^(.{' . $max . '})./su', $text, $match)) {
        return $text;
    }
    $cut = $match[1];
    $space = strrpos($cut, ' ');
    if ($space !== false && $space > strlen($cut) * 0.7) {
        $cut = substr($cut, 0, $space);
    }

    return rtrim($cut, ' .,;:') . '…';
}

function news_url($value): ?string
{
    if (!is_string($value) || strlen($value) > 2048 || filter_var($value, FILTER_VALIDATE_URL) === false) {
        return null;
    }
    $parts = parse_url($value);
    if (!is_array($parts) || strtolower($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') === ''
        || isset($parts['user']) || isset($parts['pass'])) {
        return null;
    }

    return $value;
}

function news_tags(array $item): array
{
    $tags = $item['tag_list'] ?? $item['tags'] ?? [];
    if (is_string($tags)) {
        $tags = explode(',', $tags);
    }

    $clean = [];
    foreach (is_array($tags) ? $tags : [] as $tag) {
        $tag = is_string($tag) ? strtolower(trim($tag)) : '';
        if (preg_match('/^[\p{L}\p{N}_-]{1,30}$/u', $tag) && !in_array($tag, $clean, true)) {
            $clean[] = $tag;
        }
        if (count($clean) === NEWS_TAGS_MAX) {
            break;
        }
    }

    return $clean;
}

/** DEV's language code of an article ("en", "pt", "es"…); English when missing or malformed. */
function news_language($value): string
{
    return is_string($value) && preg_match('/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/D', $value) ? $value : 'en';
}

function news_base_language(string $language): string
{
    return strtolower(explode('-', $language, 2)[0]);
}

function news_article($item): ?array
{
    if (!is_array($item)) {
        return null;
    }
    $url = news_url($item['url'] ?? null);
    $title = news_clip(news_text($item['title'] ?? null), NEWS_TITLE_MAX);
    if ($url === null || $title === '') {
        return null;
    }

    $id = $item['id'] ?? null;
    $user = is_array($item['user'] ?? null) ? $item['user'] : [];
    $author = news_text($user['name'] ?? null);
    if ($author === '') {
        $author = news_text($user['username'] ?? null);
    }
    $published = is_string($item['published_at'] ?? null) ? strtotime($item['published_at']) : false;
    $minutes = $item['reading_time_minutes'] ?? null;

    return [
        'id' => is_int($id) && $id > 0 ? $id : 'u' . substr(hash('sha256', $url), 0, 15),
        'title' => $title,
        'url' => $url,
        'image' => news_url($item['cover_image'] ?? null),
        'avatar' => news_url($user['profile_image_90'] ?? null),
        'tags' => news_tags($item),
        'author' => news_clip($author, 80),
        'publishedAt' => is_int($published) && $published > 0 ? bridge_iso($published) : null,
        'readingTime' => is_numeric($minutes) && $minutes >= 1 && $minutes <= 600
            ? (int) round((float) $minutes)
            : null,
        'lang' => news_language($item['language'] ?? null),
    ];
}

function news_fetch(): array
{
    $response = bridge_http(NEWS_FEED_ENDPOINT, ['headers' => ['Accept: application/json']]);
    if ($response['status'] === 429) {
        return bridge_fail('RATE_LIMITED', 429, bridge_retry_after($response, 300));
    }
    $list = $response['json'];
    if ($response['status'] !== 200 || !is_array($list) || !array_is_list($list)) {
        return bridge_fail();
    }

    $articles = [];
    foreach ($list as $item) {
        $article = news_article($item);
        if ($article !== null) {
            $articles['a' . $article['id']] ??= $article;
        }
    }
    // The radar is never empty: an empty answer is a hiccup, and the last good list keeps being served.
    if ($articles === []) {
        return bridge_fail();
    }

    return bridge_ok(['articles' => array_values($articles)]);
}

// ---------------------------------------------------------------------------------------------------------------
// Portuguese titles, cached per article: ['a<id>' => ['h' => fingerprint, 'title' | 'failedAt', 'at']]
// ('at' = the last time the article was on the list, refreshed whenever the cache is written; 'failedAt' = the
// translator garbled this title, left in its language for NEWS_GARBLED_RETRY).

function news_key(array $article): string
{
    return 'a' . $article['id'];
}

/** Fingerprint of the original title (and of the way it is translated): a changed one is translated again. */
function news_fingerprint(array $article): string
{
    return substr(hash('sha256', NEWS_TRANSLATION_VERSION . "\n" . $article['title']), 0, 20);
}

function news_items(array $entry): array
{
    $items = $entry['payload']['items'] ?? null;
    return is_array($items) ? $items : [];
}

function news_resting(array $entry): bool
{
    return (int) ($entry['failedAt'] ?? 0) + (int) ($entry['backoff'] ?? NEWS_TRANSLATE_BACKOFF) > time();
}

/** [Portuguese titles found, by key; articles still to translate, by key]. Articles in Portuguese need nothing, and
 *  a title the translator garbled recently stays in its language for a while. */
function news_lookup(array $articles, array $items): array
{
    $found = [];
    $missing = [];
    foreach ($articles as $article) {
        if (news_base_language($article['lang']) === 'pt') {
            continue;
        }
        $key = news_key($article);
        $item = $items[$key] ?? null;
        $current = is_array($item) && ($item['h'] ?? null) === news_fingerprint($article);
        if ($current && is_string($item['title'] ?? null) && $item['title'] !== '') {
            $found[$key] = $item['title'];
        } elseif (!$current || (int) ($item['failedAt'] ?? 0) + NEWS_GARBLED_RETRY <= time()) {
            $missing[$key] = $article;
        }
    }

    return [$found, $missing];
}

/** [title with the terms to keep between backticks — the translator leaves most of them alone —, those terms]. A
 *  title with backticks of its own is sent as is. */
function news_protect(string $title): array
{
    if (str_contains($title, '`')) {
        return [$title, []];
    }
    $terms = [];
    $marked = preg_replace_callback(NEWS_KEEP_TERMS, static function (array $match) use (&$terms): string {
        $terms[] = $match[0];
        return '`' . $match[0] . '`';
    }, $title);

    return is_string($marked) ? [$marked, $terms] : [$title, []];
}

/** The marks of a translated title: the first pair of NEWS_MARKS found exactly once per term (null when none fits — a
 *  mark lost, a stray backtick…). */
function news_mark_pattern(string $text, int $count, string $original): ?string
{
    $quotes = (string) preg_replace("/(\p{L})['’´](\p{L})/u", '$1$2', $original);
    $apostrophe = preg_match("/\p{L}['’´]\p{L}/u", $text) === 1;
    foreach (NEWS_MARKS as [$open, $close, $family]) {
        if ($open !== '`' && (str_contains($text, '`') || ($apostrophe && str_contains($family, "'"))
            || preg_match('/[' . preg_quote($family, '/') . ']/u', $quotes) === 1)) {
            continue;
        }
        $fits = $open === $close
            ? substr_count($text, $open) === 2 * $count
            : substr_count($text, $open) === $count && substr_count($text, $close) === $count;
        $pattern = '/' . preg_quote($open, '/') . '([^' . preg_quote($open . $close, '/') . ']*)'
            . preg_quote($close, '/') . '/u';
        if ($fits && preg_match_all($pattern, $text) === $count) {
            return $pattern;
        }
    }

    return null;
}

/** Whether a mark that doesn't hold its term is the translator's rewrite of it ("RP", "solicitação pull") — short,
 *  one word for a one-word term, and without the term — rather than the term with text pulled into the mark ("PRs:",
 *  "CI Is", "IC está"), which is kept as is. */
function news_rewritten(string $content, string $term): bool
{
    if ($content === '') {
        return true;
    }
    $contains = preg_match('/(?<![A-Za-z0-9_])' . preg_quote($term, '/') . '(?![A-Za-z0-9_])/i', $content) === 1;
    $words = count(preg_split('/\s+/u', $content, -1, PREG_SPLIT_NO_EMPTY) ?: []);

    return !$contains && $words <= (str_contains($term, ' ') ? 3 : 1)
        && (int) preg_match_all('/./su', $content) <= 2 * strlen($term) + 6;
}

/** The kept terms back in place of their marks: a mark holding the same text first, the others in order (the
 *  translator still rewrites a few: "`PR`" → "`RP`"). Without usable marks the translation stays as it came. Curly
 *  quotes the original didn't have become straight ones. */
function news_restore(string $translated, array $terms, string $original): string
{
    if ($terms !== []) {
        $pattern = news_mark_pattern($translated, count($terms), $original);
        if ($pattern !== null) {
            preg_match_all($pattern, $translated, $marks);
            $contents = array_map(
                static fn (string $mark): string => (string) preg_replace('/^[\p{Z}\s]+|[\p{Z}\s]+$/u', '', $mark),
                $marks[1]
            );
            $free = $terms;
            $same = [];
            foreach ($contents as $index => $content) {
                foreach ($free as $position => $term) {
                    if (strtolower($term) === strtolower($content)) {
                        $same[$index] = $term;
                        unset($free[$position]);
                        break;
                    }
                }
            }
            $replacements = [];
            foreach ($contents as $index => $content) {
                if (isset($same[$index])) {
                    $replacements[] = $same[$index];
                    continue;
                }
                $term = (string) array_shift($free);
                $replacements[] = news_rewritten($content, $term) ? $term : $content;
            }
            $index = 0;
            $translated = (string) preg_replace_callback(
                $pattern,
                static function (array $match) use (&$index, $replacements, $translated): string {
                    [$mark, $offset] = $match[0];
                    // A kept term never touches a letter in the original: one glued to it lost its space in the
                    // translation.
                    $glued = static fn (string $pattern, string $side): bool => preg_match($pattern, $side) === 1;
                    $before = $glued('/[\p{L}\p{N}]\z/u', substr($translated, 0, $offset)) ? ' ' : '';
                    $after = $glued('/\A[\p{L}\p{N}]/u', substr($translated, $offset + strlen($mark))) ? ' ' : '';
                    return $before . $replacements[$index++] . $after;
                },
                $translated,
                -1,
                $replaced,
                PREG_OFFSET_CAPTURE
            );
        }
        $translated = str_replace('`', '', $translated);
    }
    if (!preg_match('/[“”]/u', $original)) {
        $translated = (string) preg_replace('/[“”]/u', '"', $translated);
    }

    return news_tidy($translated);
}

/** The translator's text, or null when the answer isn't a translation at all (an HTML "Sorry…" page, an error); an
 *  empty text counts as a failure of the translator too, not of one title. */
function news_translation_text($json): ?string
{
    if (!is_array($json) || !is_array($json[0] ?? null)) {
        return null;
    }
    $text = '';
    foreach ($json[0] as $segment) {
        if (is_array($segment) && is_string($segment[0] ?? null)) {
            $text .= $segment[0];
        }
    }

    return $text;
}

/**
 * One request per batch (one title per line), all in parallel. Per batch: ['titles' => Portuguese titles by key],
 * ['wait' => seconds] when the translator itself failed, or ['garbled' => true] when it answered with another number
 * of lines than it was sent (a title merged with the next would be paired with the wrong article).
 */
function news_send(array $batches, int $timeout): array
{
    $requests = [];
    foreach ($batches as $index => $batch) {
        $lines = array_map(
            static fn (array $article): string => news_protect($article['title'])[0],
            $batch['articles']
        );
        $requests[$index] = [
            'url' => NEWS_TRANSLATE_ENDPOINT . '&sl=' . $batch['sl'],
            'timeout' => $timeout,
            'headers' => ['Content-Type: application/x-www-form-urlencoded;charset=UTF-8'],
            'body' => http_build_query(['q' => implode("\n", $lines)]),
        ];
    }

    $results = [];
    foreach (bridge_http_all($requests) as $index => $response) {
        $articles = $batches[$index]['articles'];
        $text = $response['status'] === 200 ? news_translation_text($response['json']) : null;
        if ($text === null || trim($text) === '') {
            $results[$index] = ['wait' => $response['status'] === 429
                ? bridge_retry_after($response, NEWS_TRANSLATE_BACKOFF)
                : NEWS_TRANSLATE_BACKOFF];
            continue;
        }
        $lines = array_map('news_tidy', explode("\n", trim($text)));
        if (count($lines) !== count($articles) || in_array('', $lines, true)) {
            $results[$index] = ['garbled' => true];
            continue;
        }
        $titles = [];
        foreach (array_values($articles) as $position => $article) {
            $terms = news_protect($article['title'])[1];
            $title = news_restore($lines[$position], $terms, $article['title']);
            $titles[news_key($article)] = news_clip($title, NEWS_TITLE_MAX);
        }
        $results[$index] = ['titles' => $titles];
    }

    return $results;
}

/**
 * Portuguese titles of the missing articles in as few requests as possible: every article of a language in the same
 * request (split only beyond NEWS_TRANSLATE_CHUNK characters), all requests in parallel. English — nearly every
 * article — goes with sl=en like nasa.php; another language in a request of its own with sl=auto (a mixed request is
 * detected as one language and may come back untouched). A request answered with the wrong number of lines is asked
 * again one title per request, so one odd title doesn't keep the others in English.
 * Returns [Portuguese titles by key; keys of the titles the translator garbled; backoff seconds after it failed, or
 * null].
 */
function news_translate(array $missing, float $deadline): array
{
    $batches = [];
    $open = [];
    foreach ($missing as $key => $article) {
        $group = news_base_language($article['lang']);
        $size = strlen($article['title']) + 16; // the line break and a few backticks
        $index = $open[$group] ?? null;
        if ($index === null || $batches[$index]['size'] + $size > NEWS_TRANSLATE_CHUNK) {
            $index = $open[$group] = count($batches);
            $batches[] = ['sl' => $group === 'en' ? 'en' : 'auto', 'size' => 0, 'articles' => []];
        }
        $batches[$index]['size'] += $size;
        $batches[$index]['articles'][$key] = $article;
    }

    $titles = [];
    $garbled = [];
    $backoff = null;
    for ($round = 0; $batches !== [] && $round < 2; $round++) {
        $timeout = (int) min(NEWS_TRANSLATE_TIMEOUT, floor($deadline - microtime(true)));
        if ($timeout < 1) {
            break;
        }
        $again = [];
        foreach (news_send($batches, $timeout) as $index => $result) {
            $batch = $batches[$index];
            if (isset($result['titles'])) {
                $titles += $result['titles'];
            } elseif (isset($result['wait'])) {
                $backoff = max($backoff ?? 0, $result['wait']);
            } elseif (count($batch['articles']) > 1) {
                foreach ($batch['articles'] as $key => $article) {
                    $again[] = ['sl' => $batch['sl'], 'size' => 0, 'articles' => [$key => $article]];
                }
            } else {
                $garbled[] = (string) array_key_first($batch['articles']);
            }
        }
        // After a failure of the translator itself, nothing more is asked of it.
        $batches = $backoff === null ? $again : [];
    }

    return [$titles, $garbled, $backoff];
}

/** The translation lock: a handle, null (no locking on this server: go ahead) or false (still busy at $until). */
function news_lock_until(float $until)
{
    while (true) {
        $lock = bridge_lock(NEWS_TRANSLATIONS_KEY);
        if ($lock !== false || microtime(true) + 0.25 > $until) {
            return $lock;
        }
        usleep(250000);
    }
}

/** Keeps what was listed in the last NEWS_TRANSLATION_KEEP seconds, at most NEWS_TRANSLATION_LIMIT entries. */
function news_prune(array $items, int $now): array
{
    $items = array_filter(
        $items,
        static fn ($item): bool => is_array($item) && (int) ($item['at'] ?? 0) > $now - NEWS_TRANSLATION_KEEP
    );
    if (count($items) > NEWS_TRANSLATION_LIMIT) {
        uasort($items, static fn (array $a, array $b): int => (int) $b['at'] <=> (int) $a['at']);
        $items = array_slice($items, 0, NEWS_TRANSLATION_LIMIT, true);
    }

    return $items;
}

/**
 * Portuguese titles of the articles, by key: from the cache, the missing ones translated now. One request translates
 * at a time; a concurrent one waits for it (briefly) instead of paying for the same titles. Titles the translator
 * couldn't handle are simply left out (they keep their original text).
 */
function news_portuguese(array $articles, float $deadline): array
{
    $entry = bridge_cache_get(NEWS_TRANSLATIONS_KEY) ?? [];
    [$found, $missing] = news_lookup($articles, news_items($entry));
    if ($missing === [] || news_resting($entry)) {
        return $found;
    }

    $lock = news_lock_until($deadline - NEWS_TRANSLATE_TIMEOUT);
    $entry = bridge_cache_get(NEWS_TRANSLATIONS_KEY) ?? []; // another request may have translated them meanwhile
    $items = news_items($entry);
    [$found, $missing] = news_lookup($articles, $items);
    if ($lock === false || $missing === [] || news_resting($entry) || $deadline - microtime(true) < 1) {
        bridge_unlock($lock);
        return $found;
    }

    [$translated, $garbled, $backoff] = news_translate($missing, $deadline);
    $now = time();
    foreach ($articles as $article) {
        $key = news_key($article);
        if (isset($translated[$key])) {
            $items[$key] = ['h' => news_fingerprint($article), 'title' => $translated[$key]];
        } elseif (in_array($key, $garbled, true)) {
            $items[$key] = ['h' => news_fingerprint($article), 'failedAt' => $now];
        }
        if (is_array($items[$key] ?? null)) {
            $items[$key]['at'] = $now;
        }
    }
    $fresh = ['storedAt' => $now, 'payload' => ['items' => news_prune($items, $now)]];
    if ($backoff !== null) {
        $fresh += ['failedAt' => $now, 'backoff' => $backoff];
    }
    bridge_cache_put(NEWS_TRANSLATIONS_KEY, $fresh);
    bridge_unlock($lock);

    return $found + $translated;
}

/** The articles as served in $lang: Portuguese titles applied for 'pt', original text otherwise. */
function news_localize(array $articles, string $lang, float $deadline): array
{
    $portuguese = $lang === 'pt' ? news_portuguese($articles, $deadline) : [];

    $localized = [];
    foreach ($articles as $article) {
        $title = $portuguese[news_key($article)] ?? null;
        if ($title !== null) {
            $article['title'] = $title;
            $article['lang'] = 'pt';
        }
        $article['translated'] = $title !== null;
        $localized[] = $article;
    }

    return $localized;
}

$started = microtime(true);
$lang = $_GET['lang'] ?? 'en';
if (!is_string($lang) || !in_array($lang, NEWS_LANGS, true)) {
    bridge_error('INVALID_PARAM', 400);
    return;
}

$result = bridge_resolve(NEWS_FEED_KEY, NEWS_FEED_POLICY, static fn (): array => news_fetch());
if (!$result['ok']) {
    bridge_error($result['code'], $result['status'], $result['retryAfter']);
    return;
}

$articles = array_values(array_filter(
    is_array($result['payload']['articles'] ?? null) ? $result['payload']['articles'] : [],
    static fn ($article): bool => is_array($article) && is_string($article['title'] ?? null)
        && is_string($article['lang'] ?? null) && (is_int($article['id'] ?? null) || is_string($article['id'] ?? null))
));
$articles = news_localize($articles, $lang, $started + NEWS_TIME_BUDGET);
$translated = $lang === 'pt' && $articles !== [] && array_filter(
    $articles,
    static fn (array $article): bool => news_base_language($article['lang']) !== 'pt'
) === [];

$result['payload'] = ['articles' => $articles];
// A Portuguese answer with titles still in another language isn't stored by the browser (no-store): its next load
// asks again, and gets the translations as soon as the translator is back.
if ($lang === 'pt' && !$translated) {
    $result['maxAge'] = 0;
}
bridge_respond($result, ['lang' => $lang, 'translated' => $translated]);
bridge_after($result);
