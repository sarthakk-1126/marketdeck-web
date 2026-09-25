# MarketDeck crawler and AI-search access policy

Version: 2026-09-25.16  
Owner: MarketDeck SEO / release engineering  
Scope: `https://marketdeck.in`

This is the versioned SG-01 crawler-access baseline. It separates search/retrieval access from model-training access, records provider verification methods, and now includes the first production Cloudflare edge/UA probe.

It does **not** grant access to private application data, override page-level `noindex`, authorize crawler-specific content, or change the separate training-use decision.

## Production baseline before SG-01 release

The accepted production `robots.txt` is still:

```text
User-agent: *
Allow: /

Sitemap: https://marketdeck.in/sitemap.xml
```

Therefore automatic crawlers that honor the wildcard are currently allowed. The production edge probe confirms the tested Google, Bing, OpenAI, Anthropic and Perplexity crawler UA families are also served successfully. Explicit per-search-bot robots groups are unnecessary, so the SG-01 branch now preserves this simple production wildcard policy.

## Policy decision already safe to make

MarketDeck wants legitimate public search/retrieval systems to be able to discover, fetch, cite and send users to public acquisition pages.

**Desired policy: ALLOW search/retrieval.**

Training is a separate owner decision. SG-01 does not silently opt out or opt in beyond preserving the existing wildcard posture.

## Crawler-access matrix

| Crawler | Provider | Purpose | Search / retrieval | Training | robots token | Verification | Current production robots | Live HTTP | Desired policy | Required change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Googlebot | Google | Search indexing | Yes | No; Google has separate Google-Extended control | `Googlebot` | Reverse+forward DNS or published common-crawler ranges | Wildcard allow | PASS: 200 on 3-path live UA probe | Allow | No robots change; preserve wildcard allow; add verified-bot logging separately |
| bingbot | Microsoft | Search indexing | Yes | Not documented as a Bingbot purpose | `bingbot` | Reverse DNS to `search.msn.com` + forward-confirmation; Microsoft verification methods | Wildcard allow | PASS: 200 on 3-path live UA probe | Allow | No robots change; preserve wildcard allow; add verified-bot logging separately |
| OAI-SearchBot | OpenAI | ChatGPT Search | Yes | No | `OAI-SearchBot` | OpenAI published SearchBot ranges | Wildcard allow | PASS: 200 on 3-path live UA probe | Allow | No robots change; preserve wildcard allow; add verified-bot logging separately |
| GPTBot | OpenAI | Model development/training | No | Yes | `GPTBot` | OpenAI published GPTBot ranges | Wildcard allow; no dedicated rule | PASS: 200 on 3-path live UA probe | **Owner decision pending** | Do not couple to Search rollout |
| ChatGPT-User | OpenAI | User-initiated retrieval | Yes | No | `ChatGPT-User` | OpenAI published ChatGPT-User ranges | Wildcard allow; provider says robots may not apply to user actions | PASS: 200 on 3-path live UA probe | Allow | No robots change; live UA probe passed; verified-bot logging remains |
| Claude-SearchBot | Anthropic | Search quality/indexing | Yes | No | `Claude-SearchBot` | Anthropic official crawler IP list + claimed UA | Wildcard allow | PASS: 200 on 3-path live UA probe | Allow | No robots change; live UA probe passed; verified-bot logging remains |
| ClaudeBot | Anthropic | Model development/training | No | Yes | `ClaudeBot` | Anthropic official crawler IP list + claimed UA | Wildcard allow; no dedicated rule | PASS: 200 on 3-path live UA probe | **Owner decision pending** | Do not couple to Search rollout |
| Claude-User | Anthropic | User-initiated retrieval | Yes | No | `Claude-User` | Anthropic official crawler IP list + claimed UA | Wildcard allow | PASS: 200 on 3-path live UA probe | Allow | No robots change; live UA probe passed; verified-bot logging remains |
| PerplexityBot | Perplexity | Search indexing | Yes | No | `PerplexityBot` | Current PerplexityBot IP ranges + claimed UA | Wildcard allow | PASS: 200 on 3-path live UA probe | Allow | No robots change; live UA probe passed; verified-bot logging remains |
| Perplexity-User | Perplexity | User-initiated retrieval | Yes | No | `Perplexity-User` | Current Perplexity-User IP ranges + claimed UA | Wildcard allow; provider says user fetches generally ignore robots | PASS: 200 on 3-path live UA probe | Allow | No robots change; live UA probe passed; verified-bot logging remains |

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

