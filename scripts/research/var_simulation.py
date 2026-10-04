"""MarketDeck-owned generated-data experiment. No network, DB or user inputs."""
import argparse
import hashlib
import json
import math
import platform
import time
from pathlib import Path
from statistics import NormalDist

import numpy as np
import canonical_metrics as reference

SEED = 20261004
METHODS = ('Historical', 'Gaussian', 'Cornish-Fisher')
SCENARIOS = ('Normal', 'Negative skew', 'Fat tails', 'Skew and fat tails')
SIZES = (252, 756, 1260)
CONFIDENCES = (.95, .99)
HOLDOUT = 2000


def stream(scenario, n, replication, role):
    return np.random.Generator(np.random.PCG64(np.random.SeedSequence(
        [SEED, scenario, n, replication, role])))


def generate(rng, scenario, size):
    if scenario == 0:
        x = rng.normal(size=size)
    elif scenario == 1:
        delta = -5 / math.sqrt(26)
        x = delta * np.abs(rng.normal(size=size)) + math.sqrt(1-delta**2) * rng.normal(size=size)
        x = (x-delta*math.sqrt(2/math.pi))/math.sqrt(1-2*delta**2/math.pi)
    elif scenario == 2:
        x = rng.standard_t(8, size=size) * math.sqrt(6/8)
    elif scenario == 3:
        rare = rng.random(size=size) < .05
        x = rng.normal(size=size) * np.where(rare, 2., 1.) + np.where(rare, -4., 0.)
        x = (x+.2)/math.sqrt(1.91)
    else:
        raise ValueError('Unknown generated process')
    return .01*x


def estimates(x, confidence):
    x = np.asarray(x, dtype=float)
    if len(x)<3 or not 0<confidence<1 or not np.isfinite(x).all():
        raise ValueError('Invalid sample or confidence')
    mu = x.mean()
    centered = x-mu
    m2 = np.mean(centered**2)
    if m2 == 0:
        return np.array([-mu, -mu, np.nan]), None, None
    sd = x.std(ddof=1)
    s = np.mean(centered**3)/m2**1.5
    k = np.mean(centered**4)/m2**2-3
    z = NormalDist().inv_cdf(1-confidence)
    cf = z+(z*z-1)*s/6+(z**3-3*z)*k/24-(2*z**3-5*z)*s*s/36
    return np.array([-np.quantile(x,1-confidence,method='linear'), -(mu+z*sd), -(mu+cf*sd)]), s, k


def nonmonotone(s,k):
    # Exact minimum of the quadratic derivative over z for p=.001.. .1.
    lo,hi = [NormalDist().inv_cdf(p) for p in (.001,.1)]
    a,b,c = k/8-s*s/6, s/3, 1-k/8+5*s*s/36
    pts=[lo,hi]
    if a>0 and lo < -b/(2*a) < hi:
        pts.append(-b/(2*a))
    return min(a*z*z+b*z+c for z in pts)<0


def pof(n,x,c):
    return reference.kupiec_pof_test(n,int(x),c)


def quantiles(a):
    return [float(v) for v in np.quantile(a,[.25,.5,.75],method='linear')]


