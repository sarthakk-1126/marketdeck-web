import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MODULE_PATH=ROOT/'scripts'/'seo'/'indexnow_notify.py'
spec=importlib.util.spec_from_file_location('indexnow_notify',MODULE_PATH)
indexnow=importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(indexnow)


def write_event(directory: Path, release: str, *, created=None, updated=None, withdrawn=None, baseline=False):
    event={
        'schema_version':'1.0',
        'release_id':release,
        'previous_release_id':None,
        'generated_at':'2026-09-25T00:00:00Z',
        'previous_public_status':'available',
        'initial_baseline':baseline,
        'created':created or [],
        'updated':updated or [],
        'withdrawn':withdrawn or [],
        'counts':{
            'created':len(created or []),
            'updated':len(updated or []),
            'withdrawn':len(withdrawn or []),
        },
    }
    directory.mkdir(parents=True,exist_ok=True)
    (directory/f'{release}.json').write_text(json.dumps(event),encoding='utf-8')
    return event


class IndexNowTests(unittest.TestCase):
    def test_key_and_url_validation(self):
        self.assertEqual(indexnow.validate_key('Abcdef12-'), 'Abcdef12-')
        with self.assertRaises(indexnow.NotificationError):indexnow.validate_key('short')
        self.assertEqual(indexnow.validate_url('https://marketdeck.in/a/?x=1'),'https://marketdeck.in/a/?x=1')
        for bad in ('http://marketdeck.in/a/','https://evil.example/a/','https://marketdeck.in/a/#x'):
            with self.subTest(bad=bad),self.assertRaises(indexnow.NotificationError):
                indexnow.validate_url(bad)

    def test_event_urls_deduplicate_and_chunk_limit(self):
        event={
            'created':['https://marketdeck.in/a/','https://marketdeck.in/b/'],
            'updated':['https://marketdeck.in/a/'],
            'withdrawn':['https://marketdeck.in/c/'],
        }
        self.assertEqual(indexnow.event_urls(event),[
            'https://marketdeck.in/a/','https://marketdeck.in/b/','https://marketdeck.in/c/'
        ])
        values=[f'https://marketdeck.in/x/{i}/' for i in range(10001)]
        self.assertEqual([len(x) for x in indexnow.chunks(values)],[10000,1])

    def test_baseline_event_never_submits_historical_urls(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);events=base/'events';state=base/'state.json'
            write_event(events,'baseline',baseline=True)
            calls=[]
            def sender(*args):
                calls.append(args);return 200
            result=indexnow.process_events(
                events_dir=events,state_path=state,key='A'*32,
                key_location='https://marketdeck.in/'+('A'*32)+'.txt',
                sender=sender,
            )
            self.assertEqual(calls,[])
            self.assertEqual(result['events_completed'],1)
            saved=json.loads(state.read_text())
            self.assertEqual(saved['events']['baseline']['status'],'baseline_no_submission')

    def test_nonempty_baseline_is_refused(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);events=base/'events';state=base/'state.json'
            write_event(events,'baseline',created=['https://marketdeck.in/old/'],baseline=True)
            with self.assertRaisesRegex(indexnow.NotificationError,'baseline_event_contains_urls'):
                indexnow.process_events(
                    events_dir=events,state_path=state,key='A'*32,
                    key_location='https://marketdeck.in/'+('A'*32)+'.txt',
                    sender=lambda *args:200,
                )

    def test_idempotent_chunk_state_prevents_resubmission(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);events=base/'events';state=base/'state.json'
            write_event(events,'r1',created=['https://marketdeck.in/new/'])
            calls=[]
            def sender(*args):
                calls.append(args);return 200
            kwargs=dict(
                events_dir=events,state_path=state,key='B'*32,
                key_location='https://marketdeck.in/'+('B'*32)+'.txt',
                sender=sender,
            )
            first=indexnow.process_events(**kwargs)
            second=indexnow.process_events(**kwargs)
            self.assertEqual(len(calls),1)
            self.assertEqual(first['urls_submitted'],1)
            self.assertEqual(second['chunks_already_accepted'],1)
            self.assertEqual(json.loads(state.read_text())['events']['r1']['status'],'complete')

    def test_retry_429_then_202_is_accepted(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);events=base/'events';state=base/'state.json'
            write_event(events,'r1',updated=['https://marketdeck.in/updated/'])
            statuses=iter([429,202]);sleeps=[]
            def sender(*args):return next(statuses)
            result=indexnow.process_events(
                events_dir=events,state_path=state,key='C'*32,
                key_location='https://marketdeck.in/'+('C'*32)+'.txt',
                sender=sender,sleep_fn=sleeps.append,
            )
            self.assertEqual(sleeps,[1.0])
            self.assertEqual(result['events_completed'],1)
            saved=json.loads(state.read_text())['events']['r1']
            chunk=next(iter(saved['chunks'].values()))
            self.assertEqual(chunk['status'],'accepted_pending_validation')
            self.assertEqual(chunk['attempts'],2)

    def test_mutated_event_same_release_is_refused(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);events=base/'events';state=base/'state.json'
            write_event(events,'r1',created=['https://marketdeck.in/a/'])
            indexnow.process_events(
                events_dir=events,state_path=state,key='D'*32,
                key_location='https://marketdeck.in/'+('D'*32)+'.txt',
                sender=lambda *args:200,
            )
            write_event(events,'r1',created=['https://marketdeck.in/b/'])
            with self.assertRaisesRegex(indexnow.NotificationError,'change_event_mutated'):
                indexnow.process_events(
                    events_dir=events,state_path=state,key='D'*32,
                    key_location='https://marketdeck.in/'+('D'*32)+'.txt',
                    sender=lambda *args:200,
                )


if __name__=='__main__':
    unittest.main(verbosity=2)
