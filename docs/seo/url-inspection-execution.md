# SG-03E — Google URL Inspection execution

The sampler creates a private request plan. This runner executes that plan against
Google's read-only URL Inspection API and stores normalized results privately.

Official endpoint:

`POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`

Required OAuth scope:

`https://www.googleapis.com/auth/webmasters.readonly`

The API reports the version in Google's index. It does not perform the Search
Console "Test live URL" action and does not request indexing.

## Private files

Plan:

`/opt/factory/seo-state/url-inspection-plan-YYYY-MM-DD.json`

Bearer token:

`/opt/factory/seo-state/google-search-console-access-token.txt`

Results ledger:

`/opt/factory/seo-state/url-inspection-results-YYYY-MM-DD.json`

Token and results files must be mode 0600. The token is never copied into the
results ledger or normal output.

## Safe rollout

1. generate the 200-URL stratified plan;
2. obtain a read-only OAuth access token outside Git;
3. execute a 5-URL canary;
4. inspect the result distribution and auth/property correctness;
5. resume the same ledger for the remaining URLs.

The ledger is keyed to the exact SHA-256 of the plan. A changed plan cannot be
silently resumed against old inspection results.

## Stored measurements

For each inspected URL the ledger stores:

- cohort/group/family identity;
- indexed-state classification;
- Google verdict and coverage state;
- robots/indexing/fetch states;
- last crawl time;
- crawl user agent;
- Google canonical;
- user canonical;
- canonical parity;
- known sitemap list;
- count of referring URLs (not the referring URLs themselves);
- rich-result verdict/types;
- Search Console inspection-result link.

Search Console results remain distinct from crawler logs, rankings, impressions,
and AI citation evidence.
