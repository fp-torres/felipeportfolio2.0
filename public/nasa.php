<?php
declare(strict_types=1);

require __DIR__ . '/_bridge.php';

// NASA Astronomy Picture of the Day for the "Laboratório" sheets (NASA hoje + Máquina do tempo).
// Source: NASA Science (science.nasa.gov), where every APOD is now a WordPress post titled "APOD: 2026 October 2 –
// Title", read through its public REST API: no key, nothing to configure. apod.nasa.gov now redirects every page to
// a generic landing page, and api.nasa.gov, built on those pages, no longer has the picture: neither is used.
// Every date is fetched once and cached (past dates never change), the latest picture is re-checked every 30 min,
// and the Portuguese text is translated once per date. Text fields are plain text and every URL is https.
// src/hooks/useApod.js reads NASA Science with the same steps when this bridge can't answer: keep them in sync.
//
// GET /nasa.php?date=YYYY-MM-DD&lang=pt|en   (no date, or today in New York = the latest picture published)
//   → 200 {"data":{"date","title","explanation","mediaType":"image"|"video"|"other","url","hdUrl","thumbnailUrl",
//          "copyright","link","lang","translated","source","stale","fetchedAt"}}   (link = the post on NASA's site)
//   → 400 {"error":{"code":"INVALID_PARAM"}}  (bad date/lang)
//   → 404 {"error":{"code":"NOT_FOUND","retryable":false}}  (a valid date without a picture in NASA's archive)
//   → 503/429 {"error":{"code":"UPSTREAM"|"RATE_LIMITED","retryable":true,"retryAfter"}}

const APOD_FIRST_DATE = '1995-06-16';
const APOD_POSTS_ENDPOINT = 'https://science.nasa.gov/wp-json/wp/v2/image-article';
const APOD_POST_FIELDS = 'id,date,link,title,content,_links,_embedded';
const APOD_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t';
// Cache keys of this parser. Entries written by earlier versions may hold what it no longer gives: the NASA logo
// ("apod-…", from api.nasa.gov), or ("apod2-…") a logo as video poster, original-size pictures, labels in the text
// and "no picture" for days whose title it could not read.
const APOD_CACHE_PREFIX = 'apod3-';
const APOD_PAST_POLICY = ['ttl' => 30 * 86400, 'maxStale' => 3650 * 86400, 'backoff' => 600, 'maxAge' => 86400];
const APOD_LATEST_POLICY = ['ttl' => 1800, 'maxStale' => 2 * 86400, 'backoff' => 300, 'maxAge' => 1800];
// Seconds this request may spend on upstream lookups, so it answers before the browser gives up (12 s).
const APOD_TIME_BUDGET = 8;
const APOD_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];
// Generic images of NASA's site (the NASA logo and "meatball", the stock art under /images/misc/ that posts without
// a picture carry — "news-thumbnail.png" —, theme files): never shown as the picture of the day.
const APOD_PLACEHOLDER_URL = '#nasa[-_]?logo|meatball|news-thumbnail|/images/misc/|/wp-content/themes/#i';
// APOD's own folder on NASA's asset server: a featured image anywhere else never stands for the picture on its own
// (as a video's poster, or for a post without the usual media block).
const APOD_OWN_IMAGE = '#/science/cds/apod/#i';
// The breadcrumb of NASA's APOD section ("Science › APOD › …"), on every APOD post: tells one whose title has no
// "APOD:" (1995-12-19, "Albert Einstein: 1879 – 1955") from NASA's other image articles.
const APOD_SECTION = '#/apod/apod-index/"[^>]*>\s*<span>\s*APOD\s*</span>#i';
// The label before the names: "Image Credit & Copyright:", "Credit and Copyright:", "Video Credit:", a bare "Credit".
const APOD_CREDIT_LABEL = '/^(?:[a-z &]*(?:credit|copyright)[a-z &]*:\s*|credit\s+)+/i';
const APOD_VIDEO_FILE = '/\.(?:mp4|webm|m4v|mov)$/i'; // what the client plays in a <video> element
const APOD_IMAGE_FILE = '/\.(?:jpe?g|png|gif|webp|avif|tiff?)$/i';
const APOD_YOUTUBE = '#(?:youtube(?:-nocookie)?\.com/(?:embed/|shorts/|watch\?(?:\S*?&)?v=)|youtu\.be/)([\w-]{11})#i';
const APOD_VIMEO = '#vimeo\.com/(?:video/)?(\d+)#i';