## SG-01A live edge result — PASS with a non-search-client caveat

Read-only production probe: 2026-09-25T05:50:52Z.

Tested paths:

- `/robots.txt`
- `/sitemap.xml`
- `/screener/companies/`

Results:

- ordinary curl -> HTTP 200 on all three paths;
- curl with `Python-urllib/3.10` UA -> HTTP 403 on all three paths;
- actual Python urllib default -> HTTP 403 on all three paths;
- actual Python urllib using `curl/7.81.0` UA -> HTTP 200 on all three paths;
- Googlebot, bingbot, OAI-SearchBot, GPTBot, ChatGPT-User, Claude-SearchBot, ClaudeBot, Claude-User, PerplexityBot and Perplexity-User UA probes -> HTTP 200 on all three paths;
- no tested crawler UA needed redirects, cookies, or a visible challenge page;
- response server header was Cloudflare.

### Root-cause classification

The earlier Python verifier 403 is **User-Agent based at the Cloudflare edge**. It is not caused by Python urllib's TLS/client fingerprint, because the same urllib client succeeds when it sends the curl User-Agent.

This does **not** currently block the tested official search/retrieval crawler UA families.

UA spoofing remains possible, so this is an accessibility test, not verified-bot authentication. SG-01E remains responsible for verified-bot logging using provider-published verification methods/ranges.

### Robots decision after the probe

Do **not** deploy redundant explicit allow groups for search crawlers.

The accepted production wildcard already grants access and the live edge probe confirms it works. Keeping the simple wildcard:

- avoids unnecessary crawler-specific maintenance;
- avoids implying UA strings establish identity;
- preserves the existing training-crawler posture until the owner makes that separate decision;
- leaves room to add narrowly scoped training-agent rules later if the owner chooses.

The Python-urllib UA block should be documented as a Cloudflare generic-client policy observation, not treated as a search-indexing defect.


## SG-01G cross-product crawler-access sample — PASS

Read-only production sample: `2026-09-25T05:55:54Z`.

Method:

- discovered the 10 live child sitemaps from the authoritative root;
- selected one representative URL from each child sitemap;
- tested each representative URL with Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot and PerplexityBot UA claims.

Result:

- 10 sitemap families tested;
- 5 search/retrieval crawler UAs per family;
- 50 total live requests;
- 50 HTTP 200;
- 0 non-200 responses;
- 0 redirects required;
- 0 cookie requirements observed;
- 0 visible challenge markers observed.

Families covered:

- web;
- intelligence;
- StockProof catalog;
- StockProof companies;
- StockProof funds;
- charting;
- F&O;
- commentary;
- crypto pages;
- crypto coins.

Conclusion: the sampled public acquisition surface is not being unintentionally blocked by the current Cloudflare/WAF/session behavior for the tested major search/retrieval crawler UA families.

This closes SG-01G's cross-product accessibility gate without a 12,866-page crawler sweep. UA-only requests still do not prove crawler authenticity; SG-01E remains responsible for verified-bot logging.


## SG-01E/F Caddy observability preflight

Read-only production preflight: `2026-09-25T05:59:48Z`.

Observed:

- live Caddy container: `factory-caddy-1`;
- Docker log driver: `json-file`;
- no Caddy HTTP access-log directive was found;
- no access-log file was found under `/opt/factory`;
- no `trusted_proxies` directive was found;
- no `client_ip_headers` directive was found;
- current Docker/Caddy output contains runtime/admin messages, not request-access records;
- standard Caddy modules include `http.handlers.log_append` and `http.matchers.client_ip`.

Conclusion:

SG-01E and SG-01F need one scoped Caddy observability change. Caddy's native structured access logs are sufficient for response status, bytes, latency, User-Agent and real-client-IP fields, so no application-level logging change is needed.

