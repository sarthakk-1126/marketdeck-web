export const GA4_MEASUREMENT_ID = 'G-KZ54EVX7T5';

const MARKER_START = '<!-- MarketDeck GA4: public canonical pages only -->';
const MARKER_END = '<!-- /MarketDeck GA4 -->';

function canonicalLiteral(canonicalUrl) {
  if (typeof canonicalUrl !== 'string' || !/^https:\/\/marketdeck\.in\/(?:[^\s"'<>]*)$/.test(canonicalUrl)) {
    throw new Error('Invalid MarketDeck canonical URL for analytics');
  }
  return JSON.stringify(canonicalUrl).replace(/</g, '\\u003c');
}

export function analyticsTag(canonicalUrl) {
  const canonical = canonicalLiteral(canonicalUrl);
  return `${MARKER_START}
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA4_MEASUREMENT_ID}', {
    page_location: ${canonical},
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
</script>
${MARKER_END}`;
}

export function injectAnalytics(html) {
  if (typeof html !== 'string') throw new Error('HTML must be a string');
  if (html.includes(MARKER_START)) return html;

  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*>/i);
  if (!match) return html;

  const headIndex = html.indexOf('<head>');
  if (headIndex < 0) throw new Error('Canonical HTML is missing <head>');

  const insertAt = headIndex + '<head>'.length;
  return html.slice(0, insertAt) + analyticsTag(match[1]) + html.slice(insertAt);
}

export function stripAnalytics(html) {
  if (typeof html !== 'string') throw new Error('HTML must be a string');
  const start = html.indexOf(MARKER_START);
  if (start < 0) return html;
  const end = html.indexOf(MARKER_END, start);
  if (end < 0) throw new Error('Unterminated MarketDeck GA4 block');
  return html.slice(0, start) + html.slice(end + MARKER_END.length);
}
