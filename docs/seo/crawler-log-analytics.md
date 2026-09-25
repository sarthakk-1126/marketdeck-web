# SG-03F — verified crawler/server-log analytics

MarketDeck's crawler analytics layer is derived from the privacy-minimized Caddy
access log introduced in SG-01E/F. It does not trust crawler user-agent strings
by themselves.

## Trust and identity

A request is counted as a verified crawler request only when:

1. the direct peer belongs to Cloudflare's official published ranges;
2. a `CF-Connecting-IP` value is present;
3. the claimed crawler identity passes the provider verification used by
   `audit_crawler_access_log.py`.

No source IP is emitted into the analytics report.

## Observable dimensions

The snapshot reports:

- verified crawler;
- crawler role (search/retrieval vs training);
- URL family;
- response status;
- response bytes;
- latency;
- first-seen timestamp;
- last-seen timestamp;
- unique path count;
- top requested paths.

URL families are intentionally bounded and stable:

- `web`
- `robots`
- `sitemap`
- `intelligence`
- `stockproof`
- `charting`
- `fo`
- `commentary`
- `crypto`
- `asset`
- `other`

Query strings are stripped before path aggregation.

## Private production snapshot

Recommended private output:

`/opt/factory/seo-state/crawler-analytics-latest.json`

The output writer is atomic and mode 0600.

Typical production command:

```bash
python3 scripts/seo/crawler_log_analytics.py \
  --hours 24 \
  --top-paths 20 \
  --output /opt/factory/seo-state/crawler-analytics-latest.json
```

The report is a measurement snapshot, not an indexing claim. A verified crawler
request does not imply that the URL was indexed, ranked, cited by an AI system,
or generated an impression.
