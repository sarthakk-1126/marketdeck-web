// Read the existing authenticated portfolio view. Its owner-scoped ledger and
// valuation code remain the sole source of financial figures; Lens computes none.
const directText = element => element?.childNodes ? [...element.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g,' ').trim() : text(element);
const text = element => (element?.textContent || '').replace(/\s+/g,' ').trim();
export function readPortfolioDocument(doc) {
 const workspace = doc.querySelector('.sp-pf-workspace');
 if (!workspace) throw new Error('Unexpected portfolio response');
 const metrics = [...workspace.querySelectorAll('.sp-pf-summary .sp-pf-metric')].map(el => ({label:directText(el.querySelector('span')),value:directText(el.querySelector('strong')),note:[text(el.querySelector('strong small')),text(el.querySelector('.sp-pf-proceeds'))].filter(Boolean).join(' · ')}));
 if (metrics.length !== 4 || metrics.some(m => !m.label || !m.value)) throw new Error('Portfolio summary is incomplete');
 const holdings = [...workspace.querySelectorAll('.sp-pf-holdings tbody tr')].map(row => {
  const identity = row.querySelector('th'); const cells = [...row.querySelectorAll('td')];
  if (!identity || cells.length !== 5) throw new Error('Portfolio holding is incomplete');
  return {ticker:text(identity.querySelector('a')),name:text(identity.querySelector('span')),purchase:text(identity.querySelector('small')),quantity:text(cells[0]),cost:text(cells[1]),price:text(cells[2]),value:text(cells[3]),gain:text(cells[4])};
 });
 return {name:text(workspace.querySelector('.sp-pf-head h1')),description:text(workspace.querySelector('.sp-pf-lede')),metrics,holdings,warning:text(workspace.querySelector('.sp-pf-alert')),empty:text(workspace.querySelector('.sp-pf-empty')),basis:text(workspace.querySelector('.sp-pf-price-note'))};
}
export async function loadPortfolio(signal, fetcher = fetch) {
 const response = await fetcher('/screener/portfolio/', {credentials:'same-origin',cache:'no-store',signal,redirect:'manual',headers:{'Accept':'text/html'}});
 if (response.type === 'opaqueredirect' || response.status === 302 || response.status === 303) return {signedOut:true};
 const destination = new URL(response.url || '/screener/portfolio/', location.origin);
 if (destination.origin !== location.origin || !destination.pathname.endsWith('/screener/portfolio/')) return {signedOut:true};
 if (response.status === 401 || response.status === 403) return {signedOut:true};
 if (!response.ok) throw new Error('Portfolio is temporarily unavailable');
 if (!(response.headers.get('content-type') || '').includes('text/html')) throw new Error('Unexpected portfolio response');
 return {portfolio:readPortfolioDocument(new DOMParser().parseFromString(await response.text(),'text/html'))};
}