function apod_valid_date(string $date, string $today): bool
{
    // D: "$" must be the very end — without it "2026-10-02\n" would pass (and reach NASA and the cache).
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $date, $parts)
        || !checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
        return false;
    }

    return $date >= APOD_FIRST_DATE && $date <= $today; // ISO dates compare as strings
}

function apod_text($value): string
{
    return is_string($value) ? trim((string) preg_replace('/\s+/', ' ', $value)) : '';
}

/** Plain text of an HTML fragment: no tags, entities decoded, spaces tidied ("Hubble ( STScI ) ." → "Hubble (STScI)."). */
function apod_plain(string $html): string
{
    $text = strip_tags((string) preg_replace('#<br\s*/?>#i', ' ', $html));
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = (string) preg_replace('/[\s\x{00A0}\x{2009}\x{202F}]+/u', ' ', $text);
    $text = (string) preg_replace(['/ ([,;!?)\]])/u', '/ ([.:])(?= |$)/u', '/([(\[]) /u'], '$1', $text);

    return trim($text);
}

/** Decoded value of one attribute of an HTML tag ('' when absent). */
function apod_attr(string $tag, string $name): string
{
    return preg_match('/\s' . $name . '\s*=\s*(["\'])(.*?)\1/is', $tag, $match)
        ? trim(html_entity_decode($match[2], ENT_QUOTES | ENT_HTML5, 'UTF-8'))
        : '';
}

/**
 * Absolute https URL ('' when unusable). apod.nasa.gov is refused (every address there now redirects to a generic
 * page), and so are NASA's placeholder images, which must never pass for the picture of the day.
 */
function apod_url($value): string
{
    if (!is_string($value) || ($value = trim($value)) === '') {
        return '';
    }
    if (str_starts_with($value, '//')) {
        $value = 'https:' . $value;
    } elseif (!preg_match('#^[a-z][a-z0-9+.-]*:#i', $value)) {
        $value = 'https://science.nasa.gov/' . ltrim($value, '/');
    }

    $parts = parse_url($value);
    if (!is_array($parts) || empty($parts['host']) || !in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)
        || strtolower($parts['host']) === 'apod.nasa.gov' || preg_match(APOD_PLACEHOLDER_URL, $parts['path'] ?? '')) {
        return '';
    }

    return (string) preg_replace('#^http:#i', 'https:', $value);
}

function apod_file_name(string $url): string
{
    return strtolower(basename((string) parse_url($url, PHP_URL_PATH)));
}

/**
 * [date, title] of a post titled "APOD: 2026 October 2 &#8211; Title" (old ones write the day as "01", a few have no
 * dash: "APOD: 2017 November 22 ‘Oumuamua: …"), or null.
 */
function apod_title_parts($rendered): ?array
{
    $title = is_string($rendered) ? apod_plain($rendered) : '';
    if (!preg_match('/^APOD:\s*(\d{4})\s+([a-z]{3,})\.?\s+(\d{1,2})(?:\s*[–—-]\s*|\s+)(.+)$/iu', $title, $match)) {
        return null;
    }

    $month = 0;
    foreach (APOD_MONTHS as $index => $name) {
        if (stripos($name, $match[2]) === 0) {
            $month = $index + 1;
            break;
        }
    }
    if ($month === 0 || !checkdate($month, (int) $match[3], (int) $match[1])) {
        return null;
    }

    return [sprintf('%04d-%02d-%02d', (int) $match[1], $month, (int) $match[3]), trim($match[4])];
}

/**
 * The post's featured image when it is a real picture: ['full', 'light', 'gif', 'own'], or null (missing or a
 * placeholder). own: in APOD's own folder (APOD_OWN_IMAGE).
 */
function apod_featured_image(array $post): ?array
{
    $media = $post['_embedded']['wp:featuredmedia'][0] ?? null;
    $full = is_array($media) && ($media['media_type'] ?? '') === 'image' ? apod_url($media['source_url'] ?? '') : '';
    if ($full === '' || apod_file_name($full) === '') {
        return null;
    }

    // WordPress' lighter rendition (≈1280 px) for the page; the original stays as the high-resolution link.
    $light = '';
    foreach (['large', 'medium_large', '1536x1536'] as $size) {
        $light = apod_url($media['media_details']['sizes'][$size]['source_url'] ?? '');
        if ($light !== '') {
            break;
        }
    }

    return [
        'full' => $full,
        'light' => $light,
        'gif' => ($media['mime_type'] ?? '') === 'image/gif',
        'own' => (bool) preg_match(APOD_OWN_IMAGE, (string) parse_url($full, PHP_URL_PATH)),
    ];
}

