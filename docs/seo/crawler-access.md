# MarketDeck crawler and AI-search access policy

Version: 2026-09-25.2  
Owner: MarketDeck SEO / release engineering  
Scope: `https://marketdeck.in`

This is the versioned SG-01 crawler-access baseline. It separates search/retrieval access from model-training access, records provider verification methods, and deliberately leaves live edge/WAF results pending until the production VPS gate is run.

It does **not** grant access to private application data, override page-level `noindex`, authorize crawler-specific content, or change the separate training-use decision.

## Production baseline before SG-01 release

The accepted production `robots.txt` is still:

```text
User-agent: *
Allow: /

Sitemap: https://marketdeck.in/sitemap.xml
```

Therefore automatic crawlers that honor the wildcard are currently allowed. The explicit crawler groups on this branch are a proposed, testable expression of search/retrieval intent; they are not deployed yet.

## Policy decision already safe to make

MarketDeck wants legitimate public search/retrieval systems to be able to discover, fetch, cite and send users to public acquisition pages.

**Desired policy: ALLOW search/retrieval.**

Training is a separate owner decision. SG-01 does not silently opt out or opt in beyond preserving the existing wildcard posture.

## Crawler-access matrix

| Crawler | Provider | Purpose | Search / retrieval | Training | robots token | Verification | Current production robots | Live HTTP | Desired policy | Required change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Googlebot | Google | Search indexing | Yes | No; Google has separate Google-Extended control | `Googlebot` | Reverse+forward DNS or published common-crawler ranges | Wildcard allow | Pending VPS gate | Allow | Verify edge/WAF; explicit branch group documents intent |
| bingbot | Microsoft | Search indexing | Yes | Not documented as a Bingbot purpose | `bingbot` | Reverse DNS to `search.msn.com` + forward-confirmation; Microsoft verification methods | Wildcard allow | Pending VPS gate | Allow | Verify edge/WAF; explicit branch group documents intent |
| OAI-SearchBot | OpenAI | ChatGPT Search | Yes | No | `OAI-SearchBot` | OpenAI published SearchBot ranges | Wildcard allow | Pending VPS gate | Allow | Verify edge/WAF against current ranges; explicit branch group |
| GPTBot | OpenAI | Model development/training | No | Yes | `GPTBot` | OpenAI published GPTBot ranges | Wildcard allow; no dedicated rule | Pending VPS gate | **Owner decision pending** | Do not couple to Search rollout |
| ChatGPT-User | OpenAI | User-initiated retrieval | Yes | No | `ChatGPT-User` | OpenAI published ChatGPT-User ranges | Wildcard allow; provider says robots may not apply to user actions | Pending VPS gate | Allow | Verify no WAF/challenge block; explicit branch group documents intent |
| Claude-SearchBot | Anthropic | Search quality/indexing | Yes | No | `Claude-SearchBot` | Anthropic official crawler IP list + claimed UA | Wildcard allow | Pending VPS gate | Allow | Verify edge/WAF; explicit branch group |
| ClaudeBot | Anthropic | Model development/training | No | Yes | `ClaudeBot` | Anthropic official crawler IP list + claimed UA | Wildcard allow; no dedicated rule | Pending VPS gate | **Owner decision pending** | Do not couple to Search rollout |
| Claude-User | Anthropic | User-initiated retrieval | Yes | No | `Claude-User` | Anthropic official crawler IP list + claimed UA | Wildcard allow | Pending VPS gate | Allow | Verify no WAF/challenge block; explicit branch group |
| PerplexityBot | Perplexity | Search indexing | Yes | No | `PerplexityBot` | Current PerplexityBot IP ranges + claimed UA | Wildcard allow | Pending VPS gate | Allow | Verify edge/WAF using current ranges + UA; explicit branch group |
| Perplexity-User | Perplexity | User-initiated retrieval | Yes | No | `Perplexity-User` | Current Perplexity-User IP ranges + claimed UA | Wildcard allow; provider says user fetches generally ignore robots | Pending VPS gate | Allow | Verify no WAF/challenge block; explicit branch group |

The complete machine-readable row set, evidence URLs, current-policy field, required-change field and verification endpoints are in `docs/seo/crawler-access.json`.

## Important additional control: Google-Extended