Because MarketDeck is proxied by Cloudflare, verified-bot attribution must not blindly trust a client-supplied forwarding header. The implementation must establish Cloudflare as a trusted proxy source and only then derive the real visitor/client IP from the Cloudflare-provided header. The next preflight must inspect the exact Caddy version/config structure and existing origin network restrictions before a production patch is designed.


## SG-01E/F implementation design

Use Caddy native JSON access logging on `marketdeck.in` only.

Initial release deliberately does **not** enable global `trusted_proxies`. Instead, the access log will retain Caddy's direct peer IP and append Cloudflare's `CF-Connecting-IP` and `CF-Ray` values as separate fields. Offline bot verification may trust the appended visitor IP only when the direct peer IP belongs to the current official Cloudflare proxy ranges.

This avoids changing reverse-proxy/request semantics across the other product hosts while still giving SG-01E the evidence needed to authenticate crawler origin.

Bounded storage:

- path: `/data/marketdeck-access.json`;
- mode: `0600`;
- roll at `20MiB`;
- keep 5 rolled files;
- keep for at most 14 days (`336h`);
- Caddy's file logger compresses rolled files by default.

The nominal uncompressed upper bound is about 120MiB (active file plus five full-size rolled files), materially below the available disk headroom observed in preflight.

Caddy native access records provide request metadata, status, response bytes and duration. Two additional request-context fields are appended:

- `cf_connecting_ip`;
- `cf_ray`.

No request or response bodies are logged.


## SG-01E/F observability candidate validation — PASS

Isolated validation: `2026-09-25T06:08:48Z`.

Evidence:

- live Caddyfile SHA before and after validation:
  `016a69aa482a0bbf7cb45c1e965a3c29fdbe75a46b435dd693601ab818687e28`;
- candidate:
  `/opt/factory/Caddyfile.sg01-observability`;
- candidate SHA:
  `94aa1cc20679e8a9455b6843564bec9eac5413fc285115d6837783b949a2241b`;
- Caddy version: `v2.11.4`;
- isolated `caddy validate`: `Valid configuration`;
- validation filesystem created `marketdeck-access.json` with mode `0600`;
- no live config change;
- no production restart;
- no production logging enabled during validation.

The formatting warning is non-blocking and predates/does not invalidate the candidate syntax. The known Cloudflare Origin Certificate OCSP warnings are likewise unrelated to the logging change.

This clears the candidate-validation gate for a controlled Caddy-only production activation with rollback.


## SG-01E/F access-log data minimization

Before production activation, narrow the access-log payload to the minimum needed for crawler verification and response monitoring.

Retain:

- request timestamp;
- direct peer IP;
- Caddy client IP field;
- method, host and URI;
- protocol/TLS metadata;
- status;
- response bytes;
- duration;
- explicit `user_agent`;
- explicit `cf_connecting_ip`;
- explicit `cf_ray`.

Delete the general `request.headers` and `resp_headers` maps from the encoded record. Do not log request or response bodies.

This preserves SG-01E/F evidence while avoiding collection of unrelated request metadata.


## Final privacy-minimized observability candidate — PASS

Final isolated validation: `2026-09-25T06:10:53Z`.

- live Caddyfile SHA remained:
  `016a69aa482a0bbf7cb45c1e965a3c29fdbe75a46b435dd693601ab818687e28`;
- final candidate SHA:
  `c90de729b4e5025d4a4677ecf07181d7526849e1684b0c74c01253344d058540`;
- Caddy `v2.11.4`;
- validation result: `Valid configuration`;
- logger target created with mode `0600`;
- general `request.headers` and `resp_headers` are filtered out;
- explicit identity fields retained: `user_agent`, `cf_connecting_ip`, `cf_ray`;
- no production mutation or restart occurred.

This supersedes the earlier non-minimized candidate SHA. The final candidate is accepted for a controlled production Caddy reload with automatic rollback if reload, health, or log-shape verification fails.


## SG-01E/F production observability activation — PASS

Activated: `2026-09-25T06:16:33Z`.

Production evidence:

- live Caddyfile SHA:
  `c90de729b4e5025d4a4677ecf07181d7526849e1684b0c74c01253344d058540`;
- rollback backup:
  `/opt/factory/Caddyfile.pre-sg01-observability-20260925T061633Z`;
- rollback backup SHA:
  `016a69aa482a0bbf7cb45c1e965a3c29fdbe75a46b435dd693601ab818687e28`;