/**
 * The page's <img> at most 1280 px wide or tall: NASA's image service (/dynamicimage/assets/science/…) resizes on
 * request (?w=&h=&fit=clip); /content/dam/science/… serves the same file as is, whatever the query says — and so
 * does the service when asked for ?w=0 (what WordPress writes for about 1% of the pictures, without any lighter
 * size). The size comes from the tag or from the URL (?w=2048): a smaller picture is left alone (the service would
 * enlarge it), an unknown one is resized (the original can weigh several MB). A GIF stays as is (a rendition would
 * be a still frame), and so does one of NASA's own renditions (…/jcr:content/renditions/cq5dam.web.1280.1280.jpeg).
 */
function apod_light_image(string $src, string $tag = ''): string
{
    parse_str((string) parse_url($src, PHP_URL_QUERY), $query);
    $size = max(
        (int) apod_attr($tag, 'width'),
        (int) apod_attr($tag, 'height'),
        (int) ($query['w'] ?? 0),
        (int) ($query['h'] ?? 0)
    );
    $file = '#^https://assets\.science\.nasa\.gov/(?:dynamicimage/assets|content/dam)(/science/[^?:]+)(?:\?|$)#i';
    if (($size === 0 || $size > 1280) && preg_match($file, $src, $match) && !preg_match('/\.gif$/i', $match[1])) {
        return 'https://assets.science.nasa.gov/dynamicimage/assets' . $match[1] . '?w=1280&h=1280&fit=clip';
    }

    return $src;
}

/**
 * [mediaType, url, hdUrl, thumbnailUrl] from the media block above the post's title (the picture, NASA's video
 * player or a YouTube/Vimeo embed). The featured image alone is not enough: posts without a picture carry the NASA
 * logo or its "meatball" there, so it only serves as a lighter copy of the same picture, or — when it is in APOD's
 * own folder — as a video's poster. No poster: thumbnailUrl '' (the player shows the video itself).
 */
function apod_media(array $post, string $content): array
{
    $image = apod_featured_image($post);
    $own = $image !== null && $image['own'];
    $poster = $own ? apod_light_image($image['light'] !== '' ? $image['light'] : $image['full']) : '';

    $start = strpos($content, 'media-detail-hero__media');
    $end = $start === false ? false : strpos($content, '<h1', $start);
    $hero = $end === false ? '' : substr($content, $start, $end - $start);

    // YouTube/Vimeo: an <iframe>, or the bare link when WordPress could not render the embed.
    if (preg_match('/<iframe\b[^>]*>/i', $hero, $match) || str_contains($hero, 'wp-block-embed')) {
        $embed = isset($match[0]) ? apod_attr($match[0], 'src') : apod_plain($hero);
        if (preg_match(APOD_YOUTUBE, $embed, $id)) {
            $thumbnail = $poster !== '' ? $poster : 'https://img.youtube.com/vi/' . $id[1] . '/hqdefault.jpg';
            return ['video', 'https://www.youtube.com/embed/' . $id[1] . '?rel=0', '', $thumbnail];
        }
        if (preg_match(APOD_VIMEO, $embed, $id)) {
            return ['video', 'https://player.vimeo.com/video/' . $id[1], '', $poster];
        }

        return ['other', '', '', '']; // an interactive page (the old apod.nasa.gov ones now redirect away)
    }

    // NASA's own player: the first video file of <video src> or its <source> elements (not a stream playlist).
    if (preg_match('#<video\b([^>]*)>(.*?)</video>#is', $hero, $match)) {
        preg_match_all('/<source\b[^>]*>/i', $match[2], $sources);
        foreach (array_merge(['<video' . $match[1] . '>'], $sources[0]) as $tag) {
            $src = apod_url(apod_attr($tag, 'src'));
            if (preg_match(APOD_VIDEO_FILE, (string) parse_url($src, PHP_URL_PATH))) {
                $videoPoster = apod_url(apod_attr($match[1], 'poster'));
                $ownPoster = preg_match(APOD_OWN_IMAGE, (string) parse_url($videoPoster, PHP_URL_PATH));
                return ['video', $src, '', $ownPoster ? $videoPoster : $poster];
            }
        }

        return ['other', '', '', ''];
    }

    if (preg_match('/<img\b[^>]*>/i', $hero, $match)) {
        $src = apod_url(apod_attr($match[0], 'src'));
        // The picture links to its original file ("Clicking on the picture will download the highest resolution…").
        $full = preg_match('/<a\b[^>]*>\s*<img\b/i', $hero, $link) ? apod_url(apod_attr($link[0], 'href')) : '';
        if (!preg_match(APOD_IMAGE_FILE, (string) parse_url($full, PHP_URL_PATH))) {
            $full = '';
        }

        $sameImage = $image !== null
            && in_array(apod_file_name($image['full']), [apod_file_name($full), apod_file_name($src)], true);
        if ($sameImage) {
            // An animated GIF stays the original file (a rendition would be a still frame).
            $url = $image['gif']
                ? $full
                : ($image['light'] !== '' ? apod_light_image($image['light']) : apod_light_image($src, $match[0]));
            return ['image', $url !== '' ? $url : $image['full'], $full !== '' ? $full : $image['full'], ''];
        }
        if ($src !== '' || $full !== '') {
            $url = $src !== '' ? apod_light_image($src, $match[0]) : apod_light_image($full);
            return ['image', $url, $full !== '' ? $full : $src, ''];
        }
    }

    // A post without the usual media block: its featured image, if it is APOD's own picture.
    if ($hero === '' && $own) {
        return ['image', $poster, $image['full'], ''];
    }

    return ['other', '', '', ''];
}

