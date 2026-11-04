import copy, datetime, json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import roll_projection

DEMAND = json.loads((roll_projection.ROOT/'research/demand-research.json').read_text())

class RollProjection(unittest.TestCase):
    def test_same_day_is_idempotent(self):
        before = DEMAND['global_estimate']
        after = roll_projection.roll(copy.deepcopy(DEMAND), before['as_of'])['global_estimate']
        for a, b in zip(before['components'], after['components']):
            self.assertAlmostEqual(a['central'], b['central'], places=2)
            self.assertAlmostEqual(a['high'], b['high'], places=2)
        self.assertAlmostEqual(before['total']['central'], after['total']['central'], places=0)

    def test_later_date_grows_trended_components_only(self):
        start = DEMAND['global_estimate']['as_of']
        # Always roll forward from the file's own date, so the daily job keeps passing as the data advances.
        target = (datetime.date.fromisoformat(start) + datetime.timedelta(days=60)).isoformat()
        later = roll_projection.roll(copy.deepcopy(DEMAND), target)['global_estimate']
        for a, b in zip(DEMAND['global_estimate']['components'], later['components']):
            if a.get('monthly_growth') and a.get('latest_daily'):
                self.assertGreater(b['central'], a['central'])
            else:
                self.assertEqual(a['central'], b['central'])
            self.assertEqual(a['low'], b['low'])
        self.assertEqual(later['as_of'], target)
        self.assertGreater(target, start)

    def test_refuses_to_go_backwards(self):
        with self.assertRaises(ValueError):
            roll_projection.roll(copy.deepcopy(DEMAND), '2026-01-01')

if __name__ == '__main__':
    unittest.main()
