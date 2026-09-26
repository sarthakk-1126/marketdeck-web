# SG-03J — MarketDeck business-quality measurement contract

## Objective

Measure whether search and AI discovery produces useful MarketDeck product
engagement after the landing page. Traffic volume alone is not a success
metric.

The production GA4 tag is intentionally limited to approved public canonical
pages. Login, account, password-reset, private workspace, upload, and other
noncanonical states are outside this analytics scope.

## Headline metrics

### 1. Qualified landing traffic

Track, by landing page and acquisition source:

- sessions;
- active users;
- engagement rate;
- average session duration where available;
- page views;
- bounce rate where available.

For Google organic traffic, use the blended GSC + GA4 landing-page report so
Search Console clicks/impressions remain distinct from GA4 sessions and
engagement.

### 2. Research-tool usage

Report public canonical usage by MarketDeck product family:

| Product family | Public path |
| --- | --- |
| MarketDeck / Intelligence | `/`, `/intelligence/` |
| StockProof | `/screener/` |
| Charting | `/charts/` |
| F&O | `/futures-and-options/` |
| Commentary | `/commentary/` |
| Crypto World | `/crypto/` |

A product-family page/session is evidence of tool/research usage. Do not count
private/account routes as product engagement.

### 3. Repeat-use signal

Track total users and new users separately. A falling new-user share alongside
stable/rising active users can be a directional repeat-use signal, but
`totalUsers - newUsers` must not be labeled an exact returning-user count.

When a first-party returning-user dimension becomes available in the reporting
stack, prefer that direct measure.

### 4. Search-to-product quality

For Google organic landing pages, keep these layers separate:

1. GSC impressions;
2. GSC clicks;
3. GA4 sessions;
4. engagement/bounce;
5. approved key events.

Do not treat Search Console clicks and GA4 sessions as interchangeable because
measurement, consent, browser blocking, and attribution differ.

### 5. AI-referral quality

Track identifiable AI-assistant referrals separately by:

- assistant/source;
- sessions;
- engagement rate;
- landing page;
- approved key events.

The current GSC Wizard AI-referral report covers identifiable assistants such
as ChatGPT, Perplexity, Microsoft Copilot, Google Gemini, and Claude.

Google AI Overviews / AI Mode carry no distinct external referrer and must not
be mixed into this referral metric. Their search-performance measurement
belongs to SG-03B.

## Conversion / key-event policy

MarketDeck currently has no approved business conversion event.

GA4 presently exposes the default `purchase` key event, but MarketDeck has no
purchase flow. Therefore:

- `purchase` is **not** a MarketDeck conversion KPI;
- do not report a zero purchase count as product underperformance;
- a key event is promoted to a business KPI only after the underlying user
  action exists and is explicitly approved.

Potential future key events should represent real product outcomes, for
example an explicitly designed newsletter signup or another deliberate,
non-sensitive product action. Never convert arbitrary clicks into vanity
"conversions".

## Privacy and URL hygiene

- GA4 loads only on approved public canonical pages.
- `page_location` is the canonical MarketDeck URL, not the raw request URL.
- Google Signals is disabled.
- Ad-personalization signals are disabled.
- Do not send search terms, uploaded data, account identifiers, emails,
  transcript inputs, portfolio contents, or form values as analytics event
  parameters.
- Do not instrument private/account pages solely to improve reporting.

## Baseline state — 2026-09-26

Immediately after GA4 installation:

- GA4 property: MarketDeck (`properties/556037573`);
- property currency: INR;
- timezone: Asia/Calcutta;
- sessions: 0;
- active users: 0;
- engagement rate: 0;
- approved MarketDeck key events: none;
- identifiable AI-assistant sessions: 0.

This is a zero-data initialization baseline, not a performance conclusion.
GA4 processing latency means useful trend reporting begins only after traffic
has accumulated.

## Reporting cadence

Use 28 settled days as the normal dashboard window, with a same-length prior
period when enough history exists. For a newly launched measurement property,
keep the first installation date visible so pre-installation zeros are not
misread as traffic loss.

The program headline is qualified product usage, not raw page views.