/** The explanation paragraph without the notes NASA appends to it (Tomorrow's picture, mirrors, calendars…). */
function apod_explanation(string $content): string
{
    if (!preg_match('#<p\b[^>]*media-detail-hero__description[^>]*>(.*?)</p>#is', $content, $match)) {
        return '';
    }
    $text = preg_split('#<br\s*/?>\s*<br\s*/?>|<strong>\s*Tomorrow#i', $match[1], 2)[0] ?? '';

    // Some posts repeat the label ("<strong>Explanation:</strong> Explanation : What is…").
    return (string) preg_replace('/^(?:Explanation\s*:\s*)+/i', '', apod_plain($text));
}

/**
 * The credit line of the post's details table, without its label ("Image Credit & Copyright: Name" → "Name").
 * In 1997 the cell starts with the picture's caption on a line of its own ("Hale-Bopp and Andromeda <br> Credit and
 * Copyright: A. Dimai…"): left out. So is the escaped start of a broken link some cells carry ("NASA / &lt;a GSFC").
 */
function apod_credit(string $content): string
{
    preg_match_all('#<th\b[^>]*>(.*?)</th>\s*<td\b[^>]*>(.*?)</td>#is', $content, $rows, PREG_SET_ORDER);
    foreach ($rows as $row) {
        if (!preg_match('/credit|copyright/i', apod_plain($row[1]))) {
            continue;
        }
        $cell = (string) preg_replace('/&lt;a\b\s*/i', '', $row[2]);
        $lines = preg_split('#<br\s*/?>#i', $cell, 2) ?: [$cell];
        if (count($lines) === 2 && !preg_match('/credit|copyright/i', apod_plain($lines[0]))
            && preg_match('/^[a-z &]*(?:credit|copyright)[a-z &]*:/i', apod_plain($lines[1]))) {
            $cell = $lines[1];
        }

        return trim((string) preg_replace(APOD_CREDIT_LABEL, '', apod_plain($cell)));
    }

    return '';
}

/**
 * Our payload from one NASA Science post, or null when it is not an APOD post. $date: the day it was picked for
 * (see apod_day_post: its title may name no day, or the wrong year); null = the day its title names.
 */
