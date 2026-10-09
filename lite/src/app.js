import { PageRequests } from './api/page-requests.js';
import { ProjectImporter } from './storage/project-import.js';
import { TaskRunner } from './ui/task-runner.js';
import { designerClientUI } from './integration/designer-client-ui.js';
import { ProjectExporter } from './storage/project-export.js';
import { projectExportUI } from './ui/project-export-ui.js';
import { DraftController } from './storage/draft-controller.js';
import { newProjectUI } from './ui/new-project-ui.js';
import { viewNavigationUI } from './view/view-navigation-ui.js';
import { captureSaveForm, restoreSaveForm } from './storage/save-form.js';
import { pruneGraphics, loadTextureInfo } from './rendering/graphics-resources.js';
import { RemoteEngineWorker } from './runtime/remote-worker.js';
import { brushPlaneAxis } from './selection/brush-plane.js';
import { PerformanceTrace } from './runtime/performance-trace.js';
const performanceTrace = new PerformanceTrace();
import { normalizeDisplay, displayCut } from './view/display-state.js';
import { WorkerSession } from './runtime/worker-session.js';
import {
  sceneShortcutBlocked,
  textEditing,
  historyShortcut,
  nativeSpaceTarget,
  dialogOwnsKeyboard,
} from './ui/keyboard-context.js';
import { WorkspaceChunkSource } from './storage/workspace-chunks.js';
import { BaselineChunkSource } from './storage/baseline-chunks.js';
import { gameUI } from './integration/game-ui.js';
import { ResourceLibrary } from './materials/resource-library.js';
import { resourceUI } from './materials/resource-ui.js';
import { cadShell } from './ui/cad-shell.js';
import { studioUI } from './ui/studio-ui.js';
import * as THREE from '../../web/vendor/three.module.js';
import { OrbitControls } from '../../web/vendor/OrbitControls.js';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import {
  UnifiedLibrary,
  detectDesktop,
  encodeLocal,
  decodeLocal,
} from './storage/desktop-library.js';
import { desktopUI } from './integration/desktop-ui.js';
import { lineCells, brushCells, constrainLine } from './selection/brush.js';

const $ = (id) => document.getElementById(id);
const workerURL = URL.createObjectURL(new Blob([__WORKER__], { type: 'text/javascript' }));
const workerSession = new WorkerSession(() => new Worker(workerURL), {
  resources: () =>
    resourceManager?.entries
      .filter((e) => e.enabled !== false)
      .map((e) => ({ name: e.name, bytes: e.bytes.slice().buffer })) || [],
  status: (phase) => {
    if ($('import-cancel')) $('import-cancel').hidden = !phase;
    if (phase) $('busy-text').textContent = phase;
  },
  beforeSwap: async (slot, validateSwap) => {
    await checkpoint();
    await validateSwap();
    if (slot.worker instanceof RemoteEngineWorker) {
      const session = await slot.worker.ready;
      await library.preference('engine-active', { key: session.key, projectId: null });
    }
  },
  timings: () => performanceTrace.enabled,
  onTiming: (action, timing) => performanceTrace.record('worker-execution', { action, ...timing }),
});
function call(action, data = {}, transfers = [], options = {}) {
  if (
    summary?.preview &&
    (action === 'resume' ||
      action === 'load' ||
      (action === 'import' && !/\.html?$/i.test(data.name || '')))
  )
    return Promise.reject(Error('请先采用或取消方案预览，再打开新场景'));
  const started = performanceTrace.begin(),
    pending = workerSession.call(action, data, transfers, options);
  if (started === null) return pending;
  return pending.then(
    (result) => {
      performanceTrace.finish('worker-call', started, { action });
      return result;
    },
    (error) => {
      performanceTrace.finish('worker-call', started, { action, failed: true });
      throw error;
    },
  );
}
const pageRequests = new PageRequests({
  call,
  baselineRequest,
  cancelOperations: () => cad?.cancelOperations(),
  capabilities: () => library.desktop?.capabilities || [],
  refresh,
  markDirty,
  render,
});
window.CraftStudio = Object.freeze({
  protocol: 'craftstudio-design/1',
  diagnostics: Object.freeze({
    start: () => performanceTrace.start(),
    stop: () => performanceTrace.stop(),
    read: () => performanceTrace.read(),
  }),
  request: (request) => pageRequests.request(request),
  importFile: (input) => taskRunner.execute(() => importer.openInput(input), '正在导入场地或工程…'),
  displayState: () => ({
    mode,
    cut: +$('cut').value >= +$('cut').max ? null : +$('cut').value,
    plants: $('plants').checked,
    ground: $('ground').checked,
    existing: $('existing').checked,
  }),
  setDisplay: async (value) => {
    const display = normalizeDisplay(value);
    if (!summary) throw Error('请先打开工程');
    clearTimeout(render.timer);
    mode = display.mode;
    for (const id of ['plants', 'ground', 'existing']) $(id).checked = display[id];
    $('cut').value = String(displayCut(display.cut, +$('cut').max));
    document
      .querySelectorAll('[data-mode]')
      .forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    await render();
    return window.CraftStudio.displayState();
  },
  viewState: () => ({
    position: camera.position.toArray(),
    target: controls.target.toArray(),
    fov: camera.fov || 45,
    projection: camera.isOrthographicCamera ? 'orthographic' : 'perspective',
    zoom: camera.zoom,
    up: camera.up.toArray(),
    ...(camera.isOrthographicCamera ? { viewHeight: camera.top - camera.bottom } : {}),
  }),
  setView: ({
    position,
    target,
    fov = 45,
    projection = 'perspective',
    zoom = 1,
    up,
    viewHeight,
  }) => {
    const viewUp = up || camera.up.toArray();
    if (
      viewUp.length !== 3 ||
      viewUp.some((n) => !Number.isFinite(n)) ||
      Math.hypot(...viewUp) < 1e-8 ||
      (viewHeight !== undefined && (!Number.isFinite(viewHeight) || viewHeight <= 0))
    )
      throw Error('需要有效的视图方向与正交范围');
    if (
      position?.length !== 3 ||
      target?.length !== 3 ||
      [...position, ...target, fov, zoom].some((n) => !Number.isFinite(n)) ||
      fov <= 0 ||
      fov >= 180 ||
      zoom <= 0
    )
      throw Error('需要有效的相机位置、目标和视角');
    viewNavigation?.begin();
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    const aspect = host.clientWidth / Math.max(1, host.clientHeight),
      distance = new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...target));
    if (projection === 'orthographic') {
      const span = viewHeight ?? Math.max(1, distance * Math.tan((fov * Math.PI) / 360) * 2);
      camera = new THREE.OrthographicCamera(
        (-span * aspect) / 2,
        (span * aspect) / 2,
        span / 2,
        -span / 2,
        0.1,
        20000,
      );
      camera.userData.viewHeight = span;
    } else if (camera.isOrthographicCamera)
      camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 20000);
    controls.object = camera;
    cad?.viewChanged();
    camera.up.set(...viewUp).normalize();
    camera.position.set(...position);
    controls.target.set(...target);
    camera.fov = fov;
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    controls.update();
    needsRender = true;
    viewNavigation?.end();
    return {
      position: camera.position.toArray(),
      target: controls.target.toArray(),
      space: 'local',
    };
  },
  captureView: () => {
    renderer.render(scene, camera);
    return {
      scene: {
        origin: summary?.origin,
        originConfirmed: summary?.originConfirmed,
        revision: summary?.revision,
        workspaceId: summary?.workspaceId,
        preview: !!summary?.preview,
        view: summary?.view,
        mode,
        cut: +$('cut').value,
        geometryLoading: viewLoading,
        pendingChunks: Number(host.dataset.pendingChunks || 0),
        geometryFailed: host.dataset.viewLoadFailed === 'true',
      },
      mimeType: 'image/png',
      dataUrl: renderer.domElement.toDataURL('image/png'),
      camera: { position: camera.position.toArray(), target: controls.target.toArray() },
    };
  },
  save: () => save(),
  export: (options) => exporter.export(options),
});

const importCancel = document.createElement('button');
importCancel.id = 'import-cancel';
importCancel.hidden = true;
importCancel.textContent = '取消打开 · 保留原设计';
importCancel.onclick = () => workerSession.cancel();
$('busy').append(importCancel);
let designerClient = null;
let resourceManager = null,
  resourcePanel = null;
let cad = null,
  viewNavigation = null;
let studio = null;
let motionOverrides = {};
const library = new UnifiedLibrary();
let storageOK = false,
  busy = false,
  summary = null,
  mode = 'after',
  tool = 'inspect',
  active = null,
  hasDocument = false,
  selected = null,
  referenceInfo = null;
const textures = new Map(),
  scene = new THREE.Scene(),
  host = $('scene'),
  renderer = new THREE.WebGLRenderer({ antialias: true });
let camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20000);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xbdcbc5);
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.append(renderer.domElement);
const chunkGroups = new Map(),
  materialPool = new Map(),
  releasedTextures = new Set();
let needsRender = true;
function clearTextures() {
  for (const t of textures.values()) t.dispose();
  textures.clear();
  for (const m of materialPool.values()) m.dispose();
  materialPool.clear();
}
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.maxPolarAngle = Math.PI;
camera.position.set(24, 18, 24);
controls.target.set(0, 0, 0);
controls.mouseButtons.LEFT = null;
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.panSpeed = 1.1;
controls.zoomSpeed = 1.15;
controls.addEventListener('change', () => (needsRender = true));
renderer.domElement.tabIndex = 0;
renderer.domElement.addEventListener(
  'pointerdown',
  () => renderer.domElement.focus({ preventScroll: true }),
  true,
);
scene.add(new THREE.HemisphereLight(0xe9eee3, 0x69785f, 2));
const sun = new THREE.DirectionalLight(0xffe6c5, 2.3);
sun.position.set(-55, 100, 70);
scene.add(sun);
const group = new THREE.Group();
scene.add(group);
const createGroup = new THREE.Group();
scene.add(createGroup);
const createModels = new Map(),
  createObjects = new Map();
let motionTime = 0,
  motionLast = 0,
  motionDrawLast = 0;
