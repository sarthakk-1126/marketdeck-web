export function confirmedDestinations(groups) {
  const normalized=new Set();
  for(const p of groups.flatMap(g=>g.platforms)) {
    if(!p.confirmed||!p.enabled||!p.joinable||p.type!=='external'||!p.url)continue;
    const url=new URL(p.url);
    url.hash='';url.hostname=url.hostname.toLowerCase();
    normalized.add(url.href.replace(/\/$/,''));
  }
  return [...normalized];
}