function apod_post_payload(array $post, ?string $date = null): ?array
{
    $parts = apod_title_parts($post['title']['rendered'] ?? null);
    $date ??= $parts[0] ?? null;
    // A title that names no day only loses its "APOD: 2026 April –" ("Albert Einstein: 1879 – 1955" stays whole).
    $title = $parts[1] ?? trim((string) preg_replace(
        '/^APOD:\s*(?:\d{4}\s+[a-z]{3,}\.?(?:\s+\d{1,2})?\s*[–—-]\s*)?/iu',
        '',
        is_string($post['title']['rendered'] ?? null) ? apod_plain($post['title']['rendered']) : ''
    ));
    if ($date === null || $title === '') {
        return null;
    }

    $content = is_string($post['content']['rendered'] ?? null) ? $post['content']['rendered'] : '';
    [$mediaType, $url, $hdUrl, $thumbnailUrl] = apod_media($post, $content);
    $link = apod_url($post['link'] ?? '');

    return [
        'date' => $date,
        'title' => $title,
        'explanation' => apod_explanation($content),
        'mediaType' => $mediaType,
        'url' => $mediaType === 'other' ? $link : $url, // what NASA's page shows, when it can't be shown here
        'hdUrl' => $hdUrl,
        'thumbnailUrl' => $thumbnailUrl,
        'copyright' => apod_credit($content),
        'link' => $link,
    ];
}

/** Seconds left for upstream lookups in this request. */
function apod_budget(): int
{
    $start = (float) ($_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true));
    return (int) floor(APOD_TIME_BUDGET - (microtime(true) - $start));
}

/** GET on NASA Science's posts API: ['ok' => true, 'posts' => list] or a bridge_fail() result. */
function apod_posts(array $query, string $path = ''): array
{
    $budget = apod_budget();
    if ($budget < 2) {
        return bridge_fail();
    }

    $response = bridge_http(
        APOD_POSTS_ENDPOINT . $path . '?' . http_build_query($query + ['_fields' => APOD_POST_FIELDS]),
        ['timeout' => min(5, $budget)]
    );
    if ($response['status'] === 429) {
        return bridge_fail('RATE_LIMITED', 429, bridge_retry_after($response, 600));
    }
    if ($response['status'] !== 200 || !is_array($response['json'])) {
        return bridge_fail();
    }
    $posts = array_is_list($response['json']) ? $response['json'] : [$response['json']]; // one post when asked by id

    return ['ok' => true, 'posts' => array_values(array_filter($posts, 'is_array'))];
}

/** The APOD post of $date among $posts — when two titles name it, the one also published that day (NASA titled
 *  2006-02-17 and 18 "2007"), else the first — or the most recent one up to $today when $date is null. Of two posts
 *  titled and published the same day, the last one is kept (2007-07-16: Manhattanhenge, most likely the missing
 *  2007-07-13, then the Lagoon Nebula). */
function apod_pick(array $posts, ?string $date, string $today): ?array
{
    $best = null;
    $bestDate = '';
    $sameDay = null;
    foreach ($posts as $post) {
        $postDate = apod_title_parts($post['title']['rendered'] ?? null)[0] ?? '';
        if ($postDate === '') {
            continue;
        }
        if ($date === null) {
            if ($postDate <= $today && $postDate > $bestDate) {
                [$best, $bestDate] = [$post, $postDate];
            }
        } elseif ($postDate === $date) {
            if (is_string($post['date'] ?? null) && substr($post['date'], 0, 10) === $date) {
                $sameDay = $post;
            } else {
                $best ??= $post;
            }
        }
    }

    return $sameDay ?? $best;
}

/**
 * The APOD post of $date among the posts published that day when no title names that day: the only APOD post
 * (titled "APOD…", or in NASA's APOD section) whose WordPress date is $date and whose title names no other day —
 * one without the day ("APOD: 2026 April – …"), without "APOD:" (1995-12-19) or with the wrong year (2006-02-17 and
 * 18, titled 2007). A title naming another day belongs to that day (a picture published late). Null: none, or two.
 */
function apod_day_post(array $posts, string $date): ?array
{
    $found = [];
    foreach ($posts as $post) {
        $title = is_string($post['title']['rendered'] ?? null) ? apod_plain($post['title']['rendered']) : '';
        $content = is_string($post['content']['rendered'] ?? null) ? $post['content']['rendered'] : '';
        $named = apod_title_parts($post['title']['rendered'] ?? null)[0] ?? '';
        if (is_string($post['date'] ?? null) && substr($post['date'], 0, 10) === $date
            && (stripos($title, 'APOD') === 0 || preg_match(APOD_SECTION, $content))
            && ($named === '' || substr($named, 4) === substr($date, 4))) {
            $found[] = $post;
        }
    }

    return count($found) === 1 ? $found[0] : null;
}

