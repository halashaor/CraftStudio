import base64,gzip,json,threading,unittest,urllib.request,urllib.error
from test_lite_bridge import server

class DesktopHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start();cls.base='http://127.0.0.1:'+str(cls.http.server_port)
    @classmethod
    def tearDownClass(cls):cls.http.shutdown();cls.http.server_close()
    def test_all_local_entries_share_designer(self):
        pages=[urllib.request.urlopen(self.base+path).read() for path in ['/','/index.html','/lite.html']];self.assertEqual(pages[0],pages[1]);self.assertEqual(pages[0],pages[2]);self.assertIn(b'craftstudio-build',pages[0])
    def test_sqlite_route_and_write_auth(self):
        info=json.load(urllib.request.urlopen(self.base+'/api/desktop/info'));self.assertEqual(info['protocol'],'craftstudio-desktop/1')
        data=json.dumps({'method':'save','args':[{'$bytes':'AQID'},{'title':'HTTP fixture'}]}).encode();url=self.base+'/api/desktop/library'
        with self.assertRaises(urllib.error.HTTPError):urllib.request.urlopen(urllib.request.Request(url,data=data,headers={'Content-Type':'application/json'}))
        r=json.load(urllib.request.urlopen(urllib.request.Request(url,data=data,headers={'Content-Type':'application/json','X-CraftStudio-Token':info['token']})));self.assertEqual(r['value']['head'],1)
    def test_chunk_baseline_route_returns_only_requested_chunk(self):
        project={'size':[48,4,4],'origin':[0,64,0],'palette':[{'Name':'custom:block'}],'blocks':[{'pos':[1,1,1],'state':0},{'pos':[33,1,1],'state':0}],'metadata':{}}
        raw={'$bytes':base64.b64encode(gzip.compress(json.dumps(project).encode(),mtime=0)).decode()}
        def call(method,args):
            req=urllib.request.Request(self.base+'/api/desktop/library',data=json.dumps({'method':method,'args':args}).encode(),headers={'Content-Type':'application/json','X-CraftStudio-Token':server.TOKEN})
            return json.load(urllib.request.urlopen(req))['value']
        m=call('baselineManifest',['http-chunk-fixture',raw]);self.assertEqual(m['blockCount'],2)
        r=call('baselineChunks',['http-chunk-fixture',['2,0,0']]);self.assertEqual(len(r['items']),1);blocks=json.loads(gzip.decompress(base64.b64decode(r['items'][0]['bytes']['$bytes'])));self.assertEqual(blocks,[project['blocks'][1]])

    def test_unknown_library_method_is_rejected(self):
        body=json.dumps({'method':'delete_everything','args':[]}).encode();req=urllib.request.Request(self.base+'/api/desktop/library',data=body,headers={'Content-Type':'application/json','X-CraftStudio-Token':server.TOKEN})
        with self.assertRaises(urllib.error.HTTPError):urllib.request.urlopen(req)
if __name__=='__main__':unittest.main()
