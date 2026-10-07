import base64,gzip,json,unittest,tempfile,copy
from pathlib import Path
import test_workspace_chunks as fixtures
from designer_storage import DesignerLibrary
class CheckpointDraftTests(unittest.TestCase):
 setUp=fixtures.WorkspaceChunkTests.setUp
 tearDown=fixtures.WorkspaceChunkTests.tearDown
 save=fixtures.WorkspaceChunkTests.save
 def test_pending_save_form_is_draft_only_and_replaced_on_next_capture(self):
  self.save(1);data=self.packet();form={'schema':'craftstudio-save-form/1','title':'Draft title','tags':'roof, timber','kind':'project','note':'Next note'};data['saveForm']=form
  self.lib.call('draftCheckpoint',[data,None]);self.assertEqual(self.payload()['site']['saveForm'],form)
  self.assertNotIn('saveForm',self.lib.call('workspaceHead',['ws'])['snapshot'])
  self.lib.call('draftCheckpoint',[dict(data,saveForm=dict(form,note='')),None]);self.assertEqual(self.payload()['site']['saveForm']['note'],'')
 def test_history_is_draft_only_and_immutable(self):
  self.save(1);data=self.packet();history={'schema':'craftstudio-draft-history/1','chunks':[],'designs':[{'materialPalettes':[]}],'undo':[{'chunks':[],'size':[8,8,8],'design':0}],'redo':[]};data['history']=history
  self.lib.call('draftCheckpoint',[data,None]);self.assertEqual(self.payload()['site']['history'],history)
  self.assertNotIn('history',self.lib.call('workspaceHead',['ws'])['snapshot'])
  history['undo'].clear();self.assertEqual(len(self.payload()['site']['history']['undo']),1)
  bad=dict(data,history={'schema':'unknown'})
  with self.assertRaises(ValueError):self.lib.call('draftCheckpoint',[bad,None])
  self.assertEqual(len(self.payload()['site']['history']['undo']),1)
 def packet(self,revision=1,asset=True):
  head=self.lib.call('workspaceHead',['ws']);data={'workspaceId':'ws','revision':revision,'digest':head['digest'],'assetKey':'assets:test','title':'Autosaved'}
  if asset:data['assetBytes']={'$bytes':base64.b64encode(gzip.compress(json.dumps({'models':{},'images':{'fixture':'data:image/png;base64,AA=='},'textures':{}}).encode(),mtime=0)).decode()}
  return data
 def payload(self,library=None,key='active'):return json.loads(gzip.decompress(base64.b64decode((library or self.lib).call('resume',[key])['bytes']['$bytes'])))
 def count(self):
  with self.lib.connection() as conn:return conn.execute('SELECT COUNT(*) FROM designer_draft_blobs').fetchone()[0]
 def test_saved_draft_remains_immutable_when_live_checkpoint_changes(self):
  self.save(1);data=self.packet();self.lib.call('draftCheckpoint',[data,None]);original=self.payload();self.assertEqual(original['site']['overlay'],self.snapshot['overlay']);self.assertEqual(original['site']['design'],self.snapshot['design']);self.assertEqual(original['site']['title'],'Autosaved');restored=self.lib.call('resume',[]);self.assertEqual(json.loads(gzip.decompress(base64.b64decode(restored['baseline']['$bytes']))),self.base);self.assertEqual(restored['assetBytes'],data['assetBytes'])
  newer=copy.deepcopy(self.snapshot);newer['overlay'][0]['state']={'Name':'minecraft:gold_block'};self.save(2,newer,1);self.assertEqual(self.payload(),original)
  self.lib.call('draftCheckpoint',[self.packet(2,False),None]);self.assertEqual(self.payload()['site']['overlay'][0]['state'],{'Name':'minecraft:gold_block'});self.assertEqual(self.count(),3)
 def test_dedup_and_collection_preserve_other_project_drafts(self):
  self.save(1);p=self.lib.call('save',[{'$bytes':'AQID'},{'title':'Project P'}]);q=self.lib.call('save',[{'$bytes':'AQID'},{'title':'Project Q'}]);self.lib.call('draftCheckpoint',[self.packet(),p['id']]);before=self.payload(key='draft:'+p['id']);newer=copy.deepcopy(self.snapshot);newer['overlay'][0]['state']={'Name':'minecraft:gold_block'};self.save(2,newer,1);self.lib.call('draftCheckpoint',[self.packet(2,False),q['id']]);self.assertEqual(self.count(),4);self.assertEqual(self.payload(key='draft:'+p['id']),before);self.lib.call('draftCheckpoint',[self.packet(2,False),q['id']]);self.assertEqual(self.count(),4)
  legacy={'baseKey':'base','baseline':self.lib.call('resume',[])['baseline'],'assetKey':None,'payload':{'$bytes':'AQID'}};self.lib.call('draft',[legacy,q['id']]);self.assertEqual(self.count(),3);self.assertEqual(self.payload(key='draft:'+p['id']),before)
 def test_stale_capture_rolls_back_attachments_and_keeps_saved_draft(self):
  self.save(1);data=self.packet();self.lib.call('draftCheckpoint',[data,None]);before=self.lib.call('resume',[]);self.save(2,dict(self.snapshot,title='New'),1);bad=dict(data,assetKey='assets:bad')
  with self.assertRaises(ValueError):self.lib.call('draftCheckpoint',[bad,None])
  self.assertEqual(self.lib.call('resume',[]),before)
  with self.lib.connection() as conn:self.assertIsNone(self.lib.get(conn,'bases','assets:bad'))
 def test_backup_materializes_portable_sessions_and_restores_active_only_when_empty(self):
  self.save(1);project=self.lib.call('save',[{'$bytes':'AQID'},{'title':'Named'}]);self.lib.call('draftCheckpoint',[self.packet(),project['id']]);backup=self.lib.call('backup',[]);self.assertTrue(all('checkpointDraft' not in row for row in backup['sessions']));self.assertTrue(all('bytes' in row for row in backup['sessions'] if row['id']=='active' or row['id'].startswith('draft:')))
  restored=DesignerLibrary(Path(self.temp.name)/'restore.sqlite3');mapping=restored.call('restore',[backup])['mapping'];self.assertEqual(self.payload(restored),self.payload());self.assertEqual(self.payload(restored,'draft:'+mapping[project['id']]),self.payload())
  preserved=DesignerLibrary(Path(self.temp.name)/'preserve.sqlite3');preserved.call('draft',[{'baseKey':'existing','baseline':{'$bytes':'AQID'},'payload':{'$bytes':'Ag=='}}]);preserved.call('restore',[backup]);self.assertEqual(preserved.call('resume',[])['bytes'],{'$bytes':'Ag=='})
 def test_missing_blob_reports_error_and_can_be_recaptured_from_live_checkpoint(self):
  self.save(1);self.lib.call('draftCheckpoint',[self.packet(),None])
  with self.lib.connection() as conn:conn.execute('DELETE FROM designer_draft_blobs WHERE digest=(SELECT digest FROM designer_draft_blobs LIMIT 1)')
  with self.assertRaises(ValueError):self.lib.call('resume',[])
  self.lib.call('draftCheckpoint',[self.packet(1,False),None]);self.assertEqual(self.payload()['site']['overlay'],self.snapshot['overlay'])
 def test_surrogate_text_in_draft_metadata_roundtrips_without_replacement(self):
  self.save(1);data=dict(self.packet(),title='Saved\ud800 name');self.lib.call('draftCheckpoint',[data,None]);self.assertEqual(self.payload()['site']['title'],'Saved\ud800 name')