def main(reps, output):
    if reps<2 or reps%2:
        raise ValueError('Use an even replication count >=2')
    start=time.perf_counter()
    rows=[]
    digest=hashlib.sha256()
    max_delta={'median_relative':0.,'mean_breach_pp':0.,'rejection_pp':0.}
    for scenario,name in enumerate(SCENARIOS):
        for n in SIZES:
            values=np.zeros((reps,2,3))
            breaches=np.zeros_like(values)
            rejects=np.zeros_like(values)
            disagreement=np.zeros((reps,2))
            bad=np.zeros(reps)
            crossed=np.zeros(reps)
            for rep in range(reps):
                train=generate(stream(scenario,n,rep,0),scenario,n)
                hold=generate(stream(scenario,n,rep,1),scenario,HOLDOUT)
                digest.update(train.astype('<f8').tobytes())
                digest.update(hold.astype('<f8').tobytes())
                for ci,c in enumerate(CONFIDENCES):
                    v,s,k=estimates(train,c)
                    if not np.isfinite(v).all():
                        raise ArithmeticError('Nonfinite estimate; no silent exclusion')
                    values[rep,ci]=v
                    counts=np.sum(hold[:,None] < -v[None,:],axis=0)
                    breaches[rep,ci]=counts/HOLDOUT
                    rejects[rep,ci]=[not pof(HOLDOUT,x,c).consistent for x in counts]
                    disagreement[rep,ci]=(np.ptp(v)/np.median(np.abs(v)))>.2
                bad[rep]=nonmonotone(s,k)
                crossed[rep]=values[rep,1,2]<values[rep,0,2]
            for ci,c in enumerate(CONFIDENCES):
                for mi,method in enumerate(METHODS):
                    v=values[:,ci,mi]*100
                    b=breaches[:,ci,mi]*100
                    reject=rejects[:,ci,mi]
                    q=quantiles(v)
                    halves=np.array_split(np.arange(reps),2)
                    med=[np.median(v[h]) for h in halves]
                    ds={'median_relative':float(abs(med[0]-med[1])/abs(q[1])),
                        'mean_breach_pp':float(abs(b[halves[0]].mean()-b[halves[1]].mean())),
                        'rejection_pp':float(abs(reject[halves[0]].mean()-reject[halves[1]].mean())*100)}
                    for key in ds:
                        max_delta[key]=max(max_delta[key],ds[key])
                    rows.append({'scenario':name,'train':n,'confidence':c,'method':method,
                        'var_p25_pct':q[0],'var_median_pct':q[1],'var_p75_pct':q[2],
                        'breach_median_pct':float(np.median(b)), 'breach_mean_pct':float(b.mean()),
                        'breach_error_pp':float(b.mean()-100*(1-c)),
                        'breach_mean_mcse_pp':float(b.std(ddof=1)/math.sqrt(reps)),
                        'kupiec_rejection_pct':float(reject.mean()*100),
                        'kupiec_rejection_mcse_pp':float(reject.std(ddof=1)*100/math.sqrt(reps)),
                        'disagreement_pct':float(disagreement[:,ci].mean()*100),
                        'cf_nonmonotone_pct':float(bad.mean()*100),
                        'cf_confidence_crossing_pct':float(crossed.mean()*100),
                        'negative_var_pct':float((v<0).mean()*100), 'split_difference':ds})
    result={'method_version':'INT-VAR-SIM-1.0','seed':SEED,'rng':'NumPy PCG64 + SeedSequence',
        'replications_per_condition':reps,'holdout':HOLDOUT,'scenarios':list(SCENARIOS),
        'train_sizes':list(SIZES),'confidences':list(CONFIDENCES),'rows':rows,
        'generated_returns_sha256':digest.hexdigest(),
        'python':platform.python_version(),'numpy':np.__version__,
        'convergence_max_split_difference':max_delta,
        'convergence_pass':max_delta['median_relative']<=.02 and max_delta['mean_breach_pp']<=.15 and max_delta['rejection_pp']<=4,
        'simulation_sets':len(SCENARIOS)*len(SIZES)*reps,
        'generated_observations':len(SCENARIOS)*sum(n+HOLDOUT for n in SIZES)*reps}
    # No runtime timestamp/cost in frozen results: byte-identical reproducibility.
    Path(output).parent.mkdir(parents=True,exist_ok=True)
    Path(output).write_bytes((json.dumps(result,indent=2,allow_nan=False)+'\n').encode('utf8'))
    print(json.dumps({'replications':reps,'seconds':round(time.perf_counter()-start,2),
        'convergence':max_delta,'pass':result['convergence_pass'],'digest':digest.hexdigest()}))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--replications',type=int,default=8000)
    parser.add_argument('--output',default='content/research/var-simulation-results.json')
    args=parser.parse_args()
    main(args.replications,args.output)