renderer.localClippingEnabled = true;
const motionClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 4096);
const grid = new THREE.GridHelper(256, 256, 0x78917b, 0xa5b4a7);
grid.position.set(0.5, -0.01, 0.5);
grid.visible = false;
scene.add(grid);
const pickBox = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
  new THREE.LineBasicMaterial({ color: 0x385b3d }),
);
pickBox.visible = false;
scene.add(pickBox);
new ResizeObserver(() => {
  const w = host.clientWidth,
    h = host.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  if (camera.isOrthographicCamera) {
    const span = camera.userData.viewHeight;
    camera.left = (-span * camera.aspect) / 2;
    camera.right = (span * camera.aspect) / 2;
  }
  camera.updateProjectionMatrix();
  needsRender = true;
  scheduleViewport();
}).observe(host);
renderer.setAnimationLoop((now) => {
  controls.update();
  const dt = motionLast ? Math.min((now - motionLast) / 1000, 0.15) : 0;
  motionLast = now;
  if ($('create-play').checked && document.visibilityState === 'visible') {
    motionTime += dt * Number($('create-rate').value);
    if (updateMotion() && now - motionDrawLast >= 1000 / 30) {
      needsRender = true;
      motionDrawLast = now;
    }
  }
  if (needsRender) {
    const started = performanceTrace.begin();
    renderer.render(scene, camera);
    performanceTrace.finish('frame-submit', started, {
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    });
    needsRender = false;
  }
});
function notice(message, error = false) {
  $('status').textContent = message;
  $('toast').textContent = message;
  $('toast').style.borderColor = error ? '#d98975' : '#afba8d';
  $('toast').hidden = false;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => ($('toast').hidden = true), error ? 11000 : 4500);
}
const taskRunner = new TaskRunner({
  blocked: () => busy || stroke,
  begin: (label) => {
    busy = true;
    const inputs = ['file', 'resource-file'].map($).map((input) => [input, input.disabled]);
    for (const [input] of inputs) input.disabled = true;
    $('busy').hidden = false;
    $('busy-text').textContent = label;
    return inputs;
  },
  end: (inputs) => {
    for (const [input, disabled] of inputs) input.disabled = disabled;
    busy = false;
    $('busy').hidden = true;
  },
  notice,
});
function task(fn, label = '正在浏览器中处理…') {
  return taskRunner.run(fn, label);
}
function step(name, manual = false) {
  if (cad) return manual ? cad.openLegacy(name) : cad.enterWorkspace(name);
  for (const n of ['import', 'check', 'edit', 'save']) $('step-' + n).hidden = n !== name;
  document
    .querySelectorAll('[data-step]')
    .forEach((b) => b.classList.toggle('active', b.dataset.step === name));
}
document
  .querySelectorAll('[data-step]')
  .forEach((b) => (b.onclick = () => step(b.dataset.step, true)));
document
  .querySelectorAll('[data-next]')
  .forEach((b) => (b.onclick = () => step(b.dataset.next, true)));
function numbers(id, n = 3) {
  const values = $(id)
    .value.trim()
    .split(/[\s,，]+/)
    .map(Number);
  if (values.length !== n || values.some((v) => !Number.isInteger(v)))
    throw Error('请输入 ' + n + ' 个整数坐标');
  return values;
}
function material() {
  const Name = $('block-id').value.trim();
  if (!Name.includes(':')) throw Error('材料需要 namespace:方块ID');
  const props = $('block-properties').value.trim();
  return props ? { Name, Properties: JSON.parse(props) } : { Name };
}
let baselineSource = null,
  workspaceSource = null;
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  if (workerSession.active.worker instanceof RemoteEngineWorker)
    workerSession.dispose(workerSession.active);
  if (workerSession.staging?.slot.worker instanceof RemoteEngineWorker) workerSession.cancel();
});
async function rememberEngine() {
  const worker = workerSession.active.worker;
  if (worker instanceof RemoteEngineWorker) {
    const session = await worker.ready;
    await library.preference('engine-active', {
      key: session.key,
      projectId: active?.id || null,
      head: active?.head,
    });
  }
}
async function activateLocalEngine() {
  if (!library.desktop?.capabilities?.includes('local-engine/1')) return null;
  const record = await library.preference('engine-active'),
    oldFactory = workerSession.factory,
    old = workerSession.active;
  let initial = true;
  workerSession.factory = () => {
    const key = initial ? record?.key : null;
    initial = false;
    return new RemoteEngineWorker({
      endpoint:
        library.desktop.engineEndpoint || (library.desktop.baseUrl || '') + '/api/desktop/engine',
      token: library.desktop.token,
      key,
    });
  };
  const next = workerSession.slot();
  let session;
  try {
    session = await next.worker.ready;
  } catch (error) {
    workerSession.dispose(next);
    workerSession.factory = oldFactory;
    throw Error('本地计算服务未连接，请刷新重试：' + error.message);
  }
  workerSession.active = next;
  workerSession.dispose(old);
  await library.preference('engine-active', {
    key: session.key,
    projectId: session.restored ? record?.projectId || null : null,
    head: record?.head,
  });
  return session.restored ? record : null;
}
async function baselineRequest(request) {
  try {
    await library.open();
    const required =
      request.method === 'scene.exportStoredProject'
        ? 'checkpoint-export/1'
        : ['scene.chunkSnapshot', 'scene.readStoredChunks'].includes(request.method)
          ? 'workspace-chunks/1'
          : 'baseline-chunks/1';
    if (!library.desktop?.capabilities?.includes(required)) {
      const info = await detectDesktop();
      if (!info?.capabilities?.includes(required))
        throw Error('需要新版完整本地服务；Lite 保留文件式编辑');
      library.desktop = info;
      if (library.store?.info) library.store.info = info;
    }
    if (request.method === 'scene.exportStoredProject' && (await call('summary')).preview)
      throw Error('请先采用或取消预览再导出');
    const ref = await call('baselineReference', { cachedKey: baselineSource?.manifest?.baseKey }),
      p = request.params || {};
    if (p.expectedRevision !== undefined && p.expectedRevision !== ref.revision)
      throw Error('场景版本已变化，请重新读取');
    if (p.workspaceId && p.workspaceId !== ref.workspaceId) throw Error('工程已切换，请重新读取');
    let source = baselineSource;
    if (!source || source.manifest?.baseKey !== ref.baseKey) {
      source = new BaselineChunkSource(library);
      await source.open(ref.baseKey, ref.baseline);
      baselineSource = source;
    }
    if (
      ['scene.chunkSnapshot', 'scene.readStoredChunks', 'scene.exportStoredProject'].includes(
        request.method,
      )
    ) {
      if (!library.desktop?.capabilities?.includes('workspace-chunks/1'))
        throw Error('需要新版增量区块本地服务');
      let data = await call('workspaceCheckpoint', {
        allowDelta: (library.store?.info || library.desktop)?.capabilities?.includes(
          'workspace-delta/1',
        ),
        cachedRevision: workspaceSource?.head?.revision,
        cachedWorkspaceId: workspaceSource?.head?.workspaceId,
      });
      if (
        data.baseKey !== ref.baseKey ||
        data.workspaceId !== ref.workspaceId ||
        (p.expectedRevision !== undefined && data.revision !== p.expectedRevision)
      )
        throw Error('工程版本已变化，请重新读取');
      let current = workspaceSource;
      if (!current || current.head?.workspaceId !== data.workspaceId)
        current = new WorkspaceChunkSource(library);
      let head;
      try {
        head = await current.sync(data);
      } catch (error) {
        if (data.mode !== 'chunks' && !data.cached) throw error;
        const fresh = await call('baselineReference', {});
        if (fresh.baseKey !== ref.baseKey || fresh.workspaceId !== ref.workspaceId)
          throw Error('工程已切换，请重新读取');
        await source.open(fresh.baseKey, fresh.baseline);
        data = await call('workspaceCheckpoint', { allowDelta: false });
        if (
          data.baseKey !== ref.baseKey ||
          data.workspaceId !== ref.workspaceId ||
          (p.expectedRevision !== undefined && data.revision !== p.expectedRevision)
        )
          throw Error('工程版本已变化，请重新读取');
        head = await current.sync(data);
      }
      workspaceSource = current;
      const value =
        request.method === 'scene.exportStoredProject'
          ? await library.workspaceExport(
              head.workspaceId,
              head.revision,
              p.format || 'craftlite',
              (p.format || 'craftlite') === 'craftlite' ? await call('workspaceAssets') : null,
              p.title,
            )
          : request.method === 'scene.chunkSnapshot'
            ? head
            : {
                workspaceId: head.workspaceId,
                revision: head.revision,
                digest: head.digest,
                baseKey: head.baseKey,
                palette: head.snapshot.palette,
                size: head.snapshot.size,
                origin: head.snapshot.origin,
                items: await current.read(p.keys || []),
                coverage: source.manifest.coverage,
              };
      return {
        schema: 'craftstudio-design/1',
        id: request.id ?? null,
        ok: true,
        workspaceId: data.workspaceId,
        revision: data.revision,
        value: structuredClone(value),
      };
    }
    const value =
      request.method === 'scene.baselineManifest'
        ? source.manifest
        : {
            baseKey: ref.baseKey,
            sourceHash: source.manifest.sourceHash,
            items: await source.read(p.keys || []),
            coverage: source.manifest.coverage,
          };
    return {
      schema: 'craftstudio-design/1',
      id: request.id ?? null,
      ok: true,
      workspaceId: ref.workspaceId,
      revision: ref.revision,
      value: structuredClone(value),
    };
  } catch (error) {
    return {
      schema: 'craftstudio-design/1',
      id: request.id ?? null,
      ok: false,
      error: { code: 'BASELINE_CHUNKS_UNAVAILABLE', message: error.message },
    };
  }
}

