"""CraftStudio local service. Game installations are read-only; output stays here."""
import argparse
import base64
import copy
import hashlib
import json
import mimetypes
import os
import secrets
import threading
import urllib.error
import urllib.parse
import urllib.request
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from assets import MC, index, instances, scope_path
from formats import import_nbt, import_region, export_structure
from design import room, materials, validate, apply_operations, rotate
from storage import Library
from designer_storage import DesignerLibrary
from desktop_files import list_files, read_file, home_for

ROOT = Path(__file__).resolve().parent
BACKEND_BUILD = hashlib.sha256(b''.join((ROOT / name).read_bytes() for name in ('server.py','assets.py','designer_storage.py','desktop_files.py','chunk_storage.py','chunk_export.py','draft_storage.py'))).hexdigest().upper()
STORAGE_ROOT = Path(os.environ.get('CRAFTSTUDIO_STORAGE_DIR', str(ROOT))).resolve()
DATA_DIR, PROJECTS_DIR, EXPORTS_DIR = (STORAGE_ROOT / name for name in ('data', 'projects', 'exports'))
for directory in (DATA_DIR, PROJECTS_DIR, EXPORTS_DIR):
    directory.mkdir(parents=True, exist_ok=True)
LIBRARY = Library(DATA_DIR / 'craftstudio.sqlite3')
DESIGNER_LIBRARY = DesignerLibrary(DATA_DIR / 'craftstudio.sqlite3')
MIGRATION = LIBRARY.migrate_files(PROJECTS_DIR)
TOKEN = secrets.token_urlsafe(32)
LOCK = threading.RLock()
CURRENT = room()
HISTORY, REDO = [], []
REVISION = 0
PREVIEW = None
CURRENT_ID = None
KEEP_ID = object()
AUTOSAVE = PROJECTS_DIR / '.active.session.json'
recovered = LIBRARY.session()
if recovered:
    CURRENT, REVISION, CURRENT_ID = recovered['project'], recovered['revision'], recovered['project_id']
elif AUTOSAVE.is_file():
    try:
        recovered = json.loads(AUTOSAVE.read_text(encoding='utf-8'))
        CURRENT = validate(recovered['project'])
        REVISION = recovered.get('revision', 0)
        LIBRARY.put_session(CURRENT, REVISION)
    except (ValueError, KeyError, TypeError):
        CURRENT['warnings'].append('上次自动保存无法恢复；原文件已保留，请手工检查。')


def persist_active(p, revision, identifier=None):
    LIBRARY.put_session(p, revision, identifier)
    temp = AUTOSAVE.with_suffix('.tmp')
    try:
        temp.write_text(json.dumps({'project': p, 'revision': revision, 'project_id': identifier}, ensure_ascii=False), encoding='utf-8')
        temp.replace(AUTOSAVE)
    except OSError:
        print('CraftStudio: JSON 自动保存失败，工程已保存在 SQLite 中。', flush=True)


def commit(p, expected=None, library_id=KEEP_ID):
    global CURRENT, REVISION, PREVIEW, CURRENT_ID
    with LOCK:
        if expected is not None and expected != REVISION:
            raise ValueError('工程已被其他操作修改，请刷新后重试')
        validate(p)
        identifier = CURRENT_ID if library_id is KEEP_ID else library_id
        persist_active(p, REVISION + 1, identifier)
        HISTORY.append((copy.deepcopy(CURRENT), CURRENT_ID))
        del HISTORY[:-20]
        REDO.clear()
        CURRENT = p
        CURRENT_ID = identifier
        REVISION += 1
        PREVIEW = None
        return snapshot()


def snapshot():
    return {'project': CURRENT, 'revision': REVISION, 'materials': materials(CURRENT), 'undo': len(HISTORY), 'redo': len(REDO),
            'library': LIBRARY.get(CURRENT_ID) if CURRENT_ID else None}


def catalogue(instance):
    assets = index(instance)
    LIBRARY.cache_environment(assets)
    home = assets.home
    files = [{'path': file.relative_to(home / 'schematics').as_posix(), 'name': file.name, 'bytes': file.stat().st_size}
             for file in (home / 'schematics').rglob('*') if file.is_file() and file.suffix.lower() in ('.nbt', '.schem', '.litematic')]
    worlds = []
    for world in (home / 'saves').iterdir() if (home / 'saves').is_dir() else []:
        if not world.is_dir() or not (world / 'level.dat').exists():
            continue
        dims = []
        for path in world.rglob('region'):
            if path.is_dir() and any(path.glob('*.mca')):
                dims.append(path.relative_to(world).as_posix())
        worlds.append({'id': world.name, 'dimensions': dims})
    return {'summary': assets.summary(), 'schematics': files, 'worlds': worlds}


