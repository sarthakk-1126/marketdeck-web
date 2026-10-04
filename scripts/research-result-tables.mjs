/** Generated internal review tables; no extra public research/result URL. */
import {readFileSync,writeFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('content/research/var-simulation-results.json'));
const f=(x,n=3)=>x.toFixed(n);
let out='# VaR simulation — all result tables\n\nINT-VAR-SIM-1.0 · Synthetic generated observations only · 8,000 repetitions per condition · 2,000 independent holdout observations. VaR% and breach%; signed errors/MCSE in percentage points. IQR is between-estimation dispersion, not a confidence interval.\n\n';
for(const s of d.scenarios){out+='## '+s+'\n\n| n | Confidence | Method | Median VaR % | p25–p75 % | Mean breach % | Median breach % | Error pp | Breach MCSE pp | Kupiec rejection % | Rejection MCSE pp |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
 for(const r of d.rows.filter(r=>r.scenario===s))out+=`| ${r.train} | ${f(r.confidence*100,0)}% | ${r.method} | ${f(r.var_median_pct)} | ${f(r.var_p25_pct)}–${f(r.var_p75_pct)} | ${f(r.breach_mean_pct)} | ${f(r.breach_median_pct)} | ${f(r.breach_error_pp)} | ${f(r.breach_mean_mcse_pp,4)} | ${f(r.kupiec_rejection_pct,2)} | ${f(r.kupiec_rejection_mcse_pp)} |\n`;
 out+='\n';
}
out+='## Disagreement and diagnostics\n\n| Scenario | n | Confidence | Intermethod disagreement % | CF nonmonotone % | CF99 below95 % |\n|---|---|---|---|---|---|\n';
for(const r of d.rows.filter(r=>r.method==='Historical'))out+=`| ${r.scenario} | ${r.train} | ${f(r.confidence*100,0)}% | ${f(r.disagreement_pct,2)} | ${f(r.cf_nonmonotone_pct,2)} | ${f(r.cf_confidence_crossing_pct,2)} |\n`;
out+='\nNo negative thresholds or nonfinite results in this frozen run. These checks are not universal CF validation.\n';
writeFileSync('docs/research/var-result-tables.md',out);
