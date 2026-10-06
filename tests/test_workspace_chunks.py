import base64,gzip,json,tempfile,unittest
from pathlib import Path
from designer_storage import DesignerLibrary
class WorkspaceChunkTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.lib=DesignerLibrary(Path(self.temp.name)/'scene.sqlite3');self.base={'size':[48,8,8],'origin':[-20,64,50],'palette':[{'Name':'minecraft:stone'},{'Name':'custom:machine'}],'blocks':[{'pos':[1,1,1],'state':0},{'pos':[33,1,1],'state':1,'nbt':{'t':10,'v':{'Counter':{'t':4,'v':'9223372036854775807'}}}}],'entities':[],'metadata':{'sourceMask':'preserved'}};data={'$bytes':base64.b64encode(gzip.compress(json.dumps(self.base).encode(),mtime=0)).decode()};self.lib.call('baselineManifest',['base',data]);self.snapshot={'size':[80,8,8],'origin':[-20,64,50],'originConfirmed':True,'palette':self.base['palette']+[{'Name':'minecraft:gold_block'}],'protected':[],'design':{'guides':[{'id':'g','points':[[1,2,3],[4,5,6]]}]},'title':'Scene','overlay':[{'pos':[1,1,1],'state':None,'reason':'erase'},{'pos':[34,1,1],'state':{'Name':'minecraft:gold_block'}},{'pos':[70,1,1],'state':{'Name':'minecraft:gold_block'}}]}
 def tearDown(self):self.temp.cleanup()
 def save(self,revision,snapshot=None,expected=None):return self.lib.call('workspaceCheckpoint',[{'workspaceId':'ws','baseKey':'base','revision':revision,'snapshot':snapshot or self.snapshot},expected])
 def blocks(self,revision,key):
  item=self.lib.call('workspaceChunks',['ws',[key],revision])['items'][0];return json.loads(gzip.decompress(base64.b64decode(item['bytes']['$bytes'])))
 def test_merge_delete_new_extent_design_and_typed_nbt_persist_after_restart(self):
  head=self.save(1);self.assertEqual(set(head['changedChunks']),{'0,0,0','2,0,0','4,0,0'});self.assertEqual(self.blocks(1,'0,0,0'),[]);self.assertEqual(len(self.blocks(1,'2,0,0')),2);self.assertEqual(self.blocks(1,'2,0,0')[0]['nbt']['v']['Counter']['v'],'9223372036854775807');self.assertEqual(self.blocks(1,'4,0,0')[0]['state'],2);self.lib=DesignerLibrary(self.lib.path);self.assertEqual(self.lib.call('workspaceHead',['ws'])['snapshot']['design'],self.snapshot['design']);self.assertEqual(len(self.blocks(1,'2,0,0')),2)
 def test_revision_replay_conflicts_and_atomic_bad_payload(self):
  self.save(3);self.assertTrue(self.save(3)['replayed']);bad=dict(self.snapshot,title='different')
  with self.assertRaises(ValueError):self.save(3,bad)
  with self.assertRaises(ValueError):self.save(4,expected=2)
  invalid=dict(self.snapshot,overlay=[{'pos':[999,1,1],'state':None}])
  with self.assertRaises(ValueError):self.save(4,invalid,3)
  self.assertEqual(self.lib.call('workspaceHead',['ws'])['revision'],3)
  with self.assertRaises(ValueError):self.save(4,dict(self.snapshot,origin=None),3)
  with self.assertRaises(ValueError):self.save(4,dict(self.snapshot,size=[16,8,8]),3)
  with self.assertRaises(ValueError):self.lib.call('workspaceChunks',['ws',['0,0,0'],2])
 def test_undo_checkpoint_removes_only_changed_overlay_chunks_and_restores_baseline(self):
  self.save(1);next=dict(self.snapshot,overlay=self.snapshot['overlay'][1:]);head=self.save(2,next,1);self.assertEqual(head['changedChunks'],[]);self.assertEqual(head['removedChunks'],['0,0,0']);self.assertEqual(self.blocks(2,'0,0,0'),self.base['blocks'][:1]);self.assertEqual(self.lib.call('baselineChunks',['base',['0,0,0']])['items'][0]['blocks'],1)
if __name__=='__main__':unittest.main()