- graceful Caddy reload passed;
- no Caddy container restart;
- no other container restart;
- platform root, sitemap, Screener, Charts, F&O, Commentary and Crypto all returned HTTP 200;
- authoritative sitemap SHA remained:
  `4eb37dcc0d98d8b3605bc02bb8384aa2b26ee3085b427e025f4b5c2748ae250a`;
- production access log exists with mode `0600`;
- unique probe record returned HTTP 200 and exposed numeric response size and duration;
- direct peer IP, Caddy client IP, CF-Connecting-IP and CF-Ray fields are present;
- general request and response header maps are absent.

Initial unique probe observation:

- response size: 114,757 bytes;
- duration: 3.869836602 seconds.

The observability evidence layer is therefore accepted live. SG-01E still requires verified crawler classification logic; SG-01F still requires monitoring/reporting policy on top of the now-available size/duration stream.


## SG-01E/F crawler log auditor implemented

Versioned source:

- `scripts/seo/audit_crawler_access_log.py`
- `tests/seo_crawler_log_audit_test.py`

The tool is standard-library-only and consumes the privacy-minimized Caddy JSON stream.

Verification rules:

- first verify the direct Caddy peer against Cloudflare's current official IPv4/IPv6 ranges;
- only then consider `CF-Connecting-IP` as the external source address;
- Googlebot: current Google common-crawler CIDRs;
- bingbot: reverse DNS ending in `search.msn.com` plus forward-confirmation;
- OpenAI: the matching agent's official published JSON ranges;
- Anthropic: official crawler JSON ranges;
- Perplexity: the matching agent's official published JSON ranges.

It reports claimed, verified, source-error and unverified/spoofed crawler observations without emitting raw IP addresses.

SG-01F defaults:

- response-size warning: 10 MiB;
- response-size critical: 14 MiB;
- slow-response warning: 8 seconds;
- p50/p95/p99 size and duration;
- largest and slowest public URIs.

The 10/14 MiB values are operating headroom below Google's documented default 15 MB crawler/fetcher file-size boundary. Caddy's logged response size is treated as an operational transfer-size signal rather than asserted to be identical to every engine's fetch accounting.

Status: implemented in GitHub; production execution and source-fetch verification still pending.


## SG-01E/F verifier + response monitor acceptance — PASS

Acceptance run: `2026-09-25T15:17:25Z`.

Integrity and tests:

- immutable tool revision:
  `5289f9b5b1536d4e949b1c63db39f671576631a9`;
- Git blob integrity checks: PASS;
- Python syntax: PASS;
- 5/5 unit tests: PASS;
- live access log mode: `0600`;
- official Cloudflare range source: PASS.

Controlled spoof test:

Eight deliberate crawler-UA claims were sent from a non-provider source. All eight public requests returned HTTP 200, but the verifier correctly refused to authenticate every one as the claimed crawler.

Real verified traffic observed in the same one-hour window:

- Googlebot: 34 verified requests;
- ChatGPT-User: 3 verified requests;
- ClaudeBot: 1,949 verified requests.

The one observed claim each for bingbot, OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User was the controlled spoof probe and remained unverified as intended.

Response-monitoring baseline over 2,054 records:

- size p50: 37,932 bytes;
- size p95: 79,048.85 bytes;
- size p99: 148,162.14 bytes;
- duration p50: 0.0307994995s;
- duration p95: 0.6920941697s;
- duration p99: 1.98670093067s;
- largest observed response: 620,113 bytes at `/screener/company/IDEA.NS/`;
- 0 responses crossed the 10 MiB warning threshold;
- 0 responses crossed the 14 MiB critical threshold;
- 0 responses crossed the 8s slow-response threshold.

Private machine-readable evidence:
`/opt/factory/seo-state/sg01-crawler-audit-20260925T151725Z.json` (mode `0600`).

SG-01E and SG-01F are accepted complete operationally.


## SG-01C explicit business policy — DECIDED

MarketDeck's crawler business policy is now explicit:

**Allow search/retrieval:**
- Googlebot;
- bingbot;
- OAI-SearchBot;
- ChatGPT-User;
- Claude-SearchBot;
- Claude-User;
- PerplexityBot;
- Perplexity-User.

