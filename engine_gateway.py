"""Optional loopback engine process; forwards binary RPC after Python authentication."""
import atexit,json,os,queue,re,shutil,subprocess,threading,urllib.request,urllib.error
from pathlib import Path

class EngineGateway:
    def __init__(self, root, database, token):
        self.root=Path(root);self.database=Path(database);self.token=token;self.lock=threading.RLock();self.process=None;self.url=None;self.reason=None;self.closed=False
        candidates=[os.environ.get('CRAFTSTUDIO_NODE'),shutil.which('node')]
        profile=os.environ.get('USERPROFILE')
        if profile:candidates.append(str(Path(profile)/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'))
        self.opener=urllib.request.OpenerDirector();self.opener.add_handler(urllib.request.HTTPHandler());self.opener.add_handler(urllib.request.HTTPDefaultErrorHandler());self.opener.add_handler(urllib.request.HTTPErrorProcessor())
        self.node=None
        if os.environ.get('CRAFTSTUDIO_ENGINE','0')=='1' and (self.root/'lite/node_modules/fflate/package.json').is_file():
            for candidate in dict.fromkeys(p for p in candidates if p):
                try:
                    version=subprocess.check_output([candidate,'--version'],timeout=3,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0).decode().strip()
                    match=re.fullmatch(r'v(\d+)\.(\d+)\.(\d+)',version)
                    if match and tuple(map(int,match.groups()))>=(22,13,0):self.node=candidate;break
                except (OSError,subprocess.SubprocessError):pass
        atexit.register(self.close)
    def ensure(self):
        with self.lock:
            if self.closed or not self.node:return False
            if self.process and self.process.poll() is None:return True
            env=os.environ.copy();env['CRAFTSTUDIO_ENGINE_TOKEN']=self.token
            logs=self.database.parent/'engine-process.log';logs.parent.mkdir(parents=True,exist_ok=True)
            with logs.open('ab') as error_log:
                self.process=subprocess.Popen([self.node,str(self.root/'local-engine/run-service.mjs'),str(self.database)],cwd=self.root,env=env,stdout=subprocess.PIPE,stderr=error_log,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
            result=queue.Queue()
            stream=self.process.stdout
            threading.Thread(target=lambda:result.put(stream.readline()),daemon=True).start()
            try:
                info=json.loads(result.get(timeout=8))
                if info.get('protocol')!='craftstudio-engine-process/1' or not re.fullmatch(r'http://127\.0\.0\.1:\d+',info.get('url','')):raise ValueError('Invalid engine startup')
                self.url=info['url'];return True
            except (ValueError,queue.Empty):
                self.reason='Local engine startup failed';self.process.terminate();self.process.wait(timeout=5);self.process=None;return False
    def forward(self, body):
        if not self.ensure():raise ValueError('本地计算引擎不可用')
        request=urllib.request.Request(self.url+'/rpc',data=body,headers={'Content-Type':'application/x-craftstudio-engine','X-CraftStudio-Token':self.token})
        opener=self.opener
        try:
            with opener.open(request,timeout=120) as response:return response.status,response.read()
        except urllib.error.HTTPError as error:return error.code,error.read()
    def close(self):
        with self.lock:
            self.closed=True
            if self.process and self.process.poll() is None:
                self.process.terminate()
                try:self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