/**
 * The post of one day: what was published that day (the API also counts hidden entries, about 7 a day, hence 100
 * per page), then a title search for the few published on another day. ['ok' => true, 'post' => ?array] — post null
 * means NASA has no picture for that day — or a bridge_fail() result when NASA could not be asked.
 */
function apod_find_post(string $date, string $today): array
{
    $day = new DateTimeImmutable($date);
    $window = apod_posts([
        'after' => $day->modify('-1 day')->format('Y-m-d') . 'T23:59:59',
        'before' => $day->modify('+1 day')->format('Y-m-d') . 'T00:00:00',
        'per_page' => 100,
        '_embed' => 'wp:featuredmedia',
    ]);
    // A rate limit ends the lookup (more requests would only extend it). A slow or failed answer does not: NASA's API
    // stalls now and then for a single query, and the time budget bounds the searches. (The browser, whose visitor
    // already waited for this bridge, stops at any request without an answer.)
    if (!$window['ok'] && $window['code'] === 'RATE_LIMITED') {
        return $window;
    }
    $post = $window['ok']
        ? apod_pick($window['posts'], $date, $today) ?? apod_day_post($window['posts'], $date)
        : null;
    $failure = $window['ok'] ? null : $window;

    // Old titles may write the day with a leading zero ("APOD: 2000 January 01 – …"): one search for each form.
    $name = APOD_MONTHS[(int) $day->format('n') - 1];
    foreach (array_unique([$day->format('j'), $day->format('d')]) as $dayText) {
        if ($post !== null) {
            break;
        }
        $search = 'APOD ' . $day->format('Y') . " $name $dayText";
        $found = apod_posts(['search' => $search, 'per_page' => 100, '_fields' => 'id,title,date']);
        $match = $found['ok'] ? apod_pick($found['posts'], $date, $today) : null;
        if ($match !== null) {
            $found = apod_posts(['_embed' => 'wp:featuredmedia'], '/' . (int) ($match['id'] ?? 0));
            $post = $found['ok'] ? apod_pick($found['posts'], $date, $today) : null;
        }
        $failure ??= $found['ok'] ? null : $found;
        if (!$found['ok'] && $found['code'] === 'RATE_LIMITED') {
            break;
        }
    }

    // "No picture" only when every request was answered: one that failed proves nothing (asked again after the
    // backoff, not 6 h later).
    return $post !== null || $failure === null ? ['ok' => true, 'post' => $post] : $failure;
}

/** The latest post (same shape as apod_find_post): the newest "APOD" posts, or the last three days' posts. */
function apod_find_latest(string $today): array
{
    $newest = ['orderby' => 'date', 'order' => 'desc', '_embed' => 'wp:featuredmedia'];
    $recent = apod_posts(['search' => 'APOD', 'per_page' => 5] + $newest);
    if (!$recent['ok'] && $recent['code'] === 'RATE_LIMITED') {
        return $recent; // as in apod_find_post
    }
    $post = $recent['ok'] ? apod_pick($recent['posts'], null, $today) : null;
    if ($post === null) {
        $since = (new DateTimeImmutable($today))->modify('-3 days')->format('Y-m-d') . 'T00:00:00';
        $window = apod_posts(['after' => $since, 'per_page' => 100] + $newest);
        $post = $window['ok'] ? apod_pick($window['posts'], null, $today) : null;
        if ($post === null && !$recent['ok'] && !$window['ok']) {
            return $recent;
        }
    }

    return ['ok' => true, 'post' => $post];
}

function apod_fetch_date(string $date, string $today): array
{
    $found = apod_find_post($date, $today);
    if (!$found['ok']) {
        return $found;
    }
    $payload = $found['post'] !== null ? apod_post_payload($found['post'], $date) : null;
    if ($payload !== null) {
        return bridge_ok($payload);
    }

    // No picture that day (gaps in the 1995 archive): asked again after 6 h, or 15 min for the last few days.
    $recent = $date >= (new DateTimeImmutable($today))->modify('-3 days')->format('Y-m-d');
    return bridge_fail('NOT_FOUND', 404, $recent ? 900 : BRIDGE_MAX_BACKOFF);
}

function apod_fetch_latest(string $today): array
{
    $found = apod_find_latest($today);
    $payload = $found['ok'] && $found['post'] !== null ? apod_post_payload($found['post']) : null;
    if ($payload !== null) {
        // Until today's picture is published (just after midnight in New York), asked again every 10 min.
        return bridge_ok($payload, $payload['date'] === $today ? null : 600);
    }

    return $found['ok'] ? bridge_fail() : $found;
}

