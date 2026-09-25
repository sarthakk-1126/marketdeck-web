# MarketDeck SG-02 discovery notifications

Version: 2026-09-25
Owner: MarketDeck SEO platform
Status: implemented on branch; production acceptance pending

## Objective

Notify participating search engines about genuine public canonical changes without using URL submission as a substitute for the sitemap, crawlability, or indexing quality.

The central publisher remains the only authority for which public MarketDeck canonicals are approved. The notification layer consumes publisher change events; it does not invent URLs, crawl arbitrary links, or submit search/filter/private states.

## Official IndexNow constraints verified 2026-09-25

IndexNow accepts URLs that were added, updated, or deleted. The protocol supports up to 10,000 URLs per POST. Ownership is proven with a UTF-8 key file hosted on the same host. HTTP 200 means received; HTTP 202 means received with key validation pending. 429 and 5xx responses are retryable operational failures. Submission is a discovery notification and does not guarantee crawling or indexing.

Microsoft currently recommends IndexNow as the primary automated URL-notification path for Bing and participating engines, and advises new adopters to submit only URLs changed after adoption rather than historical URLs.

Sources:

- https://www.indexnow.org/documentation
- https://www.bing.com/indexnow/getstarted
- https://www.bing.com/webmasters/help/url-submission-62f2860b

## SG-02A — canonical change event stream

The publisher now derives an immutable private event for each activated release.

Path:

`<private>/change-events/<release_id>.json`

Event schema:

- schema version;
- release ID;
- previous release ID;
- generated timestamp;
- previous-public-state status;
- initial-baseline flag;
- created canonical URLs;
- substantively updated canonical URLs;
- withdrawn canonical URLs;
- per-type counts.

Created/withdrawn are derived from the actual currently active sitemap tree versus the proposed admitted set.

Substantive updates are emitted only when MarketDeck already has a source-owned timestamp that is approved for honest `lastmod` use. Today that is limited to the Intelligence families for which the publisher already accepts a truthful `content_updated_at`. Dynamic company/fund/tool pages are not falsely reported as updated merely because they were fetched, deployed, or observed again.

If the previous public sitemap cannot be read, notification state degrades to a baseline event rather than blocking sitemap publication.

The first activation on a site with no previous public state emits a zero-URL baseline. This prevents accidental historical backfill.

## SG-02B / SG-02E — IndexNow notifier

Source:

`scripts/seo/indexnow_notify.py`

Ownership key:

The production IndexNow key is **not stored in Git**. Generate a fresh cryptographically random key on the VPS during production activation, store the private source copy under `/opt/factory/seo-state/` with mode `0600`, and publish only the required UTF-8 verification file at an unlinked root-level URL.

The production key value and exact key-location URL must not be pasted into chat, GitHub issues, logs, or public documentation.

The notifier:

- reads only immutable publisher change events;
- refuses a non-empty initial baseline;
- validates every URL as HTTPS on `marketdeck.in`;
- de-duplicates created/updated/withdrawn URLs;
- batches at no more than 10,000 URLs per request;
- sends JSON to `https://api.indexnow.org/indexnow`;
- treats 200 and 202 as accepted;
- retries 429 and 5xx with bounded exponential backoff;
- treats other protocol errors as hard failures;
- records private per-event/per-chunk state;
- hashes each event and refuses mutation of an already-seen release;
- skips already accepted chunks on rerun.

Default private state path for production will be:

`/opt/factory/seo-state/indexnow-state.json`

Notification failure is separate from sitemap publication. The publisher writes the durable event; the notifier can retry later.

## Rollout order

1. Run unit tests from an isolated branch worktree.
2. Run a production-state clone acceptance: copy the live public sitemap tree and private accepted/current metadata into a temporary sandbox, activate the new publisher there, and require a zero-change event.
3. Generate a fresh production key on the VPS (never in chat/Git), publish the root-level verification file, and verify it without printing its value.
4. Install the immutable publisher/notifier revision outside default-branch movement.
5. Establish a live zero-change event baseline using the accepted current inventory; require the authoritative sitemap hash to remain unchanged.
6. Run the notifier in dry-run mode and confirm baseline produces zero submissions.
7. On the first genuine created/updated/withdrawn event, submit to IndexNow and verify receipt in Bing Webmaster Tools.
8. Keep sitemap submission/reporting separate.

## Explicit non-goals

- Do not use Google's Indexing API for ordinary MarketDeck finance/content URLs.
- Do not bulk-submit all 12,866 current canonicals merely because IndexNow was enabled.
- Do not submit internal search states, arbitrary filters, account routes, downloads, uploads, or private URLs.
- Do not treat HTTP 200 from IndexNow as an indexing guarantee.


## SG-02C — Intelligence Atom feed

MarketDeck will publish one Atom 1.0 feed for the genuine dated editorial stream:

`https://marketdeck.in/intelligence/feed.xml`

Scope:

- published Intelligence learning notes;
- published MarketDeck Brief issues;
- no drafts;
- no company/fund/coin/tool/entity pages;
- no synthetic publication timestamps.

The feed is generated from the same editorial registry used for the Intelligence library. Published and updated dates come from source-owned editorial metadata already used for visible dates / structured data.

HTML autodiscovery uses:

`<link rel="alternate" type="application/atom+xml" title="MarketDeck Intelligence" href="/intelligence/feed.xml">`

Google officially accepts Atom 1.0 feeds as sitemap inputs and notes that such feeds represent recent URLs rather than a full historical inventory. The existing authoritative XML sitemap remains the complete acquisition inventory.

## SG-02D — WebSub evaluation

Decision: **defer implementation until the Atom feed is production-live and has a demonstrated subscriber/discovery use case**.

Google documents that RSS/Atom publishers can use WebSub to broadcast changes to search engines including Google. W3C WebSub requires a publisher to advertise one or more hubs and a self/topic URL, then notify the hub when the topic changes.

MarketDeck already has IndexNow for participating search engines and a durable canonical-change event stream. Adding a third-party hub before the feed is live would create another external dependency without measured incremental value.

Re-evaluate WebSub after:
1. `/intelligence/feed.xml` is production-live;
2. feed updates occur naturally;
3. a maintained HTTPS hub is selected and its availability/privacy/security posture is reviewed;
4. incremental discovery benefit can be measured against sitemap + IndexNow.

## SG-02F — separate lifecycle lag ledger

Source:

`scripts/seo/search_lag_ledger.py`

Private state target:

`/opt/factory/seo-state/search-lag-ledger.json`

The ledger records first-observed timestamps independently for:

- published;
- notified;
- first verified crawl;
- search discovered;
- indexed;
- first impression;
- first AI citation.

It computes notification lag, crawl lag, discovery lag, index lag, ranking-signal lag and citation lag separately. No stage is inferred from another. Search Console/Bing observations remain external evidence and are recorded only when actually observed.

## SG-02G — Google Indexing API guard

Complete by policy and implementation review: MarketDeck does not use Google's Indexing API for ordinary finance/editorial/product URLs. Discovery uses the authoritative sitemap, Search Console, Bing/IndexNow, crawlable internal links, and the editorial Atom feed.
