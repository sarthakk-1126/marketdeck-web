import hashlib
import math
import unittest
from pathlib import Path
from statistics import NormalDist
import numpy as np
import canonical_metrics as canonical
from var_simulation import generate, stream, estimates, nonmonotone, pof


class SimulationTests(unittest.TestCase):
    def test_frozen_production_source_digest(self):
        raw=Path(__file__).with_name('canonical_metrics.py').read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(),'7d5047b56e895688c14545ec74bcd405f56e83235c082d615f4ce48474386b2b')

    def test_equivalence_to_deployed_functions(self):
        for scenario in range(4):
            for n in (3,20,252,756,1260):
                for rep in range(5):
                    x=generate(stream(scenario,n,rep,0),scenario,n)
                    for confidence in (.95,.99):
                        got,s,k=estimates(x,confidence)
                        expected=[canonical.historical_var(x.tolist(),confidence),
                            canonical.parametric_var(x.tolist(),confidence),
                            canonical.cornish_fisher_var(x.tolist(),confidence)]
                        np.testing.assert_allclose(got,expected,rtol=1e-12,atol=1e-14)
                        self.assertAlmostEqual(s,canonical.skewness(x.tolist()),places=11)
                        self.assertAlmostEqual(k,canonical.excess_kurtosis(x.tolist()),places=11)

    def test_seed_reproducible_and_role_separated(self):
        for scenario in range(4):
            a=generate(stream(scenario,252,0,0),scenario,252)
            b=generate(stream(scenario,252,0,0),scenario,252)
            np.testing.assert_array_equal(a,b)
            for n,rep,role in ((252,0,1),(252,1,0),(756,0,0)):
                other=generate(stream(scenario,n,rep,role),scenario,252)
                self.assertFalse(np.array_equal(a,other))

    def test_quantile_hand_fixture(self):
        self.assertAlmostEqual(estimates([-.04,-.02,0,.02,.04],.95)[0][0],.036)
        self.assertAlmostEqual(canonical._percentile([0.,10.,20.],25),5.)

    def test_std_and_moments_hand_fixture(self):
        x=np.array([-2.,-1.,0.,1.,2.])
        v,s,k=estimates(x,.95)
        self.assertAlmostEqual(s,0)
        self.assertAlmostEqual(k,-1.3)
        self.assertAlmostEqual(v[1],-NormalDist().inv_cdf(.05)*math.sqrt(2.5))

    def test_kupiec_independent_log_fixture_and_boundaries(self):
        for n,x,c in ((1000,50,.95),(1000,20,.99),(2000,0,.99),(2000,2000,.95)):
            p=1-c
            null=(n-x)*math.log1p(-p)+x*math.log(p)
            alt=0.
            if n-x: alt+=(n-x)*math.log1p(-x/n)
            if x: alt+=x*math.log(x/n)
            lr=max(0.,2*(alt-null))
            # At the exact null rate LR is analytically zero; avoid cancellation
            # in the independent log-likelihood fixture near this boundary.
            if abs(x/n-p)<1e-14: lr=0.
            result=pof(n,x,c)
            self.assertAlmostEqual(result.likelihood_ratio,lr,places=9)
            self.assertAlmostEqual(result.p_value,math.erfc(math.sqrt(lr/2)),places=10)
        self.assertIsNone(pof(0,0,.95).p_value)

    def test_breach_direction_not_absolute(self):
        self.assertEqual(canonical.count_var_exceedances([-.03,-.02,.03,.5],.02),1)

    def test_invalid_and_constant_samples(self):
        for x,c in (([1,2],.95),([1,2,3],0),([1,2,float('nan')],.99)):
            with self.assertRaises(ValueError): estimates(x,c)
        v,s,k=estimates([.01]*3,.95)
        self.assertEqual(v[0],-.01)
        self.assertTrue(np.isnan(v[2]))
        self.assertIsNone(s)
        self.assertIsNone(canonical.cornish_fisher_var([.01]*3,.95))

    def test_cf_derivative_check_matches_dense_grid(self):
        z=np.linspace(NormalDist().inv_cdf(.001),NormalDist().inv_cdf(.1),10001)
        for s,k in ((0,0),(-1,2),(1,10),(-3,20),(0,-2)):
            derivative=1+s*z/3+k*(3*z*z-3)/24-s*s*(6*z*z-5)/36
            self.assertEqual(nonmonotone(s,k),bool(np.min(derivative)<0))

    def test_generated_populations_have_declared_location_scale(self):
        # Sanity test, not the actual study dataset or a real-market calibration.
        for scenario in range(4):
            x=generate(stream(scenario,100000,50000,0),scenario,100000)
            self.assertLess(abs(x.mean()),.00015)
            self.assertLess(abs(x.std()-.01),.0002)
        skew=generate(stream(1,100000,50000,0),1,100000)
        self.assertLess(canonical.skewness(skew.tolist()),-.7)


if __name__=='__main__': unittest.main()
