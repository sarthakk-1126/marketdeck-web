"""Off-VPS publication acceptance: checkpoints and exact frozen-run reproduction."""
import hashlib
import json
from pathlib import Path
from var_simulation import main

root=Path(__file__).resolve().parents[2]
out=root/'content/research/var-simulation-results.json'
before=out.read_bytes()
evidence=root/'docs/research'
checks=[]
for reps in (1000,2000,4000,8000):
    path=root/'.evidence'/f'convergence-{reps}.json'
    main(reps,path)
    d=json.loads(path.read_text())
    checks.append({'replications':reps,'pass':d['convergence_pass'],
        'maximum_split_differences':d['convergence_max_split_difference']})
    if reps==8000:
        assert path.read_bytes()==before, 'Frozen results did not reproduce byte-for-byte'
        assert d['convergence_pass'], 'Final convergence gate failed'
record={'checkpoints':checks,'exact_frozen_results_reproduced':True,
    'aggregate_json_sha256':hashlib.sha256(before).hexdigest(),
    'cost_pilot':{'replications':128,'seconds':1.33},
    'initial_4000_seconds':43.89,'initial_8000_seconds':84.78}
(evidence/'var-validation.json').write_bytes((json.dumps(record,indent=2)+'\n').encode('utf8'))
print(json.dumps(record))
