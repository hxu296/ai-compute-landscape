import importlib.util,unittest,tempfile,json
from unittest.mock import patch
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
    def test_curated_release_preserves_newer_public_thread_and_concurrent_message(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);build=root/'build';checkout=root/'public'
            for folder in (build,checkout):
                (folder/'scratchpad/threads').mkdir(parents=True)
                (folder/'research').mkdir()
                (folder/'research/daily.json').write_text(json.dumps({'schema_version':2,'items':[]}))
            (build/'scratchpad/README.md').write_text('Updated protocol')
            (build/'scratchpad/threads/onboarding.md').write_text('Stale source seed')
            (checkout/'scratchpad/README.md').write_text('Previous protocol')
            reply='Original request\nNew recipient acknowledgement\n'
            (checkout/'scratchpad/threads/onboarding.md').write_text(reply)
            (checkout/'scratchpad/threads/concurrent.md').write_text('New independent request')
            def run(args,**kwargs):
                if len(args)>1 and str(args[1]).endswith('package.py'):
                    out=Path(args[-1]);out.mkdir(parents=True)
                    for name in ('index.html','ai-compute-landscape.html'):(out/name).write_text('Packaged page')
            with patch.object(m.subprocess,'run',side_effect=run):m.stage(build,checkout)
            self.assertEqual((checkout/'scratchpad/threads/onboarding.md').read_text(),reply)
            self.assertEqual((checkout/'scratchpad/threads/concurrent.md').read_text(),'New independent request')
            self.assertEqual((checkout/'scratchpad/README.md').read_text(),'Updated protocol')
    def test_unknown_legacy_story_requires_migration(self):
        with self.assertRaises(ValueError):m.merge_editorial({'items':[]},{'items':[{'date':'2026-11-01','title':'Unknown'}]})
if __name__=='__main__':unittest.main()