const policy = () => ({
  allowTerrain: $('allow-terrain').checked,
  allowExisting: $('allow-existing').checked,
});
function download(bytes, name, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
function byte64(value) {
  const str = atob(value),
    bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}
function fit() {
  if (!summary) return;
  viewNavigation?.begin();
  const [w, h, l] = summary.size,
    center = new THREE.Vector3(w / 2, h / 2, l / 2),
    distance = Math.max(w, l, h) * 1.6 + 6;
  controls.target.copy(center);
  camera.position
    .copy(center)
    .add(new THREE.Vector3(distance * 0.7, distance * 0.48, distance * 0.83));
  controls.update();
  grid.position.set(w / 2 + 0.5, -0.01, l / 2 + 0.5);
  viewNavigation?.end();
}
const panelSignatures = new Map();
function panelChanged(name, value) {
  const key = JSON.stringify(value);
  if (panelSignatures.get(name) === key) return false;
  panelSignatures.set(name, key);
  return true;
}
function refresh(s, reset = false) {
  viewNavigation?.workspace(s.workspaceId);
  const refreshStarted = performanceTrace.begin();
  const initial = !summary;
  studio?.update(s);
  cad?.update(s);
  const oldMax = +$('cut').max,
    oldCut = +$('cut').value;
  summary = s;
  designerClient?.update(s);
  $('cut').max = String(s.size[1] - 1);
  $('cut').value = String(
    reset || oldCut >= oldMax ? s.size[1] - 1 : Math.min(oldCut, s.size[1] - 1),
  );
  $('scene-title').textContent = s.name;
  $('scene-meta').textContent =
    `${s.sourceSize.join(' × ')} 格真实区域 · ${s.sourceBlocks.toLocaleString()} 原始方块 · ${s.changes.toLocaleString()} 处改动`;
  $('count-add').textContent = s.add.toLocaleString();
  $('count-replace').textContent = s.replace.toLocaleString();
  $('count-remove').textContent = s.remove.toLocaleString();
  $('count-earth').textContent = (s.earth + s.water).toLocaleString();
  $('preview-banner').hidden = !s.preview;
  $('preview-info').textContent =
    `新增 ${s.add.toLocaleString()} · 替换 ${s.replace.toLocaleString()} · 拆除 ${s.remove.toLocaleString()} · 地形/水改动 ${(s.earth + s.water).toLocaleString()}`;
  $('undo').disabled = !s.undo && !s.preview && !cad?.isTransformActive();
  $('redo').disabled = !s.redo || s.preview || cad?.isTransformActive();
  $('origin-x').value = s.origin[0];
  $('origin-y').value = s.origin[1];
  $('origin-z').value = s.origin[2];
  $('origin-known').checked = s.originConfirmed;
  $('origin-evidence').textContent = s.originConfirmed
    ? '坐标基准已确定；点选与变更表会显示世界坐标。'
    : '目前只使用局部坐标，请设置世界原点后用于施工。';
  if (reset) {
    hasDocument = true;
    $('save-title').value = s.name;
  }
  if (!s.sourceBlocks && !s.changes) {
    if (initial || reset) {
      grid.visible = true;
      $('grid').classList.add('active');
      controls.target.set(4, 0, 4);
      camera.position.set(15, 10, 15);
      controls.update();
    }
  }
  if (
    panelChanged('source', [
      s.workspaceId,
      s.sourceBlocks,
      s.sourceSize,
      s.palette.length,
      s.entities,
      s.blockEntities,
      s.originConfirmed,
      s.origin,
    ])
  ) {
    $('source-summary').replaceChildren();
    for (const [label, value] of [
      ['原始文件方块', s.sourceBlocks.toLocaleString()],
      ['原始尺寸', s.sourceSize.join(' × ')],
      ['方块状态', s.palette.length],
      ['原实体数据', s.entities + ' 个（保留；展示框 / Create 可视）'],
      ['方块实体', s.blockEntities + ' 个'],
      ['坐标基准', s.originConfirmed ? s.origin.join(', ') : '局部坐标'],
    ]) {
      const d = document.createElement('div');
      d.className = 'source-row';
      const k = document.createElement('span'),
        v = document.createElement('strong');
      k.textContent = label;
      v.textContent = value;
      d.append(k, v);
      $('source-summary').append(d);
    }
  }
  if (panelChanged('protected', [s.workspaceId, s.protected]))
    $('protected-list').replaceChildren(
      ...s.protected.map((r, i) => {
        const b = document.createElement('button');
        b.className = 'full';
        b.textContent = r.name + ' · ' + r.min.join(',') + ' → ' + r.max.join(',') + ' ×';
        b.onclick = () =>
          task(async () => {
            refresh(await call('unprotect', { index: i }));
            markDirty();
          });
        return b;
      }),
    );
  if (panelChanged('materials', s.materials))
    $('materials').replaceChildren(
      ...Object.entries(s.materials)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => {
          const d = document.createElement('div');
          d.className = 'material-item';
          const a = document.createElement('span'),
            b = document.createElement('span');
          a.textContent = name;
          b.textContent = count.toLocaleString();
          d.append(a, b);
          return d;
        }),
    );
  $('resource-info').textContent = s.resources.sources.length
    ? s.resources.sources.map((s) => s.name + ' · ' + s.count + ' 资源').join('\n')
    : s.resources.embeddedModels
      ? '已载入 ' + s.resources.embeddedModels + ' 种文件内置模型；近似部分见读取报告。'
      : '可附加资源文件；未提供的模型使用轮廓预览。';
  performanceTrace.finish('ui-summary', refreshStarted);
}
async function makeTexture(key, info) {
  if (textures.has(key)) return textures.get(key);
  const t = await loadTextureInfo(info, (uri) => new THREE.TextureLoader().loadAsync(uri));
  if (!t) return null;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  if (info.tile) {
    const [x, y, w, h] = info.tile;
    t.repeat.set(w, h);
    t.offset.set(x, y);
  } else if (t.image.height > t.image.width) {
    const ratio = t.image.width / t.image.height;
    t.repeat.y = ratio;
    t.offset.y = 1 - ratio;
  }
  textures.set(key, t);
  return t;
}
function dropChunk(key) {
  const node = chunkGroups.get(key);
  if (!node) return;
  for (const m of node.children) m.geometry.dispose();
  group.remove(node);
  chunkGroups.delete(key);
}
function motionMaterial(b) {
  const key = (b.texture || 'color') + '|' + b.alpha;
  if (!materialPool.has(key)) {
    const transparent = b.alpha === 'transparent';
    materialPool.set(
      key,
      new THREE.MeshLambertMaterial({
        map: textures.get(b.texture) || null,
        vertexColors: true,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
        transparent,
        opacity: transparent ? 0.76 : 1,
        depthWrite: !transparent,
      }),
    );
  }
  const m = materialPool.get(key);
  m.clippingPlanes = [motionClip];
  return m;
}
async function syncCreate(data) {
  motionOverrides = data.overrides || {};
  motionClip.constant = +$('cut').value >= summary.size[1] - 1 ? 4096 : +$('cut').value + 1;
  if (data.reset) {
    for (const model of createModels.values()) for (const item of model) item.geometry.dispose();
    createModels.clear();
    for (const { node } of createObjects.values()) createGroup.remove(node);
    createObjects.clear();
    motionTime = 0;
  }
  await Promise.all(
    Object.entries(data.textures).map(async ([k, v]) => {
      try {
        await makeTexture(k, v);
      } catch {}
    }),
  );
  const changedModels = new Set(Object.keys(data.definitions));
  for (const [id, model] of Object.entries(data.definitions)) {
    for (const old of createModels.get(id) || []) old.geometry.dispose();
    const items = model.buckets.map((b) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(b.colors, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(b.uv, 2));
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      return { geometry, bucket: b };
    });
    createModels.set(id, items);
  }
  const live = new Set();
  for (const d of data.instances) {
    live.add(d.id);
    let object = createObjects.get(d.id);
    const motionKey = JSON.stringify(motionOverrides[d.id] || {});
    if (
      !object ||
      object.motionKey !== motionKey ||
      object.model !== d.model ||
      changedModels.has(d.model)
    ) {
      if (object) createGroup.remove(object.node);
      const node = new THREE.Group();
      for (const item of createModels.get(d.model) || []) {
        const mesh = new THREE.Mesh(item.geometry, motionMaterial(item.bucket));
        mesh.userData = { owner: d.owner, readOnly: !!d.readOnly, motion: d };
        node.add(mesh);
      }
      if (motionOverrides[d.id]?.type === 'belt') {
        const a = motionOverrides[d.id],
          width = a.max[0] - a.min[0] + 1,
          depth = a.max[2] - a.min[2] + 1;
        for (let i = 0; i < 10; i++) {
          const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.025, depth * 0.85),
            new THREE.MeshLambertMaterial({ color: 0xd4bb80 }),
          );
          stripe.userData.beltIndex = i;
          stripe.position.set(-width / 2 + (i / 10) * width, a.max[1] + 1 - a.center[1] + 0.03, 0);
          stripe.userData.owner = d.owner;
          node.add(stripe);
        }
      }
      object = { node, model: d.model, descriptor: d, motionKey };
      createObjects.set(d.id, object);
      createGroup.add(node);
    }
    object.descriptor = d;
    object.node.position.set(...d.position);
    for (const child of object.node.children) child.userData.motion = d;
  }
  for (const [id, object] of createObjects)
    if (!live.has(id)) {
      createGroup.remove(object.node);
      createObjects.delete(id);
    }
  updateMotion();
  studio?.update(summary, data.instances);
  needsRender = true;
  $('create-info').textContent =
    `${data.stats.rotatingParts} 个旋转部件 · ${data.stats.contraptions} 个装置实体 · ${data.stats.unknownSpeeds} 个速度未知` +
    (data.warnings.length ? ' · 部分部件为简化几何' : '');
  $('create-warnings')?.remove();
  if (data.warnings.length) {
    const item = document.createElement('div');
    item.id = 'create-warnings';
    item.className = 'issue';
    item.textContent = 'Create：' + data.warnings.slice(0, 5).join('；');
    $('issues').append(item);
  }
}
function updateMotion() {
  host.dataset.motionTime = motionTime.toFixed(3);
  let moving = false;
  for (const { node, descriptor: d } of createObjects.values()) {
    const a = motionOverrides[d.id],
      rpm =
        a?.rpm ??
        (d.rpm === null
          ? $('create-demo').checked
            ? Number($('create-rpm').value) || 0
            : 0
          : d.rpm);
    node.position.set(...d.position);
    node.rotation.set(0, 0, 0);
    const axis = a?.axis || d.axis;
    if (axis) {
      node.rotation[axis] =
        (((d.savedAngle || 0) +
          (a?.type === 'swing'
            ? Math.sin((motionTime * 2 * Math.PI) / (a.period || 6)) * 45
            : motionTime * rpm * 6)) *
          Math.PI) /
        180;
      if (rpm) moving = true;
    }
    if (a && ['translate', 'path', 'belt'].includes(a.type)) {
      node.rotation.set(0, 0, 0);
      const t = ((motionTime / (a.period || 6)) * rpm) / 16,
        factor = ((t % 1) + 1) % 1;
      if (a.type === 'path' && a.route?.length > 1) {
        const v = factor * a.route.length,
          i = Math.floor(v),
          from = new THREE.Vector3(...a.route[i]),
          to = new THREE.Vector3(...a.route[(i + 1) % a.route.length]);
        node.position.add(from.lerp(to, v - i));
      } else if (a.type === 'translate')
        node.position.add(
          new THREE.Vector3(...(a.travel || [0, 5, 0])).multiplyScalar(
            (1 - Math.cos(t * 2 * Math.PI)) / 2,
          ),
        );
      else if (a.type === 'belt') {
        const width = a.max?.[0] - a.min?.[0] + 1 || 1;
        for (const child of node.children)
          if (child.userData.beltIndex !== undefined)
            child.position.x = -width / 2 + ((child.userData.beltIndex / 10 + factor) % 1) * width;
      }
      if (rpm) moving = true;
    }
  }
  return moving;
}
for (const id of ['create-visible']) $(id).onchange = () => task(render, '更新机械动力模型…');
for (const id of ['create-demo', 'create-rpm'])
  $(id).oninput = () => {
    updateMotion();
    needsRender = true;
  };
$('create-play').onchange = () => {
  motionLast = 0;
  needsRender = true;
};
$('create-reset').onclick = () => {
  motionTime = 0;
  updateMotion();
  needsRender = true;
};
let viewUpdateTimer = null,
  viewUpdateRunning = false,
  viewNeedsUpdate = false,
  viewLoading = false;
