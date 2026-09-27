/** Stable MarketDeck structured-data identity. No environment-dependent values. */
export const MARKETDECK = Object.freeze({
  origin: 'https://marketdeck.in',
  url: 'https://marketdeck.in/',
  name: 'MarketDeck',
  description: 'Indian market research, charting, derivatives, commentary, and digital asset research in one connected product suite.',
  language: 'en-IN',
  organizationId: 'https://marketdeck.in/#organization',
  websiteId: 'https://marketdeck.in/#website',
  logoId: 'https://marketdeck.in/#logo',
  logoUrl: 'https://marketdeck.in/assets/marketdeck-logo.png',
  publishingPrinciples: 'https://marketdeck.in/research-standards/',
});

export const organizationReference = () => ({'@id': MARKETDECK.organizationId});
export const websiteReference = () => ({'@id': MARKETDECK.websiteId});

export const logoNode = () => ({
  '@type': 'ImageObject',
  '@id': MARKETDECK.logoId,
  url: MARKETDECK.logoUrl,
  contentUrl: MARKETDECK.logoUrl,
  width: 2048,
  height: 2048,
});

export const compactOrganization = () => ({
  '@type': 'Organization',
  '@id': MARKETDECK.organizationId,
  name: MARKETDECK.name,
  url: MARKETDECK.url,
  logo: logoNode(),
});

export const organizationNode = () => ({
  ...compactOrganization(),
  description: MARKETDECK.description,
  publishingPrinciples: MARKETDECK.publishingPrinciples,
});

export const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': MARKETDECK.websiteId,
  name: MARKETDECK.name,
  url: MARKETDECK.url,
  description: MARKETDECK.description,
  inLanguage: MARKETDECK.language,
  publisher: organizationReference(),
});

export const homepageIdentityGraph = () => ({
  '@context': 'https://schema.org',
  '@graph': [organizationNode(), websiteNode()],
});

export function canonicalUrl(path) {
  const pathOnly=typeof path==='string'?path.split(/[?#]/,1)[0]:'';
  if (typeof path !== 'string' || pathOnly.split('/').includes('..') || !/^\/(?:[A-Za-z0-9._~-]+\/)*(?:\?[A-Za-z0-9._~=&%-]+)?$/.test(path)) {
    throw new Error('Invalid canonical MarketDeck path');
  }
  return MARKETDECK.origin + path;
}

export const webPageNode = (canonical) => ({
  '@type': 'WebPage',
  '@id': canonical + '#webpage',
  url: canonical,
  isPartOf: websiteReference(),
});

export const collectionIdentity = (canonical) => ({
  '@id': canonical + '#webpage',
  url: canonical,
  isPartOf: websiteReference(),
  publisher: organizationReference(),
});