**Disallow pure model-training crawlers:**
- GPTBot;
- ClaudeBot.

**Allow Google-Extended:**
- keep Gemini Apps / Vertex AI model-use and grounding eligibility enabled.

Rationale:

1. OpenAI documents OAI-SearchBot and GPTBot as independent controls, so GPTBot can be blocked without opting MarketDeck out of ChatGPT Search.
2. Anthropic documents Claude-SearchBot and Claude-User independently from ClaudeBot, so ClaudeBot can be blocked without blocking Claude search/retrieval.
3. The one-hour SG-01E acceptance window authenticated 1,949 ClaudeBot requests. That is substantial pure training crawl activity and is not itself evidence of Claude Search visibility.
4. Google-Extended remains allowed because Google documents it as a control for Gemini model use and grounding in Gemini Apps / Vertex AI, while explicitly stating it does not affect Google Search inclusion or ranking.

The branch robots policy now expresses those decisions directly. Production remains unchanged until the robots release gate is validated and promoted.

## SG-01D Search Console property check — BLOCKED ON PROPERTY SETUP

Opera was used to inspect the signed-in Google Search Console session. The account is authenticated, but Search Console currently shows the welcome screen with **Add a website**; no MarketDeck website property is configured.

Therefore the actual MarketDeck Search generative AI property control cannot yet be verified.

Google's current Search Console control (rolled out worldwide by 2026-08-31) covers AI Overviews, AI Mode and generative-AI features in Discover. The desired MarketDeck state is:

`Include my site's links and content in Search generative AI features`.

Google documents that inclusion is the default for properties, but SG-01D will remain open until a verified `marketdeck.in` Search Console property exists and its effective control is observed.


## SG-01C production robots activation — PASS

Activated: `2026-09-25T15:46:24Z`.

Live policy SHA:
`399f561b3680f78045629b4e8be1b119b1321710f13e9373502ae00d679698d2`.

Rollback:
`/opt/factory/marketdeck-web/public/robots.txt.pre-sg01c-20260925T154624Z`
with SHA
`1c33fdb41cd2e5d48dd62d027030d6d09e5a7dc85ef6e01805183ceff89ef9e0`.

Public policy now:

- GPTBot: Disallow `/`;
- ClaudeBot: Disallow `/`;
- Google-Extended: Allow `/`;
- wildcard: Allow `/`;
- authoritative sitemap directive preserved.

Search/retrieval non-regression:
Googlebot, bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User all returned HTTP 200 fetching the live robots file after release.

The authoritative sitemap SHA remained exactly
`4eb37dcc0d98d8b3605bc02bb8384aa2b26ee3085b427e025f4b5c2748ae250a`.

No container restart, application deployment or Git default-branch move occurred.

SG-01C is now both decided and live.


## SG-01D Google Search generative AI control — PASS

Verified on the live Google Search Console Domain property `marketdeck.in` on 2026-09-25.

Observed property state:

- Domain property ownership: verified;
- verification method: domain name provider / Cloudflare DNS;
- Search generative AI: **Include**;
- Crawl stats: no data available yet;
- Search Console robots report: "No robots.txt file" at initial property creation.

The robots report line is not treated as a production failure because MarketDeck's live `/robots.txt` was independently verified before and after the SG-01C release, including successful crawler access. Recheck the Search Console robots report after the newly-created property finishes processing.

SG-01D is complete.


## Google Search Console sitemap submission — PASS

The verified Domain property `marketdeck.in` now has the authoritative root sitemap submitted:

`https://marketdeck.in/sitemap.xml`

Observed on 2026-09-25:

- Search Console last read: 25/09/2026;
- status: **Sitemap index processed successfully**;
- discovered pages at the first successful read: 0;
- discovered videos: 0.

This supersedes the transient initial "Couldn't fetch" status shown immediately after submission.

The zero discovered-page count is recorded as the initial Search Console processing state only. It is not used to redefine the authoritative inventory and is not treated as evidence that zero MarketDeck pages exist. The authoritative approved canonical denominator remains 12,866.

SG-03A is accepted complete for property verification and sitemap configuration. SG-00C remains open until Google/Bing discovery/index-state baselines are populated.