function viewPlanes() {
  if (!summary || summary.sourceBlocks + summary.add < 100000) return null;
  camera.updateMatrixWorld();
  const frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
  return frustum.planes.map((p) => [p.normal.x, p.normal.y, p.normal.z, p.constant]);
}
async function updateViewport() {
  if (document.body.classList.contains('workspace-resizing')) {
    viewNeedsUpdate = true;
    return;
  }
  if (viewUpdateRunning) {
    viewNeedsUpdate = true;
    return;
  }
  viewUpdateRunning = true;
  try {
    await render(true);
  } catch (error) {
    notice('视口加载失败：' + error.message, true);
  } finally {
    viewUpdateRunning = false;
    if (viewNeedsUpdate) {
      viewNeedsUpdate = false;
      viewUpdateTimer = setTimeout(() => {
        viewUpdateTimer = null;
        updateViewport();
      }, 30);
    } else {
      viewLoading = host.dataset.viewLoadFailed === 'true';
      host.dataset.viewLoading = String(viewLoading);
    }
  }
}
function scheduleViewport() {
  if (!viewPlanes()) return;
  viewLoading = true;
  host.dataset.viewLoading = 'true';
  viewNeedsUpdate = true;
  if (document.body.classList.contains('workspace-resizing')) return;
  if (!viewUpdateTimer && !viewUpdateRunning)
    viewUpdateTimer = setTimeout(() => {
      viewUpdateTimer = null;
      viewNeedsUpdate = false;
      updateViewport();
    }, 50);
}
controls.addEventListener('change', scheduleViewport);
window.addEventListener('craftstudio-layout-resized', scheduleViewport);
let renderTail = Promise.resolve();
function render(viewportOnly = false) {
  const next = renderTail.then(() => renderNow(viewportOnly));
  renderTail = next.catch(() => {});
  return next;
}
async function renderNow(viewportOnly = false) {
  const started = performanceTrace.begin(),
    progressive = !!summary && summary.sourceBlocks + summary.add >= 100000;
  let batches = 0,
    pending = 0,
    totalUpdated = 0,
    totalMeshMs = 0,
    finished = false;
  let syncMotion = !viewportOnly || !createGroup.visible;
  if (progressive) {
    document.body.classList.add('progressive-render');
    viewLoading = true;
    host.dataset.viewLoading = 'true';
  }
  try {
    if (syncMotion) createGroup.visible = false;
    do {
      const releaseBatch = [...releasedTextures];
      const result = await call('meshChunks', {
        releasedTextures: releaseBatch,
        ...(progressive ? { chunkBudget: 8, viewFocus: controls.target.toArray() } : {}),
        viewPlanes: viewPlanes(),
        mode,
        cut: +$('cut').value,
        plants: $('plants').checked,
        showGround: $('ground').checked,
        showExisting: $('existing').checked,
        excludeWholeKinetics: $('create-visible').checked,
      });
      for (const key of releaseBatch) releasedTextures.delete(key);
      for (const key of result.evicted || []) dropChunk(key);
      if (result.resetTextures) {
        clearTextures();
        createGroup.visible = false;
        syncMotion = true;
      }
      if (result.reset) for (const key of [...chunkGroups.keys()]) dropChunk(key);
      await Promise.all(
        Object.entries(result.textures).map(async ([k, v]) => {
          try {
            await makeTexture(k, v);
          } catch {}
        }),
      );
      for (const chunk of result.chunks) {
        dropChunk(chunk.key);
        if (!chunk.buckets.length) continue;
        const node = new THREE.Group();
        node.userData.chunk = chunk.key;
        for (const b of chunk.buckets) {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
          g.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
          g.setAttribute('color', new THREE.BufferAttribute(b.colors, 3));
          g.setAttribute('uv', new THREE.BufferAttribute(b.uv, 2));
          g.computeBoundingSphere();
          g.computeBoundingBox();
          const key = (b.texture || 'color') + '|' + b.alpha;
          if (!materialPool.has(key)) {
            const transparent = b.alpha === 'transparent' || b.alpha === 'deleted';
            materialPool.set(
              key,
              new THREE.MeshLambertMaterial({
                map: textures.get(b.texture) || null,
                vertexColors: true,
                side: THREE.DoubleSide,
                alphaTest: 0.1,
                transparent,
                opacity: b.alpha === 'deleted' ? 0.65 : transparent ? 0.76 : 1,
                depthWrite: !transparent,
              }),
            );
          }
          node.add(new THREE.Mesh(g, materialPool.get(key)));
        }
        chunkGroups.set(chunk.key, node);
        group.add(node);
      }
      needsRender = true;
      pickBox.visible = false;
      $('cut-text').textContent =
        +$('cut').value >= summary.size[1] - 1
          ? '全部'
          : summary.originConfirmed
            ? '世界 Y ≤ ' + (summary.origin[1] + +$('cut').value)
            : '局部 Y ≤ ' + $('cut').value;
      pending = result.stats.pending || 0;
      batches++;
      totalUpdated += result.stats.chunks;
      totalMeshMs += result.stats.meshMs;
      $('mesh-status').textContent = pending
        ? '场景逐步载入 · 已显示 ' + result.stats.resident + ' 区，剩余 ' + pending + ' 区'
        : (result.reset ? '场景加载' : '局部更新') +
          ' ' +
          result.stats.chunks +
          ' 区 · ' +
          Math.round(result.stats.meshMs) +
          ' ms';
      host.dataset.pendingChunks = pending;
      host.dataset.meshBatches = batches;
      host.dataset.triangles = result.triangles;
      host.dataset.updatedChunks = totalUpdated;
      host.dataset.meshMs = totalMeshMs;
      host.dataset.lastBatchMs = result.stats.meshMs;
      host.dataset.residentChunks = result.stats.resident;
      host.dataset.totalChunks = result.stats.total;
      host.dataset.sourceMode = result.stats.source?.mode || 'memory';
      host.dataset.sourceResidentChunks = result.stats.source?.residentChunks ?? '';
      host.dataset.sourceTotalChunks = result.stats.source?.totalChunks ?? '';
      if (result.reset || !pending)
        $('issues').replaceChildren(
          ...[
            ...new Set([
              ...(summary.warnings || []),
              ...result.issues,
              '实体原始数据保留；已适配的 Create 装置单独显示，展示框和挂画作轮廓预览；普通生物与未适配运动行为仍不绘制。',
            ]),
          ]
            .slice(0, 120)
            .map((text) => {
              const d = document.createElement('div');
              d.className = 'issue';
              d.textContent = text;
              return d;
            }),
        );
      performanceTrace.record('mesh-batch-applied', {
        batch: batches,
        pending,
        updatedChunks: result.stats.chunks,
        residentChunks: result.stats.resident,
      });
      if (!pending && syncMotion) {
        await syncCreate(
          await call('createScene', {
            enabled: $('create-visible').checked,
            mode,
            cut: +$('cut').value,
            showExisting: $('existing').checked,
          }),
        );
        createGroup.visible = true;
      }
      const released = pruneGraphics({
        textures,
        materials: materialPool,
        roots: [scene],
        pinnedTextureKeys: [...createModels.values()].flatMap((model) =>
          model.map((item) => item.bucket.texture).filter(Boolean),
        ),
      });
      for (const key of released.releasedTextures) releasedTextures.add(key);
      host.dataset.residentTextures = textures.size;
      host.dataset.residentMaterials = materialPool.size;
      if (pending) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        continue;
      }
      performanceTrace.finish('scene-ready', started, {
        viewportOnly,
        meshMs: totalMeshMs,
        updatedChunks: totalUpdated,
        residentChunks: result.stats.resident,
        residentTextures: textures.size,
        residentMaterials: materialPool.size,
        releasedTextures: released.releasedTextures.length,
        batches,
      });
      needsRender = true;
    } while (pending);
    finished = true;
    host.dataset.viewLoadFailed = 'false';
  } finally {
    document.body.classList.remove('progressive-render');
    if (!finished && progressive) {
      host.dataset.viewLoadFailed = 'true';
      viewLoading = true;
      host.dataset.viewLoading = 'true';
      $('mesh-status').textContent = '部分场景未载入，转动视角重试';
    } else if (!viewUpdateRunning && !viewNeedsUpdate) {
      viewLoading = false;
      host.dataset.viewLoading = 'false';
    }
  }
}
const drafts = new DraftController({
  library,
  call,
  baselineRequest,
  captureForm: () => captureSaveForm($),
  context: () => ({
    summary,
    active,
    available: storageOK,
    blocked: !!stroke || busy,
    remote: workerSession.active.worker instanceof RemoteEngineWorker,
  }),
  status: (message) => {
    $('storage-status').textContent = message;
  },
  unavailable: () => {
    storageOK = false;
  },
});
function markDirty() {
  hasDocument = true;
  drafts.markDirty();
}
for (const id of ['save-title', 'save-tags', 'save-note'])
  $(id).addEventListener('input', () => {
    if (summary && storageOK) markDirty();
  });
$('save-kind').addEventListener('change', () => {
  if (summary && storageOK) markDirty();
});

async function checkpoint() {
  if (!hasDocument || (!drafts.dirty && active) || summary?.preview) return;
  if (!storageOK) throw Error('当前设计尚未保存，请先下载完整工程，再切换场景');
  if (!active) {
    const bytes = await exporter.projectBytes($('save-title').value || summary.name);
    active = await library.save(bytes, {
      title: $('save-title').value || summary.name,
      kind: 'project',
      tags: ['导入前自动保留'],
      blocks: summary.sourceBlocks + summary.add - summary.remove,
      size: summary.size,
    });
  }
  await drafts.persist();
  if (!storageOK || drafts.dirty)
    throw Error('当前设计草稿尚未保存，请重试或下载完整工程后再切换场景');
}
const sampleButton = document.createElement('button');
sampleButton.id = 'provided-demo';
sampleButton.hidden = !__EXAMPLE__;
sampleButton.className = 'full primary';
sampleButton.textContent = '直接打开已验证的双住宅 3D 工程';
sampleButton.onclick = () =>
  task(async () => {
    await checkpoint();
    if (!__EXAMPLE__) throw Error('样例尚未打包');
    const data = byte64(__EXAMPLE__);
    await imported(
      await call('import', { name: '双住宅.craftlite', bytes: data.buffer }, [data.buffer]),
    );
    step('edit');
    camera.position.set(125, 60, 103);
    controls.target.set(93, 32, 59);
    controls.update();
    notice('两座住宅、真实地形、构件与风车动画已载入；点击对象名称可近看');
  }, '打开双住宅 3D 工程…');
$('provided-source').hidden = !__SOURCE__;
$('provided-plan').hidden = !__REFERENCE__.html;
$('provided-source').after(sampleButton);
for (const [key, label] of [
  ['rebuild', '打开 Sakura V3 · 完整接口复建'],
  ['redesign', '打开 Sakura · 自由拱顶改造'],
]) {
  const button = document.createElement('button');
  button.id = 'trial-' + key;
  button.hidden = !__TRIALS__[key];
  button.className = 'full';
  button.textContent = label;
  button.onclick = () =>
    task(async () => {
      await checkpoint();
      if (!__TRIALS__[key]) throw Error('验证工程尚未打包');
      const bytes = byte64(__TRIALS__[key]);
      await imported(
        await call('import', { name: label + '.craftlite', bytes: bytes.buffer }, [bytes.buffer]),
      );
      step('edit');
      window.CraftStudio.setView({ position: [145, 97, 151], target: [64, 39, 64], fov: 45 });
      notice(
        key === 'rebuild'
          ? '完整蓝图通过自由接口施工；包含真实原地形'
          : '浴厅石拱与玻璃采光顶为新的自由设计；可以继续改造',
      );
    }, '打开复杂建筑 3D 工程…');
  sampleButton.after(button);
}

