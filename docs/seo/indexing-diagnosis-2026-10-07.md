# Search Console indexing diagnosis — 7 October 2026

Trigger: Search Console reports 1.43k indexed and 12.9k not indexed, plus new
"Duplicate, Google chose different canonical than user" notices.

Status: diagnosis plus one shipped crawl-hygiene fix (`public/robots.txt`). The
larger sitemap changes below are proposals that need owner approval. Nothing
here claims a change in Google indexing.

## Evidence gathered

| Check | Result |
| --- | --- |
| Live sitemap index | 10 child sitemaps, 12,931 unique URLs. Funds 8,946 (8,757 fund detail pages); companies 2,894; charts 506; crypto coins 293; catalog 224; Intelligence 29. Only Intelligence carries `<lastmod>`. |
| 245 sampled sitemap URLs (≈25 per child sitemap, fetched with a Googlebot UA) | All 200, all self-canonical, no `noindex`, no `X-Robots-Tag`. Preset pagination is correctly self-canonical after `&amp;` decoding. |
| Variant handling | http→https 308, `www`→apex 301, missing slash 301, `?range=` canonicalises to the clean URL, chart/coin query states are `noindex`, out-of-range pages and invented tickers 404. |
| Caddy access log, 3–7 Oct (Googlebot UA) | Roughly 35–85 Googlebot requests per day before this audit. About 35 distinct fund pages were fetched over the whole window. The 7 Oct spike is this audit's own traffic. |
| Googlebot redirects in that window | Nearly all were account/state routes: `/screener/register/?next=`, `/screener/accounts/login/?next=`, `/screener/prefs/currency-unit/…?next=`, `/screener/portfolio/*`, `/screener/watchlist/`. |
| Active fund schemes (`MutualFundScheme`, read-only) | 8,768: 4,132 Regular, 4,096 Direct, 540 unlabelled; options split across Growth, IDCW, monthly/quarterly IDCW and others. |

## What the Search Console rows mean here

* **Discovered – currently not indexed (11,844).** Google knows these URLs but
  has not fetched them. At about 50 fetches a day, a new domain with 12.9k
  URLs needs months, and Google lowers crawl demand when a large share of a
  sitemap looks like near-identical templates. This is a crawl-priority and
  quality-signal problem, not a technical block.
* **Page with redirect (560).** Consistent with the log: Googlebot follows
  register, login, preference and portfolio links, which all 302. These are
  not sitemap URLs, so this row is expected noise. They do, however, spend
  part of an already small crawl budget.
* **Duplicate without user-selected canonical (259) and Google chose a
  different canonical (3).** These are most likely fund plan/option siblings
  (Direct vs Regular, Growth vs IDCW of the same scheme). They share the
  portfolio, benchmark and copy, and their NAV histories differ only
  slightly. Check this against the Search Console export before acting.
* **Alternative page with proper canonical (104)** and **Excluded by noindex
  (110).** These are working as designed: `?range=` variants, chart and coin
  query states, and the clean screener tool.
* **5xx (2), 4xx (2), 404 (1).** Too few to be systemic. Fix them
  individually from the export.

## Shipped in this change

`public/robots.txt` now disallows Screener account, preference, export, note
and portfolio routes for `User-agent: *`. Checks:
* None of the 12,931 live sitemap URLs matches a new rule.
* `/screener/portfolio-analysis/` remains crawlable.
* `tests/robots.test.mjs` locks this in with Google's longest-match semantics.

Authentication remains the access control, and the noindex/redirect behaviour
is unchanged.

## Recommended next steps (need approval)

1. **Prioritise the fund sitemap (largest lever).** List one primary page per
   scheme family in the sitemap. Proposed primary: Direct + Growth, with a
   fallback when no Direct Growth exists. This cuts about 8.7k fund URLs to
   about 2k. Sibling pages stay live, indexable and self-canonical, and are
   linked from the primary page under "Other plans and options". Do not
   canonicalise siblings to the primary, because their NAVs differ. This
   follows the url-policy rule that a displayed name is not a deduplication
   key: grouping must come from AMFI scheme family data, not names.
2. **Hold back chart symbol pages (506).** They render about 880 words of
   identical template per symbol and overlap the company pages. Keep them
   live but out of the sitemap until each one carries symbol-specific text.
3. **Thin statement and crypto pages.** Many statement pages render 300–600
   words, and many low-cap coin pages about 500. Keep them out of the sitemap
   until they pass a minimum-content gate, the same way presets already do.
4. **Add truthful `<lastmod>`** to the company and fund sitemaps from the
   latest stored data date. Never use the build time.
5. **Internal links.** Link company overview pages to their peers, sector hub
   and statements, and fund pages to their category hub and siblings, so
   Google discovers pages through links as well as through deep directory
   pagination.
6. **Measure, then expand.** Resubmit the sitemap index and track the indexed
   count per child sitemap weekly in Search Console. Re-add held-back families
   once the primary set is mostly indexed.

Google decides what it indexes, so no change can guarantee that every URL
will be indexed. The aim is to stop spending crawl budget on duplicates and
utility URLs, so the distinctive pages get crawled first.
