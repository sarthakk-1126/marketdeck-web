# MarketDeck crawler and AI-search access policy

Version: 2026-09-25  
Owner: MarketDeck SEO / release engineering  
Scope: `https://marketdeck.in`

This document implements SG-01A through SG-01C's versioned crawler-policy baseline. It does not grant access to private application data, override page-level `noindex`, or authorize crawler-specific content.

## Policy

MarketDeck explicitly allows major search and answer-engine retrieval agents to access public acquisition pages. Search/retrieval access is intentionally separated from model-training access.

The production `robots.txt` therefore contains explicit allow groups for Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot and Perplexity-User.

GPTBot and ClaudeBot are model-training crawlers. SG-01 does **not** silently change the site's pre-existing training-access posture. They remain governed by the wildcard `Allow: /` rule until the site owner makes a separate explicit training-use decision. Changing training access must never be bundled into a search-visibility change.

## Provider semantics recorded from official documentation

- **Googlebot** — conventional Google Search crawler. Google documents robots.txt as crawl control and separately documents methods to verify Google crawler traffic.
- **Bingbot** — Bing search crawler. Microsoft explicitly warns that user-agent strings can be spoofed and recommends verification before trusting bot identity.
- **OAI-SearchBot** — OpenAI search crawler used to surface sites in ChatGPT search. OpenAI documents this independently from GPTBot.
- **ChatGPT-User** — OpenAI user-initiated fetcher. It is not an automatic web crawler and robots.txt semantics may differ for user-initiated actions.
- **GPTBot** — OpenAI crawler associated with potential foundation-model training use. Its policy is deliberately independent from OAI-SearchBot.
- **Claude-SearchBot** — Anthropic search crawler used to improve search result quality.
- **Claude-User** — Anthropic user-initiated retrieval agent.
- **ClaudeBot** — Anthropic model-development/training crawler; independent from Claude search/retrieval access.
- **PerplexityBot** — Perplexity search crawler, documented as separate from foundation-model training use.
- **Perplexity-User** — Perplexity user-initiated fetcher. Perplexity notes that user-triggered fetches generally ignore robots.txt.

The machine-readable source of truth is `docs/seo/crawler-access.json`.

## Bot identity

A matching User-Agent is evidence of claimed identity, not proof of origin.

For operational logging and any future WAF allowlist:

1. record User-Agent, source IP, URL, status, bytes and latency;
2. classify the claimed crawler;
3. verify source using the provider's published verification method or IP source;
4. store both `claimed_agent` and `verified_agent`;
5. never bypass authentication or private-route controls merely because a request claims to be a crawler.

OpenAI and Perplexity publish crawler IP sources. Anthropic publishes a crawler source-IP list for validation. Google and Microsoft publish crawler-verification guidance.

## Public access invariants

Crawler policy changes must preserve all of the following:

- `/robots.txt` returns 200 and contains the canonical sitemap directive.
- `/sitemap.xml` remains the authoritative central-publisher root.
- Approved acquisition pages remain reachable anonymously without cookies or JavaScript-only navigation.
- Private/account/operational state is protected by application authorization and page-level index controls.
- Crawler-specific content variants are prohibited.
- WAF or CDN rules must not return challenges/403s to verified approved search agents while ordinary public users receive 200.
- Training-crawler policy is changed only through an explicit owner decision.

## Official sources

- Google crawling infrastructure: https://developers.google.com/crawling
- Microsoft/Bing crawlers: https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0
- OpenAI crawlers: https://developers.openai.com/api/docs/bots
- Anthropic crawlers: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Perplexity crawlers: https://docs.perplexity.ai/docs/resources/perplexity-crawlers

Re-review these provider sources before changing agent names, verification rules, or the distinction between automatic crawl and user-initiated retrieval.