async function imported(data, reset = true) {
  active = null;
  referenceInfo = null;
  chooseTool('inspect');
  clearTextures();
  refresh(data, reset);
  if (reset) {
    $('save-tags').value = '';
    $('save-note').value = '';
    $('save-kind').value = 'project';
    restoreSaveForm($, data.saveForm);
  }
  mode = 'after';
  document
    .querySelectorAll('[data-mode]')
    .forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  await render();
  fit();
  viewNavigation?.reset();
  markDirty();
  step('check');
}
const importer = new ProjectImporter({
  describe: () => call('api', { method: 'workspace.describe' }),
  checkpoint,
  call,
  remote: () => workerSession.active.worker instanceof RemoteEngineWorker,
  region: () => ({ min: numbers('mca-min'), max: numbers('mca-max') }),
  imported,
  reference: async (data) => {
    refresh(data);
    await render();
    step('save');
  },
  notice,
});
function openFile(file) {
  return importer.open(file);
}
$('file').onchange = () => {
  const file = $('file').files[0];
  $('file').value = '';
  if (file) task(() => openFile(file), '正在读取文件并建立真实场地…');
};
const drop = $('dropzone');
drop.ondragover = (e) => {
  e.preventDefault();
  drop.classList.add('dragging');
};
drop.ondragleave = () => drop.classList.remove('dragging');
drop.ondrop = (e) => {
  e.preventDefault();
  drop.classList.remove('dragging');
  task(() => openFile(e.dataTransfer.files[0]), '正在读取拖入的文件…');
};
$('provided-source').onclick = () =>
  task(async () => {
    await checkpoint();
    const data = byte64(__SOURCE__);
    await call('assets', { pack: __REFERENCE__.assets });
    await imported(await call('import', { name: '1.nbt', bytes: data.buffer }, [data.buffer]));
    notice('已导入你提供的真实场地：520,227 个原始方块。');
  }, '正在解析你提供的真实地形…');
$('provided-plan').onclick = () =>
  task(async () => {
    if (!summary?.sourceBlocks) throw Error('先打开你提供的 1.nbt 场地');
    const s = await call('reference', { html: __REFERENCE__.html });
    referenceInfo = s.reference;
    refresh(s);
    await render();
    fit();
    step('save');
    notice('参考方案已预览；采用前可检查土方和原建筑改动。');
  }, '正在对照原场地验证 V3 的 34,593 条变更…');
$('reference-file').onchange = () =>
  task(async () => {
    const f = $('reference-file').files[0];
    if (!f) return;
    const s = await call('reference', { html: await f.text() });
    referenceInfo = s.reference;
    refresh(s);
    await render();
    fit();
    step('save');
    notice('参考 HTML 的结构数据已读入，没有执行文件脚本。');
  });
$('resource-file').onchange = () =>
  task(async () => {
    const files = [];
    for (const file of $('resource-file').files)
      files.push({ name: file.name, bytes: await file.arrayBuffer() });
    if (!files.length) return;
    if (resourcePanel) await resourcePanel.add(files);
    else {
      refresh(await call('resources', { files }));
      clearTextures();
      await render();
      markDirty();
      notice('资源已用于当前工程；本地缓存暂不可用');
    }
    $('resource-file').value = '';
  }, '读取并保存资源…');
document.querySelectorAll('[data-mode]').forEach(
  (b) =>
    (b.onclick = () =>
      task(async () => {
        mode = b.dataset.mode;
        document
          .querySelectorAll('[data-mode]')
          .forEach((x) => x.classList.toggle('active', x === b));
        await render();
      })),
);
$('fit').onclick = fit;
$('top').onclick = () => {
  if (!summary) return;
  const [w, h, l] = summary.size;
  controls.target.set(w / 2, h / 2, l / 2);
  camera.position.set(w / 2, h / 2 + Math.max(w, l) * 1.5, l / 2 + 0.01);
  controls.update();
};
let savedWorldGrid = null;
window.addEventListener('craftstudio-workplane-grid', (e) => {
  if (e.detail.active) {
    if (savedWorldGrid === null) savedWorldGrid = grid.visible;
    grid.visible = false;
    $('grid').textContent = '工作网格';
    $('grid').classList.toggle('active', e.detail.visible);
  } else {
    if (savedWorldGrid !== null) grid.visible = savedWorldGrid;
    savedWorldGrid = null;
    $('grid').textContent = '网格';
    $('grid').classList.toggle('active', grid.visible);
  }
  needsRender = true;
});
$('grid').onclick = () => {
  if (cad?.hasWorkplaneGrid()) {
    cad.toggleWorkplaneGrid();
    return;
  }
  grid.visible = !grid.visible;
  needsRender = true;
  $('grid').classList.toggle('active', grid.visible);
};
for (const id of ['plants', 'ground', 'existing']) $(id).onchange = () => task(render);
$('cut').oninput = () => {
  clearTimeout(render.timer);
  render.timer = setTimeout(() => task(render, '正在重建真实地层剖面…'), 180);
};
let spaceHeld = false;
function setNavigation() {
  controls.mouseButtons.LEFT = spaceHeld ? THREE.MOUSE.ROTATE : null;
  renderer.domElement.style.cursor = spaceHeld
    ? 'grab'
    : tool === 'inspect'
      ? 'default'
      : 'crosshair';
}
function chooseTool(value) {
  if (studio?.isWalking()) studio.exitWalk(false);
  if (stroke) releaseStroke();
  tool = value;
  document
    .querySelectorAll('[data-tool]')
    .forEach((b) => b.classList.toggle('active', b.dataset.tool === value));
  setNavigation();
  cad?.toolChanged(value);
  brushPreview.visible = false;
  needsRender = true;
  if (value !== 'inspect' && ['before', 'removed'].includes(mode)) {
    mode = 'after';
    document
      .querySelectorAll('[data-mode]')
      .forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    task(render, '切换到可编辑方案…');
  }
}
document
  .querySelectorAll('[data-tool]')
  .forEach((b) => (b.onclick = () => chooseTool(b.dataset.tool)));
async function edit(operations, extraPolicy = {}) {
  refresh(await call('edit', { operations, policy: { ...policy(), ...extraPolicy } }));
  await render();
  markDirty();
}
for (const id of ['undo', 'redo'])
  $(id).onclick = () => {
    if (cad?.handleHistory(id)) return;
    if (summary?.preview) {
      if (id === 'undo') $('cancel').click();
      else notice('请先采用或取消提案预览');
      return;
    }
    task(async () => {
      refresh(await call(id));
      await render();
      markDirty();
    });
  };
$('fill').onclick = () =>
  task(() =>
    edit([{ type: 'fill', min: numbers('edit-min'), max: numbers('edit-max'), state: material() }]),
  );
$('erase-region').onclick = () =>
  task(() => edit([{ type: 'erase', min: numbers('edit-min'), max: numbers('edit-max') }]));
$('set-origin').onclick = () =>
  task(async () => {
    refresh(
      await call('origin', {
        origin: [+$('origin-x').value, +$('origin-y').value, +$('origin-z').value],
        confirmed: $('origin-known').checked,
      }),
    );
    await render();
    markDirty();
  });
$('add-protect').onclick = () =>
  task(async () => {
    const min = numbers('protect-min'),
      max = numbers('protect-max');
    if (min.some((v, a) => v < 0 || v > max[a])) throw Error('保留区坐标范围无效');
    refresh(await call('protect', { min, max, name: $('protect-name').value }));
    markDirty();
  });
$('platform').onclick = () =>
  task(async () => {
    const s = await call('platform', {
      min: numbers('platform-min', 2),
      max: numbers('platform-max', 2),
      y: +$('platform-y').value,
      spacing: +$('platform-spacing').value,
      state: material(),
    });
    refresh(s);
    await render();
    notice('平台预览：最长支撑 ' + s.platformDepth + ' 格，下探到实际地面。');
  });
$('accept').onclick = () =>
  task(async () => {
    refresh(await call('accept', { policy: policy(), proposalId: summary?.proposal?.id }));
    await render();
    markDirty();
    notice('方案已采用；原始场地仍可随时对照。');
  });
$('cancel').onclick = () =>
  task(async () => {
    refresh(await call('cancel', { proposalId: summary?.proposal?.id }));
    await render();
  });
let lastDown,
  stroke = null,
  hoverHit = null,
  hoverEvent = null,
  hoverFrame = 0;
const ray = new THREE.Raycaster(),
  mouse = new THREE.Vector2();
