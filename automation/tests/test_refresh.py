import datetime as dt,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('refresh',Path(__file__).parents[1]/'refresh.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ETL(unittest.TestCase):
    def test_calendar_change_and_missing_history(self):
        points=[{'date':(dt.date(2026,1,1)+dt.timedelta(days=i)).isoformat(),'value':1+i/100} for i in range(100)]
        r=m.checks('test','H100','test','https://example.com',list(reversed(points)),'2026-11-02')
        self.assertEqual(r['changes']['30']['first_date'],'2026-03-11');self.assertAlmostEqual(r['changes']['30']['percent'],100*(1.99/1.69-1),places=3)
        self.assertIsNone(m.checks('test','H100','test','https://example.com',points[:2],'2026-11-02')['changes']['7'])
    def test_bad_values_and_future_dates(self):
        for v in [0,-1,float('nan'),True,'2.0']:
            with self.assertRaises(ValueError):m.number(v)
        with self.assertRaises(ValueError):m.checks('x','H','x','https://example.com',[{'date':'2099-01-01','value':1}],'2026-11-02')
    def test_editorial_dates_and_links(self):
        item={'id':'test-story','impact_score':3,'impact_reason':'Material provider-specific capacity implications.','date':'2026-11-02','title':'A dated analysis','summary':'Evidence from an earlier filing.','status':'reviewed','kind':'analysis','sources':[{'date':'2026-10-26','url':'https://example.com/filing','title':'Filing'}]}
        self.assertEqual(m.editorial({'schema_version':2,'items':[item]},'2026-11-02'),[item])
        with self.assertRaises(ValueError):m.editorial({'schema_version':2,'items':[item,item]},'2026-11-02')
        other={**item,'id':'second-story'}
        self.assertEqual(len(m.editorial({'schema_version':2,'items':[item,other]},'2026-11-02')),2)
        for score in [0,6,True,3.5]:
            with self.assertRaises(ValueError):m.editorial({'schema_version':2,'items':[{**item,'impact_score':score}]},'2026-11-02')
        item['sources'][0]['url']='javascript:bad'
        with self.assertRaises(ValueError):m.editorial({'schema_version':2,'items':[item]},'2026-11-02')
    def test_correction_preserves_original_publication_date(self):
        item={'id':'original-story','impact_score':4,'impact_reason':'Completed company-level financing.','date':'2026-11-02','updated_date':'2026-11-06','event_date':'2026-11-04','title':'Completed offering','summary':'Later closing evidence corrects the original story.','status':'reviewed','kind':'news','sources':[{'date':'2026-11-04','url':'https://example.com/closing','title':'Closing filing'}]}
        self.assertEqual(m.editorial({'schema_version':2,'items':[item]},'2026-11-06'),[item])
        for change in [{'updated_date':'2026-11-01'},{'updated_date':'2026-11-07'},{'updated_date':'2026-11-03'},{'event_date':'2026-11-07'},{'sources':[{'date':'2026-11-07','url':'https://example.com/future','title':'Future filing'}]}]:
            with self.assertRaises(ValueError):m.editorial({'schema_version':2,'items':[{**item,**change}]},'2026-11-06')
        original={k:v for k,v in item.items() if k!='updated_date'}
        with self.assertRaises(ValueError):m.editorial({'schema_version':2,'items':[original]},'2026-11-06')
    def test_total_failure_preserves_published_cache(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);m.write(root/'data/live.json',{'schema_version':1,'sources':{},'daily':{'items':[]}});before=(root/'data/live.json').read_bytes()
            with patch.object(m,'fetch',side_effect=OSError('test outage')):
                with self.assertRaises(RuntimeError):m.run(root)
            self.assertEqual(before,(root/'data/live.json').read_bytes());self.assertTrue(list((root/'.cache/etl').rglob('failure.json')))
    def test_partial_failure_preserves_other_source(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);old={'name':'SemiAnalysis H100','date':'2026-01-01','sku':'H100','usd':3,'terms':'composite','source_url':'https://example.com','changes':{}}
            m.write(root/'data/live.json',{'schema_version':1,'sources':{'semianalysis':{'market_checks':[old]}},'daily':{'items':[]}})
            payload={'indices':[{'alias':alias,'history':[{'date':'2026-01-01','value':2}]} for alias in ['CDGXH100','CDH200','CDB200','CDB300']]}
            with patch.object(m,'fetch',side_effect=[(payload,'abc'),OSError('outage')]):live=m.run(root)
            self.assertEqual(live['sources']['semianalysis']['market_checks'],[old]);self.assertEqual(live['sources']['semianalysis']['health']['state'],'error')
if __name__=='__main__':unittest.main()
