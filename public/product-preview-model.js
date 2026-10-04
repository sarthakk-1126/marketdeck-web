// All datasets are invented teaching examples, not historical market observations.
export const companies = [
  { name: 'Apex Motors', growth: 24, quality: 16, debt: 0.6 },
  { name: 'Nova Healthcare', growth: 18, quality: 22, debt: 0.3 },
  { name: 'Zenith Consumer', growth: 12, quality: 28, debt: 0.1 }
];
export const metrics = {
  growth: { label: 'Growth (3Y)', max: 30, suffix: '%', ascending: false },
  quality: { label: 'ROCE', max: 30, suffix: '%', ascending: false },
  debt: { label: 'Debt / equity', max: 1, suffix: '×', ascending: true }
};
export function screenedCompanies(metric) {
  const config = metrics[metric];
  if (!config) throw new Error('Unknown sample metric');
  return [...companies].sort((a, b) => config.ascending ? a[metric] - b[metric] : b[metric] - a[metric]);
}
export function expiryPayoff(strategy, price, strike = 250, premium = 20) {
  if (strategy === 'call') return Math.max(price - strike, 0) - premium;
  if (strategy === 'put') return Math.max(strike - price, 0) - premium;
  // Covered call assumes one underlying unit purchased at the strike price.
  if (strategy === 'covered') return price - strike + premium - Math.max(price - strike, 0);
  throw new Error('Unknown illustrative strategy');
}
export function sampleSeries(start, drift, swing) {
  return Array.from({ length: 64 }, (_, i) => +(start + i * drift + Math.sin(i * 1.7) * swing + Math.sin(i * .41) * swing * 1.6).toFixed(2));
}
export const priceSeries = sampleSeries(192, .9, 3);
export const volumeSeries = sampleSeries(18, .1, 4);
export const cryptoSeries = { btc: sampleSeries(56000, 330, 1200), eth: sampleSeries(2400, 10, 85) };
export function sampleDate(index) {
  const date = new Date(Date.UTC(2026, 6, 1) + index / 63 * 91 * 86400000);
  return `${String(date.getUTCDate()).padStart(2, '0')} ${['Jul', 'Aug', 'Sep'][date.getUTCMonth() - 6]}`;
}
export const excerpts = {
  earnings: [
    { label: '00:42', text: 'Revenue grew across our core segments.' },
    { label: '02:18', text: 'We are watching input costs as capacity expands.' }
  ],
  filings: [
    { label: 'Note 1', text: 'The reporting period ended on 30 September 2026.' },
    { label: 'Note 2', text: 'Capital expenditure includes the new production line.' }
  ]
};