const brushPreview = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0x477b49, transparent: true, opacity: 0.9 }),
);
brushPreview.visible = false;
scene.add(brushPreview);
function cast(e) {
  const r = renderer.domElement.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
    return null;
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const pickStarted = performanceTrace.begin(),
    hit = ray.intersectObjects([...group.children, ...createGroup.children], true)[0];
  performanceTrace.finish('scene-pick', pickStarted, { residentChunks: group.children.length });
  if (hit) return hit;
  if (summary?.sourceBlocks === 0) {
    const point = ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Vector3(),
    );
    if (point && point.x >= 0 && point.z >= 0 && point.x < 4096 && point.z < 4096)
      return {
        point,
        face: { normal: new THREE.Vector3(0, 1, 0) },
        object: {
          matrixWorld: new THREE.Matrix4(),
          userData: { owner: [Math.floor(point.x), 0, Math.floor(point.z)], plane: true },
        },
      };
  }
  return null;
}
function hitCell(hit, placing = false) {
  const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld),
    p = hit.point.clone().addScaledVector(n, -0.0001),
    pos = hit.object.userData.owner
      ? [...hit.object.userData.owner]
      : [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)],
    axis = [0, 1, 2].reduce(
      (a, b) => (Math.abs(n.getComponent(b)) > Math.abs(n.getComponent(a)) ? b : a),
      0,
    );
  if (placing && !hit.object.userData.plane) pos[axis] += Math.sign(n.getComponent(axis));
  return { pos, axis };
}
function diameter() {
  return tool === 'place' ? 1 : +$('brush-size').value;
}
function showBrush(pos, axis) {
  brushPreview.position.set(...pos.map((v) => v + 0.5));
  brushPreview.scale.set(...[0, 1, 2].map((a) => (a === axis ? 1 : diameter())));
  brushPreview.visible = tool !== 'inspect' && tool !== 'sample' && !spaceHeld;
  needsRender = true;
}
function strokePoint(e) {
  const r = renderer.domElement.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
    return null;
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, (-(e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const point = new THREE.Vector3();
  if (!ray.ray.intersectPlane(stroke.plane, point)) return null;
  let pos = point.toArray().map(Math.floor);
  pos[stroke.axis] = stroke.start[stroke.axis];
  if (pos.some((n) => !Number.isFinite(n) || n < 0 || n >= 4096)) return null;
  if (e.shiftKey) pos = constrainLine(stroke.start, pos, stroke.axis);
  return pos;
}
function stamp(pos) {
  if (!stroke || stroke.ended) return;
  const path = stroke.last ? lineCells(stroke.last, pos) : [pos];
  for (const center of path)
    for (const p of brushCells(center, stroke.axis, stroke.diameter, stroke.shape)) {
      const key = p.join(',');
      if (!stroke.seen.has(key)) {
        stroke.seen.add(key);
        stroke.pending.set(key, p);
      }
    }
  stroke.last = pos;
  performanceTrace.record('brush-stamp', {
    axis: stroke.axis,
    diameter: stroke.diameter,
    pendingCells: stroke.pending.size,
    visitedCells: stroke.seen.size,
  });
  showBrush(pos, stroke.axis);
  scheduleFlush();
}
function scheduleFlush(delay = 25) {
  if (!stroke || stroke.timer || stroke.inFlight) return;
  stroke.timer = setTimeout(() => {
    if (stroke) {
      stroke.timer = null;
      flushStroke();
    }
  }, delay);
}
async function flushStroke() {
  const s = stroke;
  if (!s || s.inFlight) return;
  if (!s.pending.size) {
    if (s.ended) await finishStroke(s);
    return;
  }
  s.inFlight = true;
  const points = [...s.pending.values()].slice(0, 512);
  for (const p of points) s.pending.delete(p.join(','));
  try {
    const start = await s.started;
    const mask = { ...s.mask };
    if (mask.matchPicked) {
      if (!start.from) throw Error('起笔处没有可匹配材料');
      mask.matchName = start.from;
    }
    delete mask.matchPicked;
    const result = await call('brush', {
      points,
      mode: s.mode,
      state: s.state,
      mask,
      retainShape: s.retainShape,
      preserveProperties: s.preserveProperties,
      policy: { ...s.policy, skipLocked: true },
    });
    s.filtered += result.filtered || 0;
    for (const w of result.toolWarnings || []) s.warnings.add(w);
    s.skipped += result.skipped || 0;
    refresh(result);
    await render();
    markDirty();
  } catch (error) {
    notice(error.message, true);
    s.pending.clear();
    s.ended = true;
  } finally {
    s.inFlight = false;
  }
  if (stroke !== s) return;
  if (s.pending.size) scheduleFlush(0);
  else if (s.ended) await finishStroke(s);
}
async function finishStroke(s) {
  if (stroke !== s || s.finishing) return;
  s.finishing = true;
  try {
    await s.started;
    await call('endStroke');
  } finally {
    stroke = null;
    controls.enabled = true;
    setNavigation();
    if (s.skipped || s.filtered || s.warnings.size)
      notice(
        '本笔跳过 ' +
          s.skipped +
          ' 个保护位置、' +
          s.filtered +
          ' 个不匹配位置。' +
          [...s.warnings].join('；') +
          ' 有效改动可一次撤销。',
      );
    drafts.schedule(1200);
  }
}
function releaseStroke(e) {
  if (!stroke || (e && e.pointerId !== stroke.pointer)) return;
  stroke.ended = true;
  controls.enabled = true;
  setNavigation();
  try {
    renderer.domElement.releasePointerCapture(stroke.pointer);
  } catch {}
  if (!stroke.inFlight) {
    if (stroke.timer) {
      clearTimeout(stroke.timer);
      stroke.timer = null;
    }
    flushStroke();
  }
}
renderer.domElement.addEventListener(
  'pointerdown',
  (e) => {
    performanceTrace.record('pointer-input', { button: e.button });
    lastDown = { x: e.clientX, y: e.clientY, button: e.button };
    if (cad?.isTransformActive()) return;
    if (viewLoading && e.button === 0 && !['inspect', 'sample'].includes(tool) && !spaceHeld) {
      notice('视口几何正在载入，请稍后编辑');
      return;
    }
    if (
      e.button !== 0 ||
      tool === 'inspect' ||
      tool === 'sample' ||
      spaceHeld ||
      e.altKey ||
      busy ||
      !summary
    )
      return;
    if (stroke) {
      e.preventDefault();
      return;
    }
    if (summary.preview) {
      notice('请先采用或取消预览再使用画笔');
      return;
    }
    const hit = cast(e);
    if (!hit) return;
    if (hit.object.userData.readOnly) {
      notice('运动装置按实体保存，当前只读；请编辑其源结构或控制器。');
      return;
    }
    try {
      const config = cad?.brushConfig(),
        paintExisting = tool === 'paint' && config?.mode === 'paint';
      if (paintExisting && hit.object.userData.plane) {
        notice('涂改需要已有方块表面');
        return;
      }
      const placing = tool !== 'erase' && !paintExisting,
        { pos, axis: pickedAxis } = hitCell(hit, placing),
        axis =
          tool === 'place' || paintExisting
            ? pickedAxis
            : brushPlaneAxis(pickedAxis, ray.ray.direction.toArray(), config?.plane);
      if (axis !== pickedAxis) {
        const base = hitCell(hit, false).pos;
        for (let a = 0; a < 3; a++) pos[a] = base[a];
        if (placing) pos[axis] += Math.sign(-ray.ray.direction.getComponent(axis));
      }
      if (tool !== 'place' && config?.mask.inSelection && !cad.hasSelection()) {
        notice('请先选择要作用的对象或区域');
        return;
      }
      if (pos.some((v) => v < 0 || v >= 4096)) return;
      const n = new THREE.Vector3();
      n.setComponent(axis, 1);
      const mask = { ...config?.mask };
      delete mask.inSelection;
      const isolatedBounds = summary?.view?.editBounds;
      if (
        tool === 'place' &&
        isolatedBounds &&
        pos.some((n, a) => n < isolatedBounds.min[a] || n > isolatedBounds.max[a])
      ) {
        notice('当前点在局部画笔范围外；退出隔离后可编辑整体场景');
        return;
      }
      if (isolatedBounds) mask.limitBounds = isolatedBounds;
      if (config?.mask.inSelection) mask.selection = structuredClone(studio.getSelection());
      stroke = {
        mode: tool === 'erase' ? 'erase' : tool === 'place' ? 'place' : config?.mode || 'draw',
        mask: tool === 'place' ? (isolatedBounds ? { limitBounds: isolatedBounds } : {}) : mask,
        retainShape: config?.retainShape,
        preserveProperties: config?.preserveProperties,
        filtered: 0,
        warnings: new Set(),
        single: tool === 'place',
        pointer: e.pointerId,
        axis,
        start: pos,
        last: null,
        plane: new THREE.Plane(n, -(pos[axis] + 0.5)),
        state: tool === 'erase' ? null : material(),
        erase: tool === 'erase',
        diameter: diameter(),
        shape: $('brush-shape').value,
        policy: policy(),
        pending: new Map(),
        seen: new Set(),
        skipped: 0,
        ended: false,
        inFlight: false,
        started: call('beginStroke', { anchor: pos }),
      };
      controls.enabled = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      renderer.domElement.focus({ preventScroll: true });
      renderer.domElement.setPointerCapture(e.pointerId);
      stamp(pos);
    } catch (error) {
      stroke = null;
      controls.enabled = true;
      notice(error.message, true);
    }
  },
  true,
);
renderer.domElement.addEventListener('pointermove', (e) => {
  if (stroke) {
    if (!stroke.single) {
      if (stroke.mode === 'paint') {
        const hit = cast(e);
        if (hit && !hit.object.userData.readOnly && !hit.object.userData.plane) {
          const { pos, axis } = hitCell(hit, false);
          stroke.axis = axis;
          stamp(pos);
        }
      } else {
        const pos = strokePoint(e);
        if (pos) stamp(pos);
      }
    }
    return;
  }
  if (busy || spaceHeld || e.buttons) return;
  hoverEvent = e;
  if (hoverFrame) return;
  hoverFrame = requestAnimationFrame(() => {
    hoverFrame = 0;
    if (!hoverEvent || busy) return;
    const hit = cast(hoverEvent);
    hoverHit = hit;
    if (hit && tool !== 'inspect') {
      const { pos, axis } = hitCell(
        hit,
        tool === 'place' || (tool === 'paint' && cad?.brushConfig().mode !== 'paint'),
      );
      showBrush(pos, axis);
    } else {
      brushPreview.visible = false;
      needsRender = true;
    }
  });
});
renderer.domElement.addEventListener(
  'pointerup',
  (e) => {
    if (stroke) {
      releaseStroke(e);
      return;
    }
    if (cad?.isTransformActive()) return;
    if (
      busy ||
      !summary ||
      !lastDown ||
      lastDown.button !== 0 ||
      spaceHeld ||
      Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) > 5 ||
      !['inspect', 'sample'].includes(tool)
    )
      return;
    const hit = cast(e);
    if (!hit || hit.object.userData.plane) {
      cad?.clearSelection();
      return;
    }
    if (tool === 'sample') {
      if (hit.object.userData.readOnly && !hit.object.userData.owner) {
        notice('请从素材库选择这类装置的方块');
        return;
      }
      const { pos } = hitCell(hit);
      call('inspect', { pos })
        .then((d) => {
          const state = d.after || d.before;
          if (state) {
            $('block-id').value = state.Name;
            $('block-properties').value = state.Properties ? JSON.stringify(state.Properties) : '';
            cad?.assets.selectState(state);
            cad?.materialChanged(state);
            chooseTool('place');
            notice('已取材，可直接放置');
          }
        })
        .catch((e) => notice(e.message, true));
      return;
    }
    if (hit.object.userData.readOnly) {
      cad?.clearSelection();
      const d = hit.object.userData.motion;
      $('pick-panel').hidden = false;
      $('pick-coords').textContent = '运动装置';
      $('pick-details').textContent =
        '结构 · ' +
        d.blockCount +
        ' 个内部方块 · ' +
        (d.rpm === null ? '速度未知' : d.rpm + ' RPM');
      $('pick-ground').textContent =
        '转轴 ' +
        (d.axis || '未提供') +
        ' · 保存角度 ' +
        d.savedAngle.toFixed(2) +
        '° · 原始装置数据保留';
      return;
    }
    if (cad?.pickObject(e, hit)) return;
    const { pos } = hitCell(hit);
    selected = pos;
    studio?.selectRange(
      { min: pos, max: pos },
      e.ctrlKey ? 'subtract' : e.shiftKey ? 'add' : $('cad-selection-mode').value,
    );
    call('inspect', { pos })
      .then((details) => {
        pickBox.visible = true;
        pickBox.position.set(...pos.map((v) => v + 0.5));
        needsRender = true;
        $('pick-panel').hidden = false;
        $('pick-coords').textContent = details.world
          ? '世界 ' + details.world.join(', ')
          : '局部 ' + pos.join(', ');
        const before = document.createElement('div'),
          after = document.createElement('div'),
          reason = document.createElement('div');
        before.className = 'old';
        after.className = 'new';
        before.textContent =
          '原有：' +
          (details.before
            ? cad
              ? cad.materialName(details.before)
              : JSON.stringify(details.before)
            : '空气');
        after.textContent =
          '目标：' +
          (details.after
            ? cad
              ? cad.materialName(details.after)
              : JSON.stringify(details.after)
            : '空气');
        reason.textContent = details.reason;
        $('pick-details').className = 'before-after';
        $('pick-details').replaceChildren(before, after, reason);
        $('pick-ground').textContent =
          '这一列原地面：' +
          (details.column.ground ?? '无数据') +
          ' · 原水面：' +
          (details.column.water ?? '无') +
          ' · 方块实体：' +
          (details.nbt ? '保留原始数据' : '无');
        $('edit-min').value = pos.join(' ');
        $('edit-max').value = pos.join(' ');
      })
      .catch((e) => notice(e.message, true));
  },
  true,
);
renderer.domElement.addEventListener('pointercancel', releaseStroke, true);
renderer.domElement.addEventListener('pointerleave', () => {
  if (!stroke) {
    brushPreview.visible = false;
    needsRender = true;
  }
});
$('pick-close').onclick = () => {
  $('pick-panel').hidden = true;
  pickBox.visible = false;
  needsRender = true;
};
window.addEventListener('craftstudio-brush-settings', () => {
  if (hoverHit && !stroke) {
    const { pos, axis } = hitCell(
      hoverHit,
      tool === 'place' || (tool === 'paint' && cad?.brushConfig().mode !== 'paint'),
    );
    showBrush(pos, axis);
  }
});
for (const id of ['brush-size', 'brush-shape'])
  $(id).onchange = () => {
    if (hoverHit) {
      const { pos, axis } = hitCell(
        hoverHit,
        tool === 'place' || (tool === 'paint' && cad?.brushConfig().mode !== 'paint'),
      );
      showBrush(pos, axis);
    }
  };
window.addEventListener('blur', () => {
  spaceHeld = false;
  releaseStroke();
  setNavigation();
});
$('block-search').oninput = () => {
  clearTimeout(search.timer);
  search.timer = setTimeout(search, 250);
};
async function search() {
  try {
    const items = await call('search', { query: $('block-search').value });
    $('block-list').replaceChildren(
      ...items.map((item) => {
        const b = document.createElement('button');
        b.className = 'block-item';
        b.textContent = item.label + ' · ' + item.id;
        b.onclick = () => {
          $('block-id').value = item.id;
          $('block-properties').value = item.state?.Properties
            ? JSON.stringify(item.state.Properties)
            : '';
        };
        return b;
      }),
    );
  } catch (e) {
    notice(e.message, true);
  }
}

const exporter = new ProjectExporter({
  library,
  call,
  baselineRequest,
  refresh,
  context: () => ({ summary, title: $('save-title').value }),
  selection: () => cad?.exportSelection(),
});
async function save(copy = false) {
  if (summary?.preview) throw Error('请先采用或取消预览');
  if (!storageOK) throw Error('本地数据库不可用，可下载完整工程文件');
  const snapshot = structuredClone(summary),
    epoch = drafts.epoch,
    projectId = active?.id || null,
    info = {
      id: copy ? null : active?.id,
      head: copy ? undefined : active?.head,
      title: $('save-title').value || snapshot.name,
      tags: $('save-tags')
        .value.split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      kind: $('save-kind').value,
      note: $('save-note').value,
      blocks: snapshot.sourceBlocks + snapshot.add - snapshot.remove,
      size: [...snapshot.size],
    },
    bytes = await exporter.projectBytes(info.title, {
      workspaceId: snapshot.workspaceId,
      expectedRevision: snapshot.revision,
    });
  if (summary?.workspaceId !== snapshot.workspaceId || (active?.id || null) !== projectId)
    throw Error('工程已切换，本次保存未写入工程库');
  active = await library.save(bytes, info);
  await rememberEngine();
  refresh(await call('summary'));
  if ($('save-note').value === info.note) $('save-note').value = '';
  await drafts.persist();
  const pending = cad?.isTransformActive() ? '；当前预览尚未确认，未写入工程' : '',
    changed =
      drafts.epoch !== epoch
        ? drafts.dirty || !storageOK
          ? '；保存期间还有新的改动，尚未保存'
          : '；保存期间的新改动已保留为草稿，尚未成为正式版本'
        : '';
  if (pending || changed) $('storage-status').textContent += pending + changed;
  notice(
    '已保存到' +
      (library.desktop ? 'SQLite 工程库' : '浏览器本地工程库') +
      ' · v' +
      active.head +
      pending +
      changed,
  );
  return {
    projectId: active.id,
    version: active.head,
    workspaceId: snapshot.workspaceId,
    revision: snapshot.revision,
    unconfirmedPreview: !!pending,
    laterEdits: drafts.epoch !== epoch,
    draftSaved: storageOK && !drafts.dirty,
  };
}
for (const id of ['quick-save', 'save-version']) $(id).onclick = () => task(() => save());
$('save-copy').onclick = () => task(() => save(true));
projectExportUI({ $, task, exporter, download, notice });
async function listLibrary() {
  const f = $('library-filter').value,
    items = await library.list({
      query: $('library-query').value,
      favorite: f === 'favorite',
      deleted: f === 'trash',
    });
  $('library-list').replaceChildren(
    ...items.map((item) => {
      const card = document.createElement('article');
      card.className = 'library-card';
      const h = document.createElement('h3'),
        p = document.createElement('p');
      h.textContent = item.title;
      p.textContent = `${item.tags.map((t) => '#' + t).join(' ')} · v${item.head} · ${item.blocks.toLocaleString()} 方块`;
      card.append(h, p);
      const row = document.createElement('div');
      row.className = 'row';
      const add = (text, fn) => {
        const b = document.createElement('button');
        b.textContent = text;
        b.onclick = () => task(fn);
        row.append(b);
      };
      if (item.deleted)
        add('恢复', async () => {
          await library.update(item.id, { deleted: false });
          await listLibrary();
        });
      else {
        add('打开', () => openSaved(item.id));
        if (item.kind === 'component')
          add('插入当前场景', async () => {
            const data = await library.get(item.id);
            refresh(
              await call('studio', {
                command: 'component',
                bytes: data.entry.bytes,
                at: selected || numbers('studio-at'),
                policy: policy(),
              }),
            );
            await render();
            markDirty();
            $('library-dialog').close();
            step('edit');
          });
        add(item.favorite ? '★' : '☆', async () => {
          await library.update(item.id, { favorite: !item.favorite });
          await listLibrary();
        });
        add('移入回收站', async () => {
          await library.update(item.id, { deleted: true });
          await listLibrary();
        });
        const details = document.createElement('details'),
          s = document.createElement('summary');
        s.textContent = '历史版本';
        details.append(s);
        details.ontoggle = async () => {
          if (!details.open || details.dataset.loaded) return;
          for (const v of await library.versions(item.id)) {
            const b = document.createElement('button');
            b.className = 'version';
            b.textContent = 'v' + v.number + ' · ' + (v.note || new Date(v.time).toLocaleString());
            b.onclick = () => task(() => openSaved(item.id, v.number));
            details.append(b);
          }
          details.dataset.loaded = '1';
        };
        card.append(details);
      }
      card.append(row);
      return card;
    }),
  );
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = '还没有匹配的工程。保存后，可以在这里再次打开。';
    $('library-list').append(p);
  }
}
async function openSaved(id, version) {
  await checkpoint();
  const data = await library.get(id, version),
    draft = version ? null : await library.resume('draft:' + id);
  let s;
  if (draft) s = await call('resume', draft);
  else {
    const bytes = data.entry.bytes.slice();
    s = await call('import', { name: 'stored.craftlite', bytes: bytes.buffer }, [bytes.buffer]);
  }
  active = data.item;
  await rememberEngine();
  clearTextures();
  refresh(s, true);
  $('save-title').value = active.title;
  $('save-tags').value = active.tags.join(', ');
  $('save-kind').value = active.kind;
  $('save-note').value = '';
  if (draft) restoreSaveForm($, s.saveForm);
  await render();
  fit();
  viewNavigation?.reset();
  $('library-dialog').close();
  step('edit');
  markDirty();
  notice(draft ? '已恢复这个工程的编辑草稿' : '已读取本地工程版本 v' + data.entry.number);
}
$('open-library').onclick = () =>
  task(async () => {
    if (!storageOK) throw Error('浏览器本地存储不可用，请导入下载的工程文件');
    await listLibrary();
    $('library-dialog').showModal();
  });