def request_bridge(body, route):
    # Bridge is a separate game mod; connection is explicit and stays on loopback.
    port = int(body.get('port', 18766))
    if not 1024 <= port <= 65535:
        raise ValueError('无效桥接端口')
    token = body.get('token', '')
    if not token:
        raise ValueError('请填写游戏桥接令牌')
    payload = body.get('payload', {})
    request = urllib.request.Request(f'http://127.0.0.1:{port}/{route}', data=json.dumps(payload).encode(),
                                     headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
    try:
        return json.loads(urllib.request.urlopen(request, timeout=60).read())
    except urllib.error.HTTPError as error:
        try:
            message = json.load(error).get('error', '桥接请求失败')
        except ValueError:
            message = f'桥接返回 HTTP {error.code}'
        raise ValueError(message) from None
    except urllib.error.URLError:
        raise ValueError('游戏桥接未连接；请运行对应桥接 Mod 并打开世界。') from None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # never record API keys or prompts

    def respond(self, data, status=200, content_type='application/json; charset=utf-8', filename=None):
        raw = json.dumps(data, ensure_ascii=False).encode() if isinstance(data, (dict, list)) else data
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-CraftStudio-Version','0.3.0')
        origin=self.headers.get('Origin')
        if origin in self.allowed_origins():
            self.send_header('Access-Control-Allow-Origin',origin)
            self.send_header('Vary','Origin')
            self.send_header('Access-Control-Allow-Headers','Content-Type, X-CraftStudio-Token')
            self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store' if 'json' in content_type else 'public, max-age=60')
        if filename:
            self.send_header('Content-Disposition', "attachment; filename*=UTF-8''" + urllib.parse.quote(filename))
        self.end_headers()
        self.wfile.write(raw)

    def allowed_origins(self):
        ports={self.server.server_port}
        if self.server.server_port==18767:ports.add(18765)
        return {f'http://{host}:{port}' for host in ('127.0.0.1','localhost') for port in ports}

    def do_OPTIONS(self):
        try:
            self.trusted();self.respond(b'',status=204,content_type='text/plain')
        except Exception as error:self.respond({'error':str(error)},400)

    def trusted(self, write=False):
        host = self.headers.get('Host', '')
        allowed = {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}
        if host not in allowed:
            raise ValueError('拒绝未知主机')
        origin = self.headers.get('Origin')
        if origin and origin not in self.allowed_origins():
            raise ValueError('拒绝跨站请求')
        if write and self.headers.get('X-CraftStudio-Token') != TOKEN:
            raise ValueError('本地会话令牌无效，请刷新界面')

    def do_GET(self):
        try:
            self.trusted()
            parsed = urllib.parse.urlparse(self.path)
            route, query = parsed.path, urllib.parse.parse_qs(parsed.query)
            arg = lambda name, default='': query.get(name, [default])[0]
            if route == '/api/desktop/info':
                self.respond({'protocol':'craftstudio-desktop/1','token':TOKEN,'version':'0.3.0','storage':'sqlite','capabilities':['baseline-chunks/1','workspace-chunks/1','workspace-delta/1','checkpoint-export/1','checkpoint-draft/1'],'instances':instances(),'backendBuild':BACKEND_BUILD,'sourceRoot':str(ROOT)})
            elif route == '/api/desktop/files':
                self.respond(list_files(arg('instance')))
            elif route == '/api/desktop/file':
                file=read_file(arg('instance'),arg('kind'),arg('path'))
                self.respond(file.read_bytes(),content_type='application/octet-stream',filename=file.name)
            elif route == '/api/bootstrap':
                with LOCK:
                    self.respond({'token': TOKEN, 'instances': instances(), 'project': snapshot(), 'version': '0.2.0', 'storage': LIBRARY.stats(), 'migration': MIGRATION})
            elif route == '/api/project':
                with LOCK:
                    self.respond(snapshot())
            elif route == '/api/catalogue':
                self.respond(catalogue(arg('instance')))
            elif route == '/api/blocks':
                self.respond(index(arg('instance')).search(arg('q'), int(arg('offset', '0'))))
            elif route == '/api/resource':
                data = index(arg('instance')).read(arg('key'))
                if data is None:
                    self.respond({'error': '资源缺失'}, 404)
                else:
                    self.respond(data, content_type=mimetypes.guess_type(arg('key'))[0] or 'application/octet-stream')
            elif route == '/api/projects':
                self.respond([p.name for p in PROJECTS_DIR.glob('*.craft.json')])
            elif route == '/api/library':
                self.respond(LIBRARY.list(query=arg('q'), kind=arg('kind'), favorite=arg('favorite') == '1', deleted=arg('deleted') == '1', offset=int(arg('offset', '0'))))
            elif route == '/api/library/versions':
                self.respond(LIBRARY.versions(arg('id')))
            elif route == '/api/library/stats':
                self.respond(LIBRARY.stats())
            elif route == '/api/library/blocks':
                self.respond(LIBRARY.cached_blocks(arg('instance'), arg('q'), int(arg('offset', '0'))))
            elif route == '/api/library/export':
                data = LIBRARY.load(arg('id'), int(arg('version')) if arg('version') else None)
                raw = json.dumps(data['project'], ensure_ascii=False).encode('utf-8')
                self.respond(raw, content_type='application/json; charset=utf-8', filename=data['item']['title'] + '.craft.json')
            elif route == '/api/tools':
                self.respond({'protocol': 'CraftStudio HTTP v1', 'read': ['/api/project', '/api/blocks', '/api/catalogue'],
                              'write': ['/api/edit', '/api/generate', '/api/import', '/api/export', '/api/save', '/api/library/open', '/api/library/metadata', '/api/library/trash', '/api/library/restore', '/api/library/backup', '/api/bridge/health', '/api/bridge/read', '/api/bridge/apply'],
                              'auth': 'X-CraftStudio-Token; /api/bootstrap returns session token', 'bridge': 'requires running CraftStudio bridge mod'})
            else:
                file = scope_path(ROOT / 'web', 'lite.html' if route in ('/','/index.html') else route.lstrip('/'))
                if not file.is_file():
                    self.respond({'error': '不存在'}, 404)
                else:
                    self.respond(file.read_bytes(), content_type=mimetypes.guess_type(file)[0] or 'application/octet-stream')
        except Exception as error:
            self.respond({'error': str(error)}, 400)

    def do_POST(self):
        global CURRENT, REVISION, PREVIEW, CURRENT_ID
        try:
            self.trusted(write=True)
            length = int(self.headers.get('Content-Length', 0))
            if length > 64 * 1024 * 1024:
                raise ValueError('请求过大，请分区操作')
            body = json.loads(self.rfile.read(length))
            route = urllib.parse.urlparse(self.path).path
            if route == '/api/desktop/library':
                self.respond({'value':DESIGNER_LIBRARY.call(body['method'],body.get('args',[]))})
            elif route == '/api/desktop/world':
                home=home_for(body['instance']);world=scope_path(home/'saves',body['world']);folder=scope_path(world,body.get('dimension','region'))
                if folder.name!='region':raise ValueError('请选择有效维度的 region 目录')
                p=import_region(folder,body['min'],body['max'],body['world']+' · 区域');p['metadata']['instance']=body['instance'];p['metadata']['originConfirmed']=True
                self.respond(p)
            elif route == '/api/models':
                resources = index(body['instance'])
                self.respond({'models': [resources.block_model(s) for s in body['states']]})
            elif route == '/api/import':
                if 'project' in body:
                    p = validate(body['project'])
                else:
                    if body.get('data'):
                        raw = base64.b64decode(body['data'])
                        name = body.get('name', '导入建筑')
                    else:
                        file = scope_path(index(body['instance']).home / 'schematics', body['path'])
                        raw, name = file.read_bytes(), file.stem
                    p = import_nbt(raw, name)
                    p['metadata']['instance'] = body['instance']
                self.respond(commit(p, body.get('revision'), library_id=None))
            elif route == '/api/world':
                home = index(body['instance']).home
                world = scope_path(home / 'saves', body['world'])
                folder = scope_path(world, body.get('dimension', 'region'))
                if folder.name != 'region':
                    raise ValueError('请选择有效维度 region 目录')
                p = import_region(folder, body['min'], body['max'], body['world'] + ' · 区域')
                p['metadata']['instance'] = body['instance']
                self.respond(commit(p, body.get('revision'), library_id=None))
            elif route == '/api/edit':
                with LOCK:
                    p = apply_operations(CURRENT, body['operations'], index(body['instance']))
                    self.respond(commit(p, body.get('revision')))
            elif route == '/api/rotate':
                with LOCK:
                    self.respond(commit(rotate(CURRENT), body.get('revision')))
            elif route in ('/api/undo', '/api/redo'):
                with LOCK:
                    source, target = (HISTORY, REDO) if route.endswith('undo') else (REDO, HISTORY)
                    if source:
                        p, identifier = source[-1]
                        persist_active(p, REVISION + 1, identifier)
                        target.append((copy.deepcopy(CURRENT), CURRENT_ID))
                        CURRENT, CURRENT_ID = source.pop()
                        REVISION += 1
                        PREVIEW = None
                    self.respond(snapshot())
            elif route == '/api/generate':
                p = room(**body.get('params', {}))
                resources = index(body['instance'])
                for state in p['palette']:
                    if state['Name'] not in resources.ids:
                        raise ValueError(f'所选实例缺少生成材料 {state["Name"]}')
                p['dataVersion'] = resources.data_version or p['dataVersion']
                p['metadata']['instance'] = body['instance']
                self.respond(commit(p, body.get('revision'), library_id=None))
            elif route == '/api/save':
                with LOCK:
                    if body.get('revision') is not None and body['revision'] != REVISION:
                        raise ValueError('工程已修改，请刷新后再保存')
                    identifier = None if body.get('saveAs') else CURRENT_ID
                    p = copy.deepcopy(CURRENT)
                    if body.get('instance'):
                        p.setdefault('metadata', {})['instance'] = body['instance']
                    item = LIBRARY.save(p, identifier=identifier, title=body.get('name'), description=body.get('description'),
                                        tags=body.get('tags'), kind=body.get('kind'), note=body.get('note', ''), expected_head=body.get('head'))
                    saved = LIBRARY.load(item['id'])['project']
                    result = commit(saved, REVISION, library_id=item['id'])
                    name = item['legacy_file']
                    file = scope_path(PROJECTS_DIR, name)
                    temp = file.with_suffix('.tmp')
                    compatibility_error = None
                    try:
                        temp.write_text(json.dumps(CURRENT, ensure_ascii=False), encoding='utf-8')
                        temp.replace(file)
                    except OSError:
                        compatibility_error = '数据库保存成功，但 JSON 副本写入失败；可使用工程库导出。'
                    self.respond({'file': str(file), 'name': item['title'], 'library': item, 'snapshot': result, 'warning': compatibility_error})
            elif route == '/api/load':
                file = scope_path(PROJECTS_DIR, body['name'])
                self.respond(commit(json.loads(file.read_text(encoding='utf-8')), body.get('revision'), library_id=None))
            elif route == '/api/library/open':
                with LOCK:
                    loaded = LIBRARY.load(body['id'], body.get('version'))
                    draft = LIBRARY.draft(body['id']) if body.get('version') is None else None
                    restored = bool(draft and draft['project'] != loaded['project'])
                    if restored:
                        loaded['project'] = draft['project']
                    result = commit(loaded['project'], body.get('revision'), library_id=body['id'])
                    result['openedVersion'] = loaded['version']
                    result['draftRestored'] = restored
                    self.respond(result)
            elif route == '/api/library/metadata':
                with LOCK:
                    item = LIBRARY.metadata(body['id'], body['changes'])
                    self.respond({'item': item, 'snapshot': snapshot()})
            elif route in ('/api/library/trash', '/api/library/restore'):
                with LOCK:
                    item = LIBRARY.trash(body['id'], restore=route.endswith('/restore'))
                    if route.endswith('/trash') and CURRENT_ID == body['id']:
                        commit(copy.deepcopy(CURRENT), REVISION, library_id=None)
                    self.respond({'item': item, 'snapshot': snapshot()})
            elif route == '/api/library/backup':
                self.respond({'file': LIBRARY.backup(DATA_DIR / 'backups')})
            elif route == '/api/export':
                with LOCK:
                    p = copy.deepcopy(CURRENT)
                name = Path(body.get('name', p['name'])).name.replace(':', '_') + '.nbt'
                data = export_structure(p)
                file = scope_path(EXPORTS_DIR, name)
                file.write_bytes(data)
                self.respond(data, content_type='application/octet-stream', filename=name)
            elif route == '/api/ai/plan':
                self.ai_plan(body)
            elif route == '/api/ai/apply':
                with LOCK:
                    if not PREVIEW or PREVIEW['revision'] != REVISION:
                        raise ValueError('AI 预览已过期，请重新生成')
                    self.respond(commit(PREVIEW['project'], REVISION))
            elif route == '/api/lite/bridge':
                action = body.get('action')
                if action not in ('health', 'read', 'validate', 'apply', 'job', 'cancel', 'undo'):
                    raise ValueError('未知轻量版施工操作')
                if action == 'apply':
                    payload = body.get('payload', {})
                    payload['project'] = validate(payload['project'])
                    if payload['project'].get('entities') or payload['project'].get('metadata', {}).get('nativeExtra'):
                        raise ValueError('实体结构请使用原生 NBT 蓝图施工')
                    body['payload'] = payload
                self.respond(request_bridge(body, action))
            elif route.startswith('/api/bridge/'):
                action = route.rsplit('/', 1)[1]
                if action not in ('health', 'read', 'validate', 'apply', 'job', 'cancel', 'undo'):
                    raise ValueError('未知桥接操作')
                if action == 'apply':
                    with LOCK:
                        body['payload'] = dict(body.get('payload', {}), project=copy.deepcopy(CURRENT))
                result = request_bridge(body, action)
                if action == 'read' and 'project' in result:
                    result = commit(result['project'], body.get('revision'), library_id=None)
                self.respond(result)
            else:
                self.respond({'error': '未知接口'}, 404)
        except Exception as error:
            self.respond({'error': str(error)}, 400)

    def ai_plan(self, body):
        global PREVIEW
        endpoint = body.get('endpoint', '').rstrip('/')
        parsed = urllib.parse.urlparse(endpoint)
        if parsed.scheme != 'https' and not (parsed.scheme == 'http' and parsed.hostname in ('localhost', '127.0.0.1')):
            raise ValueError('AI 地址需要 HTTPS，或本地 HTTP 服务')
        if parsed.username or parsed.password:
            raise ValueError('AI 地址不能包含认证信息')
        resources = index(body['instance'])
        with LOCK:
            current, revision = copy.deepcopy(CURRENT), REVISION
        candidates = resources.search(body.get('materialQuery', ''), limit=160)['items']
        allowed = sorted(set([c['id'] for c in candidates] + [s['Name'] for s in current['palette']]))
        system = ('You design Minecraft structures. Return ONLY JSON {"summary":"Chinese explanation", "operations":[...]}. '
                  'Supported operations: {"type":"fill","min":[x,y,z],"max":[x,y,z],"state":{"Name":"namespace:id"}}, '
                  '{"type":"erase","min":[x,y,z],"max":[x,y,z]}, '
                  '{"type":"set","pos":[x,y,z],"state":{"Name":"namespace:id"}}, '
                  '{"type":"replace","from":"namespace:id","state":{"Name":"namespace:id"}}. '
                  'Coordinates nonnegative integers. Use only provided block IDs. Existing blocks outside operations stay unchanged. '
                  'Preserve machines. Avoid enormous solid volumes; use wall planes, floor planes and roof steps. '
                  'Available blocks: ' + json.dumps(allowed))
        context = {'name': current['name'], 'size': current['size'], 'materials': materials(current),
                   'sampleBlocks': current['blocks'][:400], 'request': body['prompt']}
        content = [{'type': 'text', 'text': json.dumps(context, ensure_ascii=False)}]
        if body.get('image'):
            content.append({'type': 'image_url', 'image_url': {'url': body['image']}})
        request_data = {'model': body['model'], 'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': content}], 'temperature': 0.3}
        request = urllib.request.Request(endpoint + '/chat/completions', data=json.dumps(request_data).encode(),
                                         headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + body.get('key', '')})
        try:
            response = json.loads(urllib.request.urlopen(request, timeout=120).read())
        except urllib.error.HTTPError as error:
            raise ValueError(f'AI 服务返回 HTTP {error.code}；请检查接口地址、模型和密钥') from None
        except urllib.error.URLError:
            raise ValueError('AI 服务连接失败') from None
        text = response['choices'][0]['message']['content'].strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1].rsplit('```', 1)[0]
        plan = json.loads(text)
        p = apply_operations(current, plan['operations'], resources)
        original_entities = {tuple(b['pos']): b for b in current['blocks'] if b.get('nbt')}
        revised_cells = {tuple(b['pos']): b for b in p['blocks']}
        for pos, original in original_entities.items():
            revised = revised_cells.get(pos)
            if revised is None or revised.get('nbt') != original['nbt'] or p['palette'][revised['state']] != current['palette'][original['state']]:
                raise ValueError('AI 方案修改了现有方块实体，已拒绝该方案；请明确手工编辑机器区域。')
        with LOCK:
            if REVISION != revision:
                raise ValueError('生成期间工程已变化，请重新生成')
            PREVIEW = {'project': p, 'revision': revision}
        self.respond({'summary': plan.get('summary', 'AI 方案已生成'), 'operations': plan['operations'], 'project': p, 'revision': revision})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=18767)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'CraftStudio 0.3.0 http://127.0.0.1:{server.server_port} | source={ROOT} | desktop={"/api/desktop/info" in Handler.do_GET.__code__.co_consts}', flush=True)
    server.serve_forever()
