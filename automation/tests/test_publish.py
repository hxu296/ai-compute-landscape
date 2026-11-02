import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('publish',Path(__file__).parents[1]/'publish.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Publish(unittest.TestCase):
    def test_merge_preserves_concurrent_stories_and_legacy_migration(self):
        source={'items':[{'id':'a','date':'2026-11-02','title':'Existing','impact_score':4,'impact_reason':'New schema metadata'}]}
        remote={'items':[{'date':'2026-11-02','title':'Existing','summary':'Correction from editor'},{'id':'b','date':'2026-11-02','title':'Concurrent story','impact_score':3}]}
        merged=m.merge_editorial(source,remote)
        self.assertEqual(merged['schema_version'],2)
        self.assertEqual([i['id'] for i in merged['items']],['a','b'])
        self.assertEqual(merged['items'][0]['impact_score'],4)
        self.assertEqual(merged['items'][0]['summary'],'Correction from editor')
        self.assertEqual(m.merge_editorial(merged,merged),merged)
    def test_unknown_legacy_story_requires_migration(self):
        with self.assertRaises(ValueError):m.merge_editorial({'items':[]},{'items':[{'date':'2026-11-01','title':'Unknown'}]})
if __name__=='__main__':unittest.main()