for (const id of ['library-query', 'library-filter']) $(id).oninput = () => listLibrary();
document
  .querySelectorAll('[data-close]')
  .forEach((b) => (b.onclick = () => $(b.dataset.close).close()));
$('library-backup').onclick = () =>
  task(async () => {
    const backup = await library.backup(),
      files = {};
    for (const table of ['versions', 'sessions', 'bases'])
      backup[table] = backup[table].map((row, i) => {
        const r = { ...row };
        for (const key of ['bytes'])
          if (r[key]) {
            const name = table + '/' + i + '.bin';
            files[name] = new Uint8Array(r[key]);
            r[key] = { file: name };
          }
        return r;
      });
    files['library.json'] = strToU8(JSON.stringify(encodeLocal(backup)));
    download(zipSync(files, { level: 1 }), 'CraftStudio-Lite-工程库.craftlib');
    notice('工程库备份已下载。');
  });
$('library-restore').onchange = () =>
  task(async () => {
    const file = $('library-restore').files[0];
    if (!file) return;
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer())),
      backup = decodeLocal(JSON.parse(strFromU8(entries['library.json'])));
    for (const table of ['versions', 'sessions', 'bases'])
      for (const row of backup[table] || [])
        if (row.bytes?.file) {
          if (!entries[row.bytes.file]) throw Error('备份文件不完整');
          row.bytes = entries[row.bytes.file];
        }
    await checkpoint();
    await library.restore(backup);
    await listLibrary();
    notice('工程库备份已导入；原有当前设计保留。');
  });
let aiViews = [];
const viewButton = document.createElement('button');
viewButton.textContent = '将当前 3D 视角附给 AI';
viewButton.onclick = () => {
  renderer.render(scene, camera);
  aiViews.push(renderer.domElement.toDataURL('image/png'));
  aiViews = aiViews.slice(-4);
  notice('已记录 ' + aiViews.length + ' 个现场视角，调用 AI 时一起发送');
};
$('ai-prompt').after(viewButton);
$('ai-open').onclick = () => $('ai-dialog').showModal();
$('copy-context').onclick = () =>
  task(async () => {
    const context = await call('context', { prompt: $('ai-prompt').value, focus: selected });
    const text =
      '请依据真实场地设计，输出结构操作 JSON，不能编造山坡。\n' + JSON.stringify(context);
    try {
      await navigator.clipboard.writeText(text);
      notice('场地约束已复制，可交给外部 AI。');
    } catch {
      download(text, 'AI-场地设计请求.txt', 'text/plain');
      notice('浏览器未开放剪贴板，已下载请求文件。');
    }
  });