`Google-Extended` is **not** a separate HTTP crawler user agent. Google documents it as a robots product token controlling whether Google-crawled content may be used for future Gemini model training and for grounding in Gemini Apps / Vertex AI. Google states that this control does not affect inclusion or ranking in Google Search.

MarketDeck currently has no dedicated `Google-Extended` rule. That decision belongs with GPTBot/ClaudeBot in the separate owner training/grounding decision, not with the Search-access rollout.

## Provider evidence verified 2026-09-25

### Google

- Googlebot is a common crawler used for Google Search and automatic common crawlers obey robots.txt.
- Google warns that User-Agent strings are spoofable and documents source verification using reverse DNS / published crawler ranges.
- Google-Extended is a separate robots product control and does not affect Search inclusion or ranking.

Official sources:
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot

### Microsoft / Bing

- Bingbot is Bing's standard crawler.
- Microsoft explicitly warns that User-Agent strings can be spoofed.
- Authenticity can be checked with reverse DNS ending in `search.msn.com`, followed by a forward lookup resolving back to the same source IP; Microsoft also exposes Bingbot verification mechanisms.

Official sources:
- https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0
- https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26

### OpenAI

OpenAI documents independent controls:

- `OAI-SearchBot` — automatic Search crawler used to surface websites in ChatGPT Search.
- `GPTBot` — crawler for content that may be used in foundation-model training.
- `ChatGPT-User` — user-initiated fetcher; not the Search inclusion control and robots.txt may not apply to those user actions.

Published IP sources:
- https://openai.com/searchbot.json
- https://openai.com/gptbot.json
- https://openai.com/chatgpt-user.json

Official source:
- https://developers.openai.com/api/docs/bots

### Anthropic

Anthropic documents three separate robots:

- `Claude-SearchBot` — search/indexing quality.
- `Claude-User` — user-directed retrieval.
- `ClaudeBot` — public-web collection that could contribute to model training.

Anthropic says its bots honor robots.txt and links an official source-IP list for validating crawler origin.

Published IP source:
- https://claude.com/crawling/bots.json

Official source:
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

### Perplexity

Perplexity documents:

- `PerplexityBot` — used to surface and link websites in Search, not to crawl content for AI foundation models.
- `Perplexity-User` — user-requested retrieval, not automatic crawling or foundation-model training; these fetches generally ignore robots.txt.
- For WAFs, Perplexity recommends combining User-Agent matching with its current published IP ranges rather than trusting UA alone.

Published IP sources:
- https://www.perplexity.com/perplexitybot.json
- https://www.perplexity.com/perplexity-user.json

Official source:
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers

## Bot identity and WAF policy

A matching User-Agent is evidence of **claimed** identity, not proof of origin.

For operational logging and any future WAF allow rule:

1. record source IP, full User-Agent, URL, status, bytes and latency;
2. classify the claimed agent;
3. verify source using the provider's current official method/ranges;
4. store both `claimed_agent` and `verified_agent`;
5. never bypass authentication or private-route controls merely because a request claims to be a crawler;
6. periodically refresh provider IP sources because they can change.

## Public access invariants

Crawler-policy changes must preserve all of the following:

- `/robots.txt` returns 200 and contains the canonical sitemap directive.
- `/sitemap.xml` remains the authoritative central-publisher root.
- Approved acquisition pages remain anonymously fetchable without a login, cookie challenge or JavaScript-only navigation.
- Private/account/operational state remains protected by application authorization and page-level index controls.
- Crawler-specific content variants are prohibited.
- Verified approved Search/retrieval agents must not receive a WAF challenge/403 while ordinary public users receive 200.
- Training-crawler policy changes only after an explicit owner decision.

## Remaining SG-01A gate

The earlier production verification observed a material discrepancy:

- `curl` could fetch the public sitemap with HTTP 200;
- Python `urllib.request.urlopen()` received HTTP 403.

That is enough evidence to require an edge/client-discrimination test before deploying the proposed robots change.

The next gate must measure representative public URLs using ordinary curl, a Python-like client, and the official crawler UA families; record HTTP status, redirects, bytes, latency, server/CDN headers, challenge signals and cookie dependency. UA-only probing does **not** prove actual verified-bot behavior.

After that result is recorded, SG-01A can classify whether the problem is User-Agent discrimination, client/TLS fingerprinting, rate/security policy, or something else, and only then should any WAF/Caddy change be designed.