function apod_join_translation($json): string
{
    $text = '';
    foreach (is_array($json[0] ?? null) ? $json[0] : [] as $segment) {
        if (is_array($segment) && is_string($segment[0] ?? null)) {
            $text .= $segment[0];
        }
    }

    return trim($text);
}

/** Portuguese title + explanation, translated once per date and cached; null when the translator fails. */
function apod_translation(array $apod): ?array
{
    $key = APOD_CACHE_PREFIX . $apod['date'] . '-pt';
    $source = hash('sha256', $apod['title'] . "\n" . $apod['explanation']);
    $entry = bridge_cache_get($key) ?? [];
    $cached = $entry['payload'] ?? null;
    if (is_array($cached) && ($cached['source'] ?? '') === $source) {
        return $cached;
    }
    if ((int) ($entry['failedAt'] ?? 0) > time() - 600) {
        return null;
    }

    $requests = [];
    foreach (['title', 'explanation'] as $field) {
        if ($apod[$field] !== '') {
            $requests[$field] = [
                'url' => APOD_TRANSLATE_ENDPOINT,
                'timeout' => 4,
                'headers' => ['Content-Type: application/x-www-form-urlencoded;charset=UTF-8'],
                'body' => http_build_query(['q' => $apod[$field]]),
            ];
        }
    }

    $translated = ['title' => '', 'explanation' => '', 'source' => $source];
    foreach (bridge_http_all($requests) as $field => $response) {
        $text = $response['status'] === 200 ? apod_join_translation($response['json']) : '';
        if ($text === '') {
            bridge_cache_put($key, ['failedAt' => time()]);
            return null;
        }
        $translated[$field] = apod_text($text);
    }
    bridge_cache_put($key, ['storedAt' => time(), 'payload' => $translated]);

    return $translated;
}

$now = new DateTimeImmutable('now', new DateTimeZone('America/New_York'));
$today = $now->format('Y-m-d');
$lang = $_GET['lang'] ?? 'en';
$requested = $_GET['date'] ?? '';
if (!is_string($lang) || !in_array($lang, ['pt', 'en'], true)
    || !is_string($requested) || ($requested !== '' && !apod_valid_date($requested, $today))) {
    bridge_error('INVALID_PARAM', 400);
    return;
}

// Today in New York is the latest picture: until NASA publishes it (just after midnight there), yesterday's.
$latest = $requested === '' || $requested === $today;
$result = $latest
    ? bridge_resolve(
        APOD_CACHE_PREFIX . 'latest',
        APOD_LATEST_POLICY,
        static fn (): array => apod_fetch_latest($today)
    )
    : bridge_resolve(
        APOD_CACHE_PREFIX . $requested,
        APOD_PAST_POLICY,
        static fn (): array => apod_fetch_date($requested, $today)
    );
if (!$result['ok']) {
    bridge_error($result['code'], $result['status'], $result['retryAfter']);
    return;
}

$apod = $result['payload'];
$translated = false;
if ($lang === 'pt') {
    $portuguese = apod_translation($apod);
    if ($portuguese !== null) {
        $apod['title'] = $portuguese['title'] !== '' ? $portuguese['title'] : $apod['title'];
        $apod['explanation'] = $portuguese['explanation'] !== '' ? $portuguese['explanation'] : $apod['explanation'];
        $translated = true;
    }
}

// Past days are immutable; the latest picture changes after midnight in New York; an untranslated answer is
// retried soon.
$untilMidnight = $now->setTime(0, 0)->modify('+1 day')->getTimestamp() - $now->getTimestamp();
if ($result['stale']) {
    $maxAge = 60;
} elseif (!$latest) {
    $maxAge = 86400;
} elseif ($apod['date'] === $today) {
    $maxAge = max(60, min(1800, $untilMidnight));
} else {
    $maxAge = 300; // today's picture is not published yet
}
if ($lang === 'pt' && !$translated) {
    $maxAge = min($maxAge, 300);
}

$result['payload'] = $apod;
// Never longer than the bridge's own max-age: 60 s for a copy answered while it is being refreshed.
$result['maxAge'] = min($maxAge, $result['maxAge']);
bridge_respond($result, ['lang' => $lang, 'translated' => $translated]);
bridge_after($result);