function proposal(text) {
  let s = text.trim();
  if (s.startsWith('```')) s = s.slice(s.indexOf('\n') + 1).replace(/```\s*$/, '');
  const p = JSON.parse(s);
  if (!Array.isArray(p.operations)) throw Error('AI JSON 需要 operations 数组');
  return p;
}
$('ai-preview').onclick = () =>
  task(async () => {
    cad?.cancelOperations();
    const s = await call('preview', { operations: proposal($('ai-json').value).operations });
    refresh(s);
    await render();
    $('ai-dialog').close();
    notice('AI 提案已叠加到真实场地预览。');
  });
$('ai-call').onclick = () =>
  task(async () => {
    const url = $('ai-url').value.trim().replace(/\/$/, ''),
      parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname))
      throw Error('请使用 HTTPS 接口或本地服务');
    const context = await call('context', { prompt: $('ai-prompt').value, focus: selected });
    let response;
    try {
      response = await fetch(url + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + $('ai-key').value,
        },
        body: JSON.stringify({
          model: $('ai-model').value,
          messages: [
            {
              role: 'system',
              content:
                'Return JSON {operations:[...]}. Operations: set(pos,state), fill(min,max,state), erase(min,max), replace(from,state), build(kind,params), insertPrefab(id,at,turn,mirror,count,step), restyle(id,from,state). Preserve terrain, rivers, existing structures and protected zones. All coordinates are LOCAL integer coordinates. Existing palette is a reference, not a whitelist. You may use any valid namespace:block ID and block properties. All generators are optional; free voxel construction is the foundation.',
            },
            {
              role: 'user',
              content: aiViews.length
                ? [
                    { type: 'text', text: JSON.stringify(context) },
                    ...aiViews.map((url) => ({ type: 'image_url', image_url: { url } })),
                  ]
                : JSON.stringify(context),
            },
          ],
        }),
      });
    } catch {
      throw Error('接口未能连接，可能不允许浏览器跨域。可复制请求给外部 AI，再粘贴结果。');
    }
    if (!response.ok) throw Error('AI 接口返回 HTTP ' + response.status);
    const r = await response.json();
    $('ai-json').value = r.choices[0].message.content;
    notice('结构提案已返回，点击预览检查现场变更。');
  }, '等待你配置的 AI 服务…');
window.addEventListener('keydown', (e) => {
  if (dialogOwnsKeyboard()) {
    if ((e.ctrlKey || e.metaKey) && ['s', 'o'].includes(e.key.toLowerCase())) e.preventDefault();
    return;
  }
  if (e.defaultPrevented || e.isComposing) return;
  if (textEditing(document.activeElement)) return;
  if (e.code === 'Space') {
    if (nativeSpaceTarget(document.activeElement)) return;
    e.preventDefault();
    spaceHeld = true;
    setNavigation();
    brushPreview.visible = false;
    needsRender = true;
    return;
  }
  const history = historyShortcut(e);
  if (history) {
    e.preventDefault();
    if (!cad?.handleHistory(history)) $(history).click();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || sceneShortcutBlocked(document.activeElement)) return;
  const key = e.key.toLowerCase();
  if (summary?.preview && key === 'escape') {
    e.preventDefault();
    $('cancel').click();
    return;
  }
  if (summary?.preview && key === 'enter') {
    e.preventDefault();
    $('accept').click();
    return;
  }
  if (key === 'f') {
    if (!cad?.zoomSelection()) fit();
  }
  if (key === 'v' || key === 'escape') chooseTool('inspect');
  if (key === 'b') chooseTool('paint');
  if (key === 'p') chooseTool('place');
  if (key === 'x') chooseTool('erase');
  if (key === '[' || key === ']') {
    e.preventDefault();
    const values = [1, 3, 5, 7, 9],
      index = values.indexOf(+$('brush-size').value);
    $('brush-size').value = values[Math.max(0, Math.min(4, index + (key === ']' ? 1 : -1)))];
    $('brush-size').onchange();
  }
  if (key === 'e' && hoverHit) {
    const { pos } = hitCell(hoverHit);
    call('inspect', { pos })
      .then((d) => {
        const state = d.after || d.before;
        if (state) {
          $('block-id').value = state.Name;
          $('block-properties').value = state.Properties ? JSON.stringify(state.Properties) : '';
          cad?.assets.selectState(state);
          cad?.materialChanged(state);
          notice('已取材：' + (cad ? cad.materialName(state) : state.Name));
        }
      })
      .catch((e) => notice(e.message, true));
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    spaceHeld = false;
    setNavigation();
  }
});
window.addEventListener('beforeunload', (e) => {
  if (drafts.dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && drafts.dirty) drafts.autosave();
});
const bridgePanel = document.createElement('details');
bridgePanel.className = 'card';
bridgePanel.innerHTML =
  '<summary>连接本地 Minecraft 施工（可选）</summary><p class="small">通过完整版本地服务连接已安装的桥接 Mod；只提交已确认改动。纯文件模式仍可导出蓝图。</p><label>游戏桥接令牌<input id="lite-bridge-token" type="password" autocomplete="off"></label><label>维度<input id="lite-bridge-dimension" value="minecraft:overworld"></label><label class="check"><input id="lite-bridge-overwrite" type="checkbox">允许替换游戏中的目标方块</label><div class="row"><button id="lite-bridge-health">检查连接</button><button id="lite-bridge-build">建造已确认改动</button><button id="lite-bridge-undo">撤销上次施工</button></div><pre id="lite-bridge-result" class="small"></pre>';
$('step-save').append(bridgePanel);
async function liteBridge(action, payload = {}) {
  if (
    !['127.0.0.1', 'localhost'].includes(location.hostname) ||
    !/^https?:$/.test(location.protocol)
  )
    throw Error('请用启动建筑工作台.cmd 打开本地服务，再连接游戏施工');
  const bootstrap = await detectDesktop();
  if (!bootstrap?.token) throw Error('当前页面是静态服务器，请使用完整版本地服务');
  const response = await fetch((bootstrap.baseUrl || '') + '/api/lite/bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CraftStudio-Token': bootstrap.token },
    body: JSON.stringify({ action, token: $('lite-bridge-token').value, payload }),
  });
  const result = await response.json();
  if (!response.ok || result.error) throw Error(result.error || '施工连接失败');
  $('lite-bridge-result').textContent = JSON.stringify(result, null, 2);
  return result;
}
$('lite-bridge-health').onclick = () => task(() => liteBridge('health'));
$('lite-bridge-undo').onclick = () => task(() => liteBridge('undo'));
$('lite-bridge-build').onclick = () =>
  task(async () => {
    const project = await call('buildProject');
    let job = await liteBridge('apply', {
      project,
      origin: project.origin,
      dimension: $('lite-bridge-dimension').value,
      overwrite: $('lite-bridge-overwrite').checked,
    });
    while (['queued', 'building'].includes(job.status)) {
      await new Promise((r) => setTimeout(r, 700));
      job = await liteBridge('job', { id: job.id });
    }
    if (job.status !== 'completed') throw Error(job.error || '建造未完成');
    notice('施工完成，已回读验证 ' + job.verifiedStates + ' 个方块');
  }, '正在游戏中放置并回读改动…');
window.addEventListener('craftstudio-space-review-start', () => chooseTool('inspect'));
studio = studioUI({
  THREE,
  $,
  call,
  task,
  refresh,
  render,
  markDirty,
  policy,
  numbers,
  scene,
  camera,
  getCamera: () => camera,
  controls,
  renderer,
  notice,
  fit,
  getSummary: () => summary,
  getSelected: () => selected,
  download,
  library,
  requestRender: () => (needsRender = true),
});
cad = cadShell({
  THREE,
  $,
  call,
  library,
  prepareIntentPersistence: async () => {
    await drafts.persist();
    if (!storageOK || drafts.dirty) throw Error('工程草稿尚未保存，暂存只保留在当前会话');
    return await call('toolContext');
  },
  notice,
  download,
  chooseTool,
  task,
  refresh,
  render,
  markDirty,
  policy,
  studio,
  renderer,
  cast,
  hitCell,
  getSummary: () => summary,
  projectPoint: (pos) => new THREE.Vector3(...pos).project(camera),
  scene,
  getCamera: () => camera,
  navigation: (enabled) => (controls.enabled = enabled),
  requestRender: () => (needsRender = true),
});
renderer.domElement.addEventListener(
  'pointerdown',
  (e) => {
    if (e.button === 1)
      controls.mouseButtons.MIDDLE = e.shiftKey ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
  },
  true,
);
newProjectUI({ $, task, openFile, notice });
viewNavigation = viewNavigationUI({
  $,
  controls,
  getView: () => window.CraftStudio.viewState(),
  setView: (v) => window.CraftStudio.setView(v),
  isBlocked: () => busy || !!stroke || !controls.enabled,
  notice,
});
task(async () => {
  try {
    await library.open();
    storageOK = true;
    const restoredEngine = await activateLocalEngine();
    resourceManager = new ResourceLibrary(library, call);
    await resourceManager.load();
    resourcePanel = resourceUI({
      $,
      library,
      resources: resourceManager,
      task,
      refresh,
      render,
      clearTextures,
      markDirty,
      notice,
    });
    refresh(await resourceManager.apply());
    designerClient = designerClientUI({
      $,
      info: library.desktop,
      page: window.CraftStudio,
      context: () => summary,
      blocked: () => busy || !!stroke,
    });
    if (library.desktop) {
      desktopUI({
        info: library.desktop,
        $,
        task,
        openFile,
        call,
        imported,
        refresh,
        render,
        markDirty,
        notice,
        clearTextures,
        checkpoint,
        addResources: (files) => resourcePanel.add(files),
      });
      gameUI({
        info: library.desktop,
        $,
        call,
        task,
        imported,
        checkpoint,
        notice,
        getSummary: () => summary,
      });
      if (library.migrationError)
        notice('SQLite 可用；浏览器工程库迁入未完成：' + library.migrationError, true);
    }
    const draft = restoredEngine ? null : await library.resume();
    if (restoredEngine) {
      const s = await call('summary');
      if (restoredEngine.projectId)
        try {
          active = (await library.get(restoredEngine.projectId)).item;
          if (Number.isInteger(restoredEngine.head)) active.head = restoredEngine.head;
        } catch {
          active = null;
        }
      await rememberEngine();
      refresh(s, true);
      if (active) {
        $('save-title').value = active.title;
        $('save-tags').value = active.tags.join(', ');
        $('save-kind').value = active.kind;
      }
      restoreSaveForm($, await library.preference('save-form:' + s.workspaceId));
      await render();
      fit();
      viewNavigation?.reset();
      step('edit');
      notice('已恢复最后确认的本地场景。');
    } else if (draft) {
      const s = await call('resume', draft);
      if (draft.projectId) {
        try {
          active = (await library.get(draft.projectId)).item;
        } catch {
          active = null;
        }
      }
      await rememberEngine();
      refresh(s, true);
      if (active) {
        $('save-title').value = active.title;
        $('save-tags').value = active.tags.join(', ');
        $('save-kind').value = active.kind;
      }
      restoreSaveForm($, s.saveForm);
      await render();
      fit();
      viewNavigation?.reset();
      step('edit');
      notice(library.desktop ? '已恢复上次 SQLite 场景。' : '已恢复上次浏览器本地场景。');
    } else {
      refresh(await call('summary'));
      $('scene-title').textContent = '先导入真实场地';
    }
    $('storage-status').textContent = library.desktop
      ? '本地工程库已就绪 · SQLite 保存'
      : '本地工程库已就绪 · 当前浏览器保存';
  } catch (e) {
    storageOK = false;
    refresh(await call('summary'));
    $('storage-status').textContent = '存储连接未完成：' + e.message;
    notice('可以编辑与导出；存储连接失败：' + e.message, true);
  } finally {
    viewNavigation?.reset();
  }
}, '正在准备纯前端工作台…');
