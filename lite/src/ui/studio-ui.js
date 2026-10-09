import { PrefabBrowser } from '../components/prefab-browser.js';
import viewMarkup0 from './views/studio-ui-panel.html';
import { reviewLook } from '../view/review-look.js';
import { dialogOwnsKeyboard, nativeControlTarget } from './keyboard-context.js';
import { normalizeView } from '../view/saved-views.js';
import { coords } from '../core/site.js';
import { combineSelection } from '../selection/selection-mask.js';
export function studioUI({
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
  getCamera = () => camera,
  controls,
  renderer,
  notice,
  fit,
  getSummary,
  getSelected,
  download,
  library,
  requestRender,
}) {
  const panel = document.createElement('details');
  panel.id = 'studio-panel';
  panel.className = 'card';
  panel.open = true;
  panel.innerHTML = viewMarkup0;
  $('step-edit').append(panel);
  const views = document.createElement('details');
  views.id = 'studio-views';
  views.className = 'card';
  views.innerHTML = `<summary>现场体验与方案比较</summary><label>环境<select id="studio-light"><option value="day">白天</option><option value="sunset">黄昏</option><option value="night">夜晚</option></select></label><div class="row"><button id="studio-view-save">收藏当前视角</button><button id="studio-walk">进入漫游</button></div><p class="small">空间浏览：连续 WASD 按视线移动、Q/E 升降、Shift 加速；右键原地观察，Enter 保留视角退出，Esc 返回原视角。不模拟游戏碰撞。</p><div id="studio-cameras"></div><div class="row"><button id="studio-a">记为方案 A</button><button id="studio-b">记为方案 B</button></div><div class="row"><button id="studio-show-a">同视角看 A</button><button id="studio-show-b">同视角看 B</button></div><p class="small">比较保留当前相机。A/B 临时快照请分别保存正式版本。</p>`;
  $('step-check').append(views);
  const outline = new THREE.Box3Helper(new THREE.Box3(), 0xf5bd52);
  outline.visible = false;
  scene.add(outline);
  let uiSignature = '',
    objectSignature = '',
    selectedStart = null,
    motion = [],
    walk = false,
    drag = null,
    a = null,
    b = null;
  const regionOutlines = new THREE.Group();
  scene.add(regionOutlines);
  let selectionMembers = null,
    selectionRegions = null,
    selectionSnapshot = null;
  const range = () => ({
    min: numbers('studio-min'),
    max: numbers('studio-max'),
    ...(selectionRegions ? { regions: selectionRegions } : {}),
  });
  const at = () => numbers('studio-at');
  function clearRegionOutlines() {
    for (const node of [...regionOutlines.children]) {
      node.geometry.dispose();
      node.material.dispose();
      regionOutlines.remove(node);
    }
  }
  function memberOutline(members, color) {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.012, 1.012, 1.012)),
      geometry = new THREE.InstancedBufferGeometry(),
      offsets = new Float32Array(members.length * 3);
    geometry.setAttribute('position', edges.getAttribute('position'));
    for (let i = 0; i < members.length; i++) {
      const p = Array.isArray(members[i]) ? members[i] : coords(members[i]);
      offsets.set(
        p.map((n) => n + 0.5),
        i * 3,
      );
    }
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.instanceCount = members.length;
    const material = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(color) } },
        vertexShader:
          'attribute vec3 offset; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position+offset,1.0);}',
        fragmentShader: 'uniform vec3 color; void main(){gl_FragColor=vec4(color,1.0);}',
        depthTest: false,
        depthWrite: false,
      }),
      node = new THREE.LineSegments(geometry, material);
    node.frustumCulled = false;
    node.renderOrder = 5;
    regionOutlines.add(node);
  }
  function showRange() {
    clearRegionOutlines();
    if (selectionRegions?.length)
      for (const r of selectionRegions) {
        if (selectionRegions.length === 1 && !r.members) continue;
        const color =
          r.operation === 'subtract' ? 0xee7168 : r.operation === 'intersect' ? 0xb795e8 : 0x72c5e0;
        if (r.members) {
          memberOutline(r.members, color);
          continue;
        }
        const box = new THREE.Box3(
            new THREE.Vector3(...r.min),
            new THREE.Vector3(...r.max.map((n) => n + 1)),
          ),
          node = new THREE.Box3Helper(box, color);
        regionOutlines.add(node);
      }
    const r = range();
    outline.box.min.set(...r.min);
    outline.box.max.set(...r.max.map((v) => v + 1));
    outline.visible = true;
    controls.update();
    requestRender();
  }
  const prefabBrowser = new PrefabBrowser({
    root: $('studio-prefabs'),
    place: (prefab) =>
      window.dispatchEvent(
        new CustomEvent('craftstudio-prefab-drop', { detail: { prefab, at: at() } }),
      ),
    exportFile: (prefab) =>
      download(
        JSON.stringify(prefab),
        (prefab.name || '构件') + '.craftprefab',
        'application/json',
      ),
    importFile: () => $('studio-prefab-file').click(),
    create: () => window.dispatchEvent(new Event('craftstudio-prefab-create')),
    save: (metadata) =>
      task(async () => {
        await command({ command: 'prefabMeta', ...metadata });
        notice('构件名称与分类已保存到当前工程');
      }, '保存构件信息…'),
  });
  async function command(data) {
    if (['transform', 'prefab', 'register', 'deleteSelection'].includes(data.command)) {
      if (selectionMembers) data.members = selectionMembers;
      if (selectionRegions) data.regions = selectionRegions;
    }
    refresh(await call('studio', { ...data, policy: policy() }));
    markDirty();
    showRange();
    if (!['prefabImport', 'prefabMeta', 'prefab'].includes(data.command)) await render();
  }
  $('studio-drag').onchange = () => {
    if ($('studio-drag').checked) document.querySelector('[data-tool="inspect"]').click();
  };
  $('studio-select').onclick = () =>
    task(async () =>
      selectRange(
        { min: numbers('studio-min'), max: numbers('studio-max') },
        $('cad-selection-mode')?.value || 'replace',
      ),
    );
  for (const [id, move] of [
    ['studio-copy', false],
    ['studio-move', true],
  ])
    $(id).onclick = () =>
      task(() =>
        command({
          command: 'transform',
          ...range(),
          at: at(),
          move,
          turn: +$('studio-turn').value,
          mirror: $('studio-mirror').checked,
          count: +$('studio-count').value,
          step: numbers('studio-step'),
        }),
      );
  $('studio-register').onclick = () =>
    task(() => command({ command: 'register', ...range(), name: $('studio-name').value }));
  $('studio-prefab').onclick = () =>
    task(() => command({ command: 'prefab', ...range(), name: $('studio-name').value }));
  $('studio-prefab-library').onclick = () =>
    task(async () => {
      const bytes = await call('prefabPackage', {
        ...range(),
        members: selectionMembers,
        name: $('studio-name').value,
      });
      await library.save(bytes, {
        title: $('studio-name').value,
        kind: 'component',
        tags: ['构件'],
        blocks: 1,
        size: [1, 1, 1],
      });
      notice('已保存到本地构件库，其他工程可从工程库插入');
    });
  $('studio-prefab-file').onchange = () => {
    const file = $('studio-prefab-file').files[0];
    $('studio-prefab-file').value = '';
    if (file)
      task(
        async () => command({ command: 'prefabImport', prefab: JSON.parse(await file.text()) }),
        '读取构件文件…',
      );
  };
  $('studio-build').onclick = () =>
    task(() => {
      const [width, depth, height] = numbers('studio-size');
      return command({
        command: 'build',
        kind: $('studio-kind').value,
        params: {
          at: at(),
          width,
          depth,
          height,
          name: $('studio-name').value,
          state: { Name: $('block-id').value },
          roof: { Name: $('studio-roof').value },
        },
      });
    });
  $('studio-demo').onclick = () =>
    task(async () => {
      await command({ command: 'demo' });
      fit();
      notice('两座住宅已落在真实地形上，原山坡和河水保持不变。');
    }, '寻找真实空地并建造两座住宅…');
  $('studio-crop').onclick = () =>
    task(async () => {
      download(
        await call('compressed', { title: getSummary().name }),
        getSummary().name + '-裁切前.craftlite',
      );
      await command({ command: 'crop', ...range() });
      fit();
      notice('已下载完整场地备份，并建立裁切场地。');
    });
  $('studio-merge').onchange = () =>
    task(async () => {
      const f = $('studio-merge').files[0];
      if (f)
        await command({
          command: 'merge',
          bytes: await f.arrayBuffer(),
          name: f.name,
          at: at(),
          applyAir: $('studio-merge-air').checked,
        });
    });
  $('studio-animation').onclick = () =>
    task(async () => {
      const id = $('studio-motion-target').value,
        o = getSummary().design.objects.find((o) => o.id === id),
        animation = {
          type: $('studio-motion-type').value,
          axis: $('studio-axis').value,
          rpm: +$('studio-rpm').value,
          travel: numbers('studio-travel'),
          period: +$('studio-period').value,
          route: JSON.parse($('studio-route').value || '[]'),
        };
      if (animation.route.some((p) => p.length !== 3 || p.some((n) => !Number.isFinite(n))))
        throw Error('路线应为三维坐标数组');
      if (!id || !Number.isFinite(animation.rpm) || !(animation.period > 0))
        throw Error('请选择对象并输入有效速度和周期');
      if (o) {
        const old = getSummary().design.animations[id];
        animation.min = old?.min || o.min;
        animation.max = old?.max || o.max;
        animation.center = old?.center || o.min.map((n, a) => (n + o.max[a] + 1) / 2);
      }
      await command({ command: 'animation', id, animation });
      notice('运动参数已写入工程，开启机械动力播放即可预览。');
    });
  function lighting(value) {
    const sun = scene.children.find((o) => o.isDirectionalLight),
      ambient = scene.children.find((o) => o.isHemisphereLight);
    sun.intensity = value === 'night' ? 0.15 : value === 'sunset' ? 1.2 : 2.3;
    sun.color.set(value === 'sunset' ? 0xffa56b : 0xffe6c5);
    ambient.intensity = value === 'night' ? 0.55 : 2;
    for (const l of scene.children.filter((o) => o.userData?.designLight))
      l.intensity = value === 'night' ? 7 : value === 'sunset' ? 3 : 0;
    renderer.setClearColor(value === 'night' ? 0x18243b : value === 'sunset' ? 0xd5a69a : 0xbdcbc5);
    requestRender();
  }
  $('studio-light').onchange = () =>
    task(async () => {
      lighting($('studio-light').value);
      await command({ command: 'lighting', value: $('studio-light').value });
    });
  $('studio-view-save').onclick = () =>
    task(() =>
      command({
        command: 'camera',
        camera: {
          name: '视角 ' + (getSummary().design.cameras.length + 1),
          position: getCamera().position.toArray(),
          target: controls.target.toArray(),
        },
      }),
    );
  const reviewBar = document.createElement('div');
  reviewBar.id = 'space-review-bar';
  reviewBar.hidden = true;
  reviewBar.innerHTML =
    '<strong>空间浏览</strong><span>WASD 按视线移动 · Q/E 升降 · Shift 加速 · 右键原地观察 · Enter 保留视角 · 不模拟碰撞</span><button id="space-review-keep">保留当前视角并退出</button><button id="space-review-exit">退出并返回原视角 · Esc</button>';
  $('scene').before(reviewBar);
  let reviewView = null,
    reviewLimits = null,
    reviewFrame = null,
    reviewTime = null,
    reviewDrag = null;
  const reviewKeys = new Set();
  function finishReviewLook() {
    if (!reviewDrag) return;
    const id = reviewDrag.id;
    reviewDrag = null;
    try {
      renderer.domElement.releasePointerCapture(id);
    } catch {}
  }
  renderer.domElement.addEventListener(
    'pointerdown',
    (event) => {
      if (!walk || event.button !== 2 || dialogOwnsKeyboard()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finishReviewLook();
      reviewDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    },
    true,
  );
  renderer.domElement.addEventListener(
    'pointermove',
    (event) => {
      if (!walk || !reviewDrag || event.pointerId !== reviewDrag.id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const dx = event.clientX - reviewDrag.x,
        dy = event.clientY - reviewDrag.y;
      reviewDrag.x = event.clientX;
      reviewDrag.y = event.clientY;
      const camera = getCamera(),
        eye = camera.position.clone(),
        forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const direction = reviewLook(forward.toArray(), camera.up.toArray(), dx, dy);
      controls.target.copy(eye).add(new THREE.Vector3(...direction).multiplyScalar(2));
      controls.update();
      camera.position.copy(eye);
      requestRender();
    },
    true,
  );
  renderer.domElement.addEventListener(
    'pointerup',
    (event) => {
      if (!reviewDrag || event.pointerId !== reviewDrag.id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      finishReviewLook();
    },
    true,
  );
  for (const name of ['pointercancel', 'lostpointercapture'])
    renderer.domElement.addEventListener(name, finishReviewLook);
  function leaveReview(restore = true) {
    if (!walk) return;
    walk = false;
    finishReviewLook();
    reviewKeys.clear();
    cancelAnimationFrame(reviewFrame);
    reviewFrame = null;
    controls.minDistance = reviewLimits.min;
    controls.maxDistance = reviewLimits.max;
    reviewBar.hidden = true;
    $('studio-walk').textContent = '进入空间浏览';
    if (restore && reviewView) window.CraftStudio.setView(reviewView);
    reviewView = null;
    renderer.domElement.focus({ preventScroll: true });
    requestRender();
  }
  function reviewTick(time) {
    if (!walk) return;
    const dt = reviewTime === null ? 0 : Math.min(0.05, (time - reviewTime) / 1000);
    reviewTime = time;
    if (!dialogOwnsKeyboard() && !nativeControlTarget(document.activeElement)) {
      const camera = getCamera(),
        forward = new THREE.Vector3(),
        side = new THREE.Vector3(),
        delta = new THREE.Vector3();
      camera.getWorldDirection(forward);
      side.setFromMatrixColumn(camera.matrixWorld, 0);
      if (reviewKeys.has('KeyW')) delta.add(forward);
      if (reviewKeys.has('KeyS')) delta.sub(forward);
      if (reviewKeys.has('KeyA')) delta.sub(side);
      if (reviewKeys.has('KeyD')) delta.add(side);
      if (reviewKeys.has('KeyQ')) delta.y--;
      if (reviewKeys.has('KeyE')) delta.y++;
      if (delta.lengthSq()) {
        delta
          .normalize()
          .multiplyScalar(
            dt * (reviewKeys.has('ShiftLeft') || reviewKeys.has('ShiftRight') ? 9 : 3),
          );
        camera.position.add(delta);
        controls.target.add(delta);
        controls.update();
        requestRender();
      }
    }
    reviewFrame = requestAnimationFrame(reviewTick);
  }
  $('studio-walk').textContent = '进入空间浏览';
  $('studio-walk').onclick = () => {
    if (walk) {
      leaveReview();
      return;
    }
    if (getSummary()?.preview) {
      notice('请先采用或取消 AI 提案');
      return;
    }
    window.dispatchEvent(new Event('craftstudio-space-review-start'));
    reviewView = window.CraftStudio.viewState();
    reviewLimits = { min: controls.minDistance, max: controls.maxDistance };
    const camera = getCamera(),
      forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    window.CraftStudio.setView({
      ...reviewView,
      projection: 'perspective',
      target: camera.position.toArray().map((n, a) => n + forward.getComponent(a) * 2),
    });
    walk = true;
    controls.maxDistance = 4;
    controls.minDistance = 1;
    controls.update();
    reviewBar.hidden = false;
    $('studio-walk').textContent = '退出空间浏览';
    renderer.domElement.focus({ preventScroll: true });
    reviewTime = null;
    reviewFrame = requestAnimationFrame(reviewTick);
  };
  $('space-review-exit').onclick = () => leaveReview();
  $('space-review-keep').onclick = () => leaveReview(false);
  window.addEventListener(
    'keydown',
    (event) => {
      if (
        !walk ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        dialogOwnsKeyboard()
      )
        return;
      if (
        event.key === 'Escape' &&
        (!nativeControlTarget(document.activeElement) ||
          document.activeElement === $('space-review-exit') ||
          document.activeElement === $('space-review-keep'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        leaveReview();
        return;
      }
      if (nativeControlTarget(document.activeElement)) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        leaveReview(false);
        return;
      }
      if (
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(
          event.code,
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        reviewKeys.add(event.code);
      }
    },
    true,
  );
  window.addEventListener('keyup', (event) => reviewKeys.delete(event.code));
  window.addEventListener('blur', () => {
    reviewKeys.clear();
    finishReviewLook();
  });
  document.addEventListener('focusin', (event) => {
    if (nativeControlTarget(event.target)) reviewKeys.clear();
  });

  for (const [id, key] of [
    ['studio-a', 'a'],
    ['studio-b', 'b'],
  ])
    $(id).onclick = () =>
      task(async () => {
        const p = await call('package');
        if (key === 'a') a = p;
        else b = p;
        notice('已记录方案 ' + key.toUpperCase());
      });
  for (const [id, key] of [
    ['studio-show-a', 'a'],
    ['studio-show-b', 'b'],
  ])
    $(id).onclick = () =>
      task(async () => {
        const p = key === 'a' ? a : b;
        if (!p) throw Error('请先记录这个方案');
        refresh(await call('load', { package: p }));
        await render();
        markDirty();
      });
  function picked(pos, shift) {
    selectionSnapshot = null;
    selectionRegions = null;
    selectionMembers = null;
    if (!shift || !selectedStart) selectedStart = pos;
    const min = pos.map((n, a) => Math.min(n, selectedStart[a])),
      max = pos.map((n, a) => Math.max(n, selectedStart[a]));
    $('studio-min').value = min.join(' ');
    $('studio-max').value = max.join(' ');
    $('studio-at').value = min.join(' ');
    selectionSnapshot = { min, max };
    showRange();
    window.dispatchEvent(new Event('craftstudio-selection'));
  }
  function selectRange(incoming, operation = 'replace') {
    const current = outline.visible
      ? selectionSnapshot || { ...range(), members: selectionMembers }
      : null;
    if (!current && ['subtract', 'intersect'].includes(operation)) {
      notice('请先选择基础范围，再减去或取交集');
      return;
    }
    const r = combineSelection(current, incoming, operation);
    selectionSnapshot = r;
    selectionMembers = r.members || null;
    selectionRegions = r.regions;
    $('studio-min').value = r.min.join(' ');
    $('studio-max').value = r.max.join(' ');
    $('studio-at').value = r.min.join(' ');
    showRange();
    window.dispatchEvent(new Event('craftstudio-selection'));
  }
  function update(summary, instances = motion) {
    if (walk && reviewBar.dataset.workspace !== summary.workspaceId) leaveReview(false);
    reviewBar.dataset.workspace = summary.workspaceId;
    motion = instances;
    prefabBrowser.update(summary.design?.prefabs || [], summary.workspaceId);
    const signature = JSON.stringify([
      summary.workspaceId,
      summary.design?.objects,
      summary.design?.prefabs.map((p) => [p.id, p.name, p.blocks.length]),
      summary.design?.cameras,
      summary.design?.animations,
      summary.design?.lighting,
      instances.map((d) => [d.id, d.model, d.state?.Name]),
    ]);
    if (signature === uiSignature) return;
    uiSignature = signature;
    for (const l of [...scene.children].filter((o) => o.userData?.designLight)) scene.remove(l);
    for (const o of summary.design?.objects || []) {
      if (o.hidden) continue;
      const lamp = new THREE.PointLight(
        0xffc979,
        summary.design.lighting === 'night' ? 7 : 0,
        22,
        1,
      );
      lamp.userData.designLight = true;
      lamp.position.set((o.min[0] + o.max[0]) / 2, o.min[1] + 5, (o.min[2] + o.max[2]) / 2);
      scene.add(lamp);
    }
    const d = summary.design || { objects: [], prefabs: [], cameras: [], animations: {} };
    lighting(d.lighting || 'day');
    $('studio-light').value = d.lighting || 'day';
    const prev = $('studio-motion-target').value;
    $('studio-motion-target').replaceChildren(
      ...[
        ...d.objects.map((o) => ({ id: o.id, name: o.name })),
        ...instances
          .filter((o) => !d.objects.some((d) => d.id === o.id))
          .map((o) => ({ id: o.id, name: o.state.Name + ' ' + (o.owner || o.position).join(',') })),
      ].map((o) => {
        const e = document.createElement('option');
        e.value = o.id;
        e.textContent = o.name;
        return e;
      }),
    );
    if ([...$('studio-motion-target').options].some((o) => o.value === prev))
      $('studio-motion-target').value = prev;
    const objectKey = JSON.stringify([summary.workspaceId, d.objects]);
    if (objectKey !== objectSignature) {
      objectSignature = objectKey;
      $('studio-objects').replaceChildren(
        ...d.objects.map((o) => {
          const row = document.createElement('div');
          row.className = 'row';
          row.dataset.objectId = o.id;
          for (const [label, fn] of [
            [
              o.name,
              () => {
                picked(o.min, false);
                picked(o.max, true);
                controls.update();
              },
            ],
            [
              o.hidden ? '显示' : '隐藏',
              () => task(() => command({ command: 'object', id: o.id, hidden: !o.hidden })),
            ],
            [
              o.locked ? '解锁' : '锁定',
              () => task(() => command({ command: 'object', id: o.id, locked: !o.locked })),
            ],
          ]) {
            const e = document.createElement('button');
            e.textContent = label;
            e.onclick = fn;
            row.append(e);
          }
          return row;
        }),
      );
    }
    $('studio-cameras').replaceChildren(
      ...d.cameras.map((v) => {
        const e = document.createElement('button');
        e.textContent = v.name;
        e.onclick = () => window.CraftStudio.setView(normalizeView(v));
        return e;
      }),
    );
  }
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  function ground(e, y) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, getCamera());
    return ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -y),
      new THREE.Vector3(),
    );
  }
  renderer.domElement.addEventListener('dragover', (e) => e.preventDefault());
  renderer.domElement.addEventListener('drop', (e) => {
    const id = e.dataTransfer.getData('application/craftstudio-prefab');
    if (!id) return;
    e.preventDefault();
    const pos = ground(e, at()[1]);
    if (pos) {
      const prefab = getSummary().design.prefabs.find((p) => p.id === id);
      if (prefab)
        window.dispatchEvent(
          new CustomEvent('craftstudio-prefab-drop', {
            detail: {
              prefab,
              at: [Math.max(0, Math.floor(pos.x)), at()[1], Math.max(0, Math.floor(pos.z))],
            },
          }),
        );
    }
  });
  renderer.domElement.addEventListener(
    'pointerdown',
    (e) => {
      if (walk || !$('studio-drag').checked || e.button !== 0 || e.shiftKey) return;
      const r = range(),
        pos = ground(e, r.min[1]);
      if (
        !pos ||
        pos.x < r.min[0] ||
        pos.x > r.max[0] + 1 ||
        pos.z < r.min[2] ||
        pos.z > r.max[2] + 1
      )
        return;
      drag = { ...r, members: selectionMembers, start: pos };
      controls.enabled = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );
  renderer.domElement.addEventListener(
    'pointermove',
    (e) => {
      if (!drag) return;
      const p = ground(e, drag.min[1]);
      if (!p) return;
      drag.at = [
        drag.min[0] + Math.round(p.x - drag.start.x),
        drag.min[1],
        drag.min[2] + Math.round(p.z - drag.start.z),
      ];
      outline.box.min.set(...drag.at);
      outline.box.max.set(...drag.at.map((n, a) => n + drag.max[a] - drag.min[a] + 1));
      requestRender();
    },
    true,
  );
  renderer.domElement.addEventListener(
    'pointerup',
    (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      controls.enabled = true;
      e.stopImmediatePropagation();
      if (d.at)
        task(async () => {
          const p = await call('inspect', { pos: d.min });
          const object = getSummary().design.objects.find(
            (o) =>
              o.cells &&
              o.min.every((n, a) => n === d.min[a]) &&
              o.max.every((n, a) => n === d.max[a]),
          );
          if (p.before && !object)
            throw Error('拖动先选择新增对象，原建筑请明确授权后使用移动按钮');
          await command({
            command: 'transform',
            min: d.min,
            max: d.max,
            members: d.members,
            regions: d.regions,
            at: d.at,
            move: true,
          });
          picked(d.at, false);
          picked(
            d.at.map((n, a) => n + d.max[a] - d.min[a]),
            true,
          );
        });
    },
    true,
  );
  return {
    picked,
    selectRange,
    update,
    isWalking: () => walk,
    exitWalk: leaveReview,
    getSelection: () => ({ ...(selectionSnapshot || range()), members: selectionMembers }),
    clearSelection: () => {
      outline.visible = false;
      clearRegionOutlines();
      selectionMembers = null;
      selectionRegions = null;
      selectionSnapshot = null;
      selectedStart = null;
      requestRender();
    },
    setSelectionMembers: (members) => {
      selectionMembers = members;
      if (selectionSnapshot) selectionSnapshot.members = members;
      if (selectionRegions?.length === 1) selectionRegions[0].members = members;
    },
  };
}
