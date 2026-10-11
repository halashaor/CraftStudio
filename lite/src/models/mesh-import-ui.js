import markup from './views/mesh-import-panel.html';
import { meshPlacementMatrix, normalizeMeshTransform } from './mesh-transform.js';
import { TransformControls } from '../../../web/vendor/TransformControls.js';
import { PreviewIssuesUI } from '../modeling/preview-issues-ui.js';
import { PreviewContext } from '../runtime/preview-context.js';
import { PreviewHistory } from '../runtime/preview-history.js';
import { latestPreview } from '../runtime/live-preview.js';
import { dimensionInput } from '../ui/dimension-expression.js';
import { dialogOwnsKeyboard, nativeControlTarget } from '../ui/keyboard-context.js';
import { frameBounds } from '../view/frame-bounds.js';

export function meshImportUI({
  THREE,
  $,
  scene,
  getCamera,
  renderer,
  call,
  refresh,
  render,
  markDirty,
  policy,
  pickMaterial,
  notice,
  navigation,
  requestRender,
  getSummary,
  beforeOpen = () => true,
  cast,
  hitCell,
}) {
  const panel = document.createElement('section');
  panel.id = 'mesh-model-panel';
  panel.hidden = true;
  panel.innerHTML = markup;
  $('scene').append(panel);
  const viewport = renderer.domElement,
    pivot = new THREE.Group(),
    control = new TransformControls(getCamera(), viewport),
    history = new PreviewHistory(),
    context = new PreviewContext(),
    geometryCache = new Map(),
    bindings = new Map(),
    axes = ['x', 'y', 'z'];
  scene.add(pivot, control.getHelper());
  control.enabled = false;
  control.setSize(0.8);
  control.setTranslationSnap(0.5);
  control.setSpace('world');
  let active = false,
    navigationHeld = false,
    busy = false,
    source = null,
    objectId = null,
    sourceMesh = null,
    blockMesh = null,
    removedMesh = null,
    draft = null,
    picking = false,
    pointerDown = null,
    transform = normalizeMeshTransform(),
    material = { Name: $('block-id').value || 'minecraft:stone_bricks' },
    materialLabel = '当前素材',
    roles = {},
    roleLabels = {},
    dragStart = null,
    fieldStart = null,
    version = 0,
    loadVersion = 0;

  function syncGizmoEnabled() {
    control.enabled = !!(
      active &&
      source &&
      control.object &&
      !picking &&
      !busy &&
      !navigationHeld
    );
    if (!control.enabled) control.axis = null;
  }
  control.addEventListener('object-changed', syncGizmoEnabled);

  const issues = new PreviewIssuesUI({
    THREE,
    scene,
    requestRender,
    report: $('mesh-model-report'),
    policyControls: { terrain: $('allow-terrain'), existing: $('allow-existing') },
    policyChanged: () => schedule(),
  });

  function announceEditing() {
    panel.dataset.sourceId = source?.id || '';
    window.dispatchEvent(
      new CustomEvent('craftstudio-mesh-editing', {
        detail: { sourceId: active ? source?.id || null : null },
      }),
    );
  }
  function remove(mesh) {
    if (!mesh) return;
    scene.remove(mesh);
    mesh.traverse((child) => {
      child.geometry?.dispose();
      child.material?.dispose();
    });
  }
  function clearBlocks() {
    remove(blockMesh);
    remove(removedMesh);
    blockMesh = removedMesh = null;
    requestRender();
  }
  function cancelDraft(id = draft?.id) {
    draft = null;
    if (id) call('cancelConstruction', { id }).catch((error) => notice(error.message, true));
  }
  function sourceOptions(summary) {
    $('mesh-model-source').replaceChildren(
      new Option('选择已导入模型', ''),
      ...(summary?.design?.meshSources || []).map((item) => new Option(item.name, item.id)),
    );
    $('mesh-model-source').value = source?.id || '';
  }
  function capture() {
    return {
      transform: structuredClone(transform),
      mode: $('mesh-model-mode').value,
      smart: $('mesh-model-smart').checked,
      uniform: $('mesh-model-uniform').checked,
      name: $('mesh-model-name').value,
      manualStrategy: $('mesh-model-manual').value,
      material: structuredClone(material),
      materialLabel,
      roles: structuredClone(roles),
      roleLabels: structuredClone(roleLabels),
    };
  }
  function syncHistory() {
    panel.dataset.localHistory = `${history.undo.length}:${history.redo.length}:${!!dragStart}`;
  }
  function record(before) {
    if (before) history.record(before, capture());
    fieldStart = null;
    syncHistory();
  }
  function restore(value) {
    transform = normalizeMeshTransform(value.transform);
    material = structuredClone(value.material);
    materialLabel = value.materialLabel;
    roles = structuredClone(value.roles);
    roleLabels = structuredClone(value.roleLabels);
    $('mesh-model-mode').value = value.mode;
    $('mesh-model-smart').checked = value.smart;
    $('mesh-model-uniform').checked = value.uniform;
    $('mesh-model-name').value = value.name;
    $('mesh-model-manual').value = value.manualStrategy;
    syncFields();
    updateModel();
    schedule(true);
    syncHistory();
  }
  function dimensions() {
    return source.bounds.max.map((n, axis) => n - source.bounds.min[axis]);
  }
  function syncFields() {
    if (!source) return;
    const sizes = dimensions();
    for (let a = 0; a < 3; a++) {
      for (const [prefix, value] of [
        ['pos', transform.position[a]],
        ['rot', transform.rotation[a]],
        ['size', Math.abs(sizes[a] * transform.scale[a])],
      ]) {
        const input = $(`mesh-${prefix}-${axes[a]}`);
        input.value = String(Number(value.toFixed(5)));
        if (prefix === 'size') {
          input.disabled = sizes[a] === 0;
          input.min = sizes[a] === 0 ? '0' : '0.01';
        }
        bindings.get(input)?.reset();
      }
    }
    $('mesh-model-material').textContent = '主体：' + materialLabel;
    $('mesh-model-slab').textContent = '半砖：' + (roleLabels.slab || '自动匹配');
    $('mesh-model-stairs').textContent = '楼梯：' + (roleLabels.stairs || '自动匹配');
    $('mesh-model-slab').disabled = $('mesh-model-stairs').disabled =
      !$('mesh-model-smart').checked;
  }
  function updateModel() {
    if (!sourceMesh) return;
    sourceMesh.matrix.fromArray(meshPlacementMatrix(transform));
    sourceMesh.matrixWorldNeedsUpdate = true;
    pivot.position.fromArray(transform.position);
    pivot.rotation.set(...transform.rotation.map((n) => THREE.MathUtils.degToRad(n)), 'XYZ');
    pivot.scale.fromArray(transform.scale);
    pivot.updateMatrixWorld(true);
    visibility();
    requestRender();
  }
  function visibility() {
    if (sourceMesh) sourceMesh.visible = active && $('mesh-model-show-source').checked;
    for (const mesh of [blockMesh, removedMesh])
      if (mesh) mesh.visible = active && $('mesh-model-show-blocks').checked;
    requestRender();
  }
  function showPicking(value) {
    picking = value && !!source;
    panel.dataset.picking = String(picking);
    $('mesh-model-place').setAttribute('aria-pressed', String(picking));
    $('mesh-model-placement').textContent = picking
      ? '左键点击场地，放下模型底部中心；右键旋转、中键平移。'
      : '拖动三色操作柄调整；方块只在确认后写入场地。';
    if (active && source && !picking) control.attach(pivot);
    else control.detach();
    syncGizmoEnabled();
    requestRender();
  }
  function config(saveOnly = false) {
    return {
      sourceId: source.id,
      transform: structuredClone(transform),
      mode: $('mesh-model-mode').value,
      smart: $('mesh-model-smart').checked,
      state: structuredClone(material),
      roles: structuredClone(roles),
      ...(objectId ? { objectId, manualStrategy: $('mesh-model-manual').value } : {}),
      ...(saveOnly
        ? { saveOnly: true, sourceName: $('mesh-model-name').value.trim() || source.name }
        : { hideSource: true }),
    };
  }
  function pendingExpression() {
    return panel.querySelector('[data-expression-pending="true"]');
  }
  function makeBlocks(buckets, color) {
    const group = new THREE.Group();
    for (const bucket of buckets || []) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(bucket.positions, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(bucket.normals, 3));
      group.add(
        new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({
            color,
            transparent: true,
            opacity: 0.64,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        ),
      );
    }
    scene.add(group);
    return group;
  }
  const precise = latestPreview({
    delay: 100,
    run: async () => {
      const own = version,
        result = await call('prepareConstruction', {
          type: 'mesh',
          config: config(),
          policy: policy(),
        });
      if (!active || own !== version) {
        await call('cancelConstruction', { id: result.id });
        return null;
      }
      return result;
    },
    apply: (result) => {
      if (!result || !active) return;
      if (!context.matches(result)) {
        cancelDraft(result.id);
        schedule();
        return;
      }
      draft = result;
      clearBlocks();
      blockMesh = makeBlocks(result.buckets, 0x75cdb7);
      removedMesh = makeBlocks(result.removedBuckets, 0xf18685);
      issues.show(result.conflictSummary);
      const counts = result.counts,
        parts = result.usedRoles || {},
        changes = counts.place + counts.replace + counts.remove;
      $('mesh-model-report').textContent =
        `新增 ${counts.place} · 替换 ${counts.replace} · 移除 ${counts.remove}` +
        (parts.slab ? ` · 半砖 ${parts.slab}` : '') +
        (parts.stairs ? ` · 楼梯 ${parts.stairs}` : '') +
        (result.regeneration ? ` · 保留手工改动 ${result.regeneration.manual} 格` : '') +
        (result.warnings?.length ? '。' + result.warnings.join('；') : '') +
        (result.blocked ? '。' + result.blocked.message : '') +
        (!changes ? '。当前预览未改变方块。' : '');
      $('mesh-model-apply').disabled = !!result.conflicts?.length || !!result.blocked;
      panel.dataset.previewState = 'ready';
      panel.dataset.previewRevision = String(result.revision);
      visibility();
    },
    onError: (error) => {
      draft = null;
      clearBlocks();
      issues.clear();
      panel.dataset.previewState = 'invalid';
      $('mesh-model-apply').disabled = true;
      $('mesh-model-report').textContent = error.message;
    },
  });
  function schedule(immediate = false) {
    if (!active || !source || busy) return;
    version++;
    cancelDraft();
    $('mesh-model-apply').disabled = true;
    issues.clear();
    clearBlocks();
    if (pendingExpression()) {
      precise.cancel();
      panel.dataset.previewState = 'expression';
      return;
    }
    panel.dataset.previewState = 'pending';
    $('mesh-model-report').textContent = control.dragging
      ? '模型随拖动实时变化，松开后计算方块。'
      : '正在计算方块预览…';
    if (control.dragging) precise.cancel();
    else precise.request(immediate);
  }

  async function loadSource(id, { recipe = null, initial = false } = {}) {
    const own = ++loadVersion,
      head = getSummary(),
      descriptor = head.design?.meshSources?.find((item) => item.id === id);
    if (!descriptor) throw Error('请选择一个模型来源');
    version++;
    precise.cancel();
    cancelDraft();
    clearBlocks();
    issues.clear();
    control.detach();
    remove(sourceMesh);
    sourceMesh = null;
    source = null;
    $('mesh-model-controls').hidden = true;
    announceEditing();
    panel.dataset.previewState = 'loading';
    $('mesh-model-apply').disabled = true;
    let geometry = geometryCache.get(descriptor.sourceKey);
    if (!geometry) {
      geometry = await call('meshSourceGeometry', {
        id,
        workspaceId: head.workspaceId,
        expectedRevision: head.revision,
      });
      if (!active || own !== loadVersion) return;
      geometryCache.set(descriptor.sourceKey, geometry);
    }
    if (!active || own !== loadVersion) return;
    source = descriptor;
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute('position', new THREE.BufferAttribute(geometry.positions, 3));
    buffer.computeVertexNormals();
    sourceMesh = new THREE.Mesh(
      buffer,
      new THREE.MeshLambertMaterial({
        color: 0xa99bce,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    sourceMesh.matrixAutoUpdate = false;
    scene.add(sourceMesh);
    transform = normalizeMeshTransform(recipe?.transform, source.transform);
    if (initial) {
      const longest = Math.max(...dimensions()),
        target = window.CraftStudio.viewState().target;
      transform = normalizeMeshTransform({
        position: [...target],
        scale: [16 / longest, 16 / longest, 16 / longest],
      });
    }
    if (recipe?.state) {
      material = structuredClone(recipe.state);
      materialLabel = '原结果素材';
    }
    roles = structuredClone(recipe?.roles || {});
    roleLabels = Object.fromEntries(Object.keys(roles).map((role) => [role, '原结果素材']));
    $('mesh-model-mode').value = recipe?.mode || 'surface';
    $('mesh-model-smart').checked = recipe?.smart ?? true;
    $('mesh-model-name').value = objectId
      ? head.design.objects.find((object) => object.id === objectId).name
      : source.name;
    $('mesh-model-manual').value = 'preserve';
    $('mesh-model-manual-label').hidden = !objectId;
    $('mesh-model-controls').hidden = false;
    $('mesh-model-save').hidden = !!objectId;
    $('mesh-model-apply').textContent = objectId ? '更新方块结果' : '确认生成方块';
    $('mesh-model-source').value = id;
    $('mesh-model-source').disabled = !!objectId;
    $('mesh-model-source-info').textContent =
      `${source.triangleCount.toLocaleString()} 个三角形 · ${source.topology?.closed ? '闭合模型，可填充实体' : '非闭合模型，建议生成表面'}` +
      (source.warnings?.length ? '。' + source.warnings.join('；') : '');
    $('mesh-model-show-source').checked = $('mesh-model-show-blocks').checked = true;
    history.clear();
    syncFields();
    updateModel();
    syncHistory();
    announceEditing();
    showPicking(initial);
    schedule(true);
  }
  async function open({ sourceId, objectId: selectedObject } = {}) {
    if (busy || !beforeOpen()) return false;
    close();
    active = true;
    panel.hidden = false;
    context.observe(getSummary());
    sourceOptions(getSummary());
    $('mesh-model-controls').hidden = true;
    $('mesh-model-source').disabled = false;
    objectId = selectedObject || null;
    const object = getSummary().design?.objects?.find((item) => item.id === objectId);
    if (objectId && !object) throw Error('原方块结果已不存在');
    const id = sourceId || object?.meshSourceId || object?.recipe?.sourceId;
    if (id) await loadSource(id, { recipe: object?.recipe });
    return true;
  }
  async function importFile(file) {
    if (!file || busy) return false;
    if (!active && (await open()) === false) return false;
    busy = true;
    syncGizmoEnabled();
    panel.inert = true;
    $('mesh-model-import').disabled = true;
    $('mesh-model-source-info').textContent = '正在读取模型…';
    try {
      const head = getSummary(),
        result = await call('api', {
          method: 'meshes.put',
          params: {
            workspaceId: head.workspaceId,
            expectedRevision: head.revision,
            source: {
              name: file.name.replace(/\.obj$/i, '') || '导入模型',
              objText: await file.text(),
              hidden: true,
            },
          },
        });
      if (!result.ok) throw Error(result.error.message);
      const summary = await call('summary');
      refresh(summary);
      markDirty();
      objectId = null;
      busy = false;
      await loadSource(result.value.id, { initial: true });
      notice('模型已导入。点击场地定位，调整后确认生成方块。');
      viewport.focus({ preventScroll: true });
      return true;
    } catch (error) {
      $('mesh-model-source-info').textContent = error.message;
      notice(error.message, true);
      return false;
    } finally {
      busy = false;
      syncGizmoEnabled();
      panel.inert = false;
      $('mesh-model-import').disabled = false;
    }
  }
  function close() {
    if (busy) return false;
    active = false;
    version++;
    loadVersion++;
    precise.cancel();
    cancelDraft();
    if (control.dragging) {
      control.reset();
      control.dragging = false;
    }
    dragStart = fieldStart = pointerDown = null;
    showPicking(false);
    control.detach();
    remove(sourceMesh);
    sourceMesh = null;
    source = null;
    objectId = null;
    clearBlocks();
    issues.clear();
    navigation(true);
    panel.hidden = true;
    panel.dataset.previewState = 'closed';
    announceEditing();
    return true;
  }
  async function commit(saveOnly = false) {
    if (!active || !source || busy || pendingExpression()) return;
    if (!saveOnly && (!draft || $('mesh-model-apply').disabled)) return;
    busy = true;
    panel.inert = true;
    version++;
    precise.cancel();
    syncGizmoEnabled();
    $('mesh-model-apply').disabled = $('mesh-model-save').disabled = true;
    try {
      const prepared = saveOnly
        ? await call('prepareConstruction', {
            type: 'mesh',
            config: config(true),
            policy: policy(),
          })
        : draft;
      if (!context.matches(prepared)) throw Error('场景已变化，请重新确认预览');
      refresh(
        await call('commitConstruction', {
          id: prepared.id,
          policy: policy(),
          name: $('mesh-model-name').value.trim() || source.name,
        }),
      );
      draft = null;
      await render();
      markDirty();
      busy = false;
      close();
      notice(
        saveOnly ? '已保存模型参考，场地方块保持不变。' : '方块结果已生成，可用 Ctrl+Z 一次撤销。',
      );
    } catch (error) {
      busy = false;
      notice(error.message, true);
      schedule(true);
    } finally {
      busy = false;
      panel.inert = false;
      $('mesh-model-save').disabled = false;
      syncGizmoEnabled();
    }
  }

  function cancelDrag() {
    if (!dragStart) return false;
    const before = dragStart;
    dragStart = null;
    control.reset();
    control.dragging = false;
    control.axis = null;
    navigation(true);
    panel.dataset.dragging = 'false';
    restore(before);
    return true;
  }
  control.addEventListener('change', requestRender);
  control.addEventListener('dragging-changed', (event) => {
    if (event.value) {
      dragStart = capture();
      fieldStart = null;
    } else if (dragStart) {
      record(dragStart);
      dragStart = null;
      schedule(true);
    }
    navigation(!event.value);
    panel.dataset.dragging = String(event.value);
    syncHistory();
  });
  control.addEventListener('objectChange', () => {
    if (!active || !source || !dragStart) return;
    transform = {
      position: pivot.position.toArray(),
      rotation: [pivot.rotation.x, pivot.rotation.y, pivot.rotation.z].map(
        THREE.MathUtils.radToDeg,
      ),
      scale: pivot.scale.toArray(),
    };
    // Keep the last valid scale when the scale handle crosses its singular center.
    if (transform.scale.some((n) => n === 0)) {
      transform.scale = [...dragStart.transform.scale];
      pivot.scale.fromArray(transform.scale);
    }
    syncFields();
    updateModel();
    schedule();
  });
  for (const [prefix, property] of [
    ['pos', 'position'],
    ['rot', 'rotation'],
    ['size', 'scale'],
  ])
    for (let a = 0; a < 3; a++) {
      const input = $(`mesh-${prefix}-${axes[a]}`);
      bindings.set(
        input,
        dimensionInput(input, {
          pending: (_input, message) => {
            $('mesh-model-report').textContent = message;
            schedule();
          },
        }),
      );
      input.addEventListener('focus', () => {
        fieldStart = capture();
      });
      input.addEventListener('input', () => {
        if (!active || !source || busy || pendingExpression()) return;
        fieldStart ||= capture();
        const value = Number(input.value);
        if (prefix === 'size') {
          const old = Math.abs(transform.scale[a] * dimensions()[a]),
            ratio = value / old;
          if ($('mesh-model-uniform').checked)
            transform.scale = transform.scale.map((n) => n * ratio);
          else transform.scale[a] *= ratio;
        } else transform[property][a] = value;
        updateModel();
        if (!input.classList.contains('dimension-scrubbing')) schedule();
      });
      input.addEventListener('change', () => {
        if (!active || busy || pendingExpression()) return;
        record(fieldStart);
        syncFields();
        schedule(true);
      });
    }

  $('mesh-model-source').onchange = async () => {
    if (busy || !$('mesh-model-source').value) return;
    objectId = null;
    try {
      await loadSource($('mesh-model-source').value);
    } catch (error) {
      notice(error.message, true);
    }
  };
  $('mesh-model-import').onclick = () => $('mesh-model-file').click();
  $('mesh-model-file').onchange = () => {
    const file = $('mesh-model-file').files[0];
    $('mesh-model-file').value = '';
    if (file) importFile(file);
  };
  $('mesh-model-close').onclick = () => close();
  $('mesh-model-place').onclick = () => {
    if (busy) return;
    showPicking(!picking);
    viewport.focus({ preventScroll: true });
  };
  $('mesh-model-apply').onclick = () => commit();
  $('mesh-model-save').onclick = () => commit(true);
  for (const button of panel.querySelectorAll('[data-mesh-tool]'))
    button.onclick = () => {
      if (busy) return;
      showPicking(false);
      control.setMode(button.dataset.meshTool);
      control.setSpace(button.dataset.meshTool === 'scale' ? 'local' : 'world');
      for (const other of panel.querySelectorAll('[data-mesh-tool]'))
        other.setAttribute('aria-pressed', String(other === button));
      viewport.focus({ preventScroll: true });
    };
  for (const id of ['mesh-model-show-source', 'mesh-model-show-blocks'])
    $(id).onchange = visibility;
  for (const id of [
    'mesh-model-mode',
    'mesh-model-smart',
    'mesh-model-uniform',
    'mesh-model-manual',
    'mesh-model-name',
  ]) {
    const input = $(id);
    input.addEventListener('craftstudio-choice-start', () => {
      fieldStart = capture();
    });
    input.addEventListener('focus', () => {
      fieldStart = capture();
    });
    input.addEventListener('pointerdown', () => {
      fieldStart = capture();
    });
    input.onchange = () => {
      record(fieldStart);
      syncFields();
      schedule();
    };
  }
  for (const [id, role, label] of [
    ['mesh-model-material', null, '主体'],
    ['mesh-model-slab', 'slab', '半砖'],
    ['mesh-model-stairs', 'stairs', '楼梯'],
  ])
    $(id).onclick = () => {
      if (busy) return;
      const before = capture(),
        own = loadVersion;
      pickMaterial((state, name) => {
        if (!active || own !== loadVersion) return;
        if (role) {
          roles[role] = state;
          roleLabels[role] = name;
        } else {
          material = state;
          materialLabel = name;
        }
        record(before);
        syncFields();
        schedule();
      }, `模型 · ${label}`);
    };
  function framingBounds() {
    if (!active || !sourceMesh) return null;
    sourceMesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(sourceMesh);
    return { min: box.min.toArray(), max: box.max.toArray() };
  }
  $('mesh-model-frame').onclick = () => {
    const bounds = framingBounds();
    if (!bounds) return;
    const rect = viewport.getBoundingClientRect();
    window.CraftStudio.setView(
      frameBounds(window.CraftStudio.viewState(), bounds, rect.width / rect.height),
    );
  };
  viewport.addEventListener(
    'pointerdown',
    (event) => {
      if (!active || !picking || busy || navigationHeld || event.button !== 0) return;
      pointerDown = [event.clientX, event.clientY];
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  viewport.addEventListener(
    'pointerup',
    (event) => {
      if (!pointerDown || event.button !== 0) return;
      const down = pointerDown;
      pointerDown = null;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (
        !active ||
        !picking ||
        busy ||
        navigationHeld ||
        Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5
      )
        return;
      const hit = cast(event);
      if (!hit) {
        notice('请点击已载入的场地或空场景网格。');
        return;
      }
      const before = capture(),
        cell = hitCell(hit, true).pos;
      transform.position = [cell[0] + 0.5, cell[1], cell[2] + 0.5];
      record(before);
      syncFields();
      updateModel();
      showPicking(false);
      schedule(true);
    },
    true,
  );
  viewport.addEventListener('pointercancel', () => {
    pointerDown = null;
    cancelDrag();
  });
  window.addEventListener('blur', () => {
    pointerDown = null;
    cancelDrag();
  });
  window.addEventListener(
    'keydown',
    (event) => {
      if (!active || dialogOwnsKeyboard() || nativeControlTarget(event.target)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (busy || cancelDrag()) return;
        if (picking) showPicking(false);
        else close();
      } else if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        commit();
      }
    },
    true,
  );
  function historyState() {
    return {
      active,
      undo: !!dragStart || history.undo.length > 0 || !!pendingExpression(),
      redo: history.redo.length > 0,
    };
  }
  function previewHistory(direction) {
    if (!active) return false;
    if (busy) return true;
    if (cancelDrag()) return true;
    const pending = pendingExpression();
    if (pending) {
      bindings.get(pending).restore();
      pending.dispatchEvent(new Event('input', { bubbles: true }));
      schedule();
      return true;
    }
    const value = history.step(direction, capture());
    if (value) {
      showPicking(false);
      restore(value);
    } else notice(direction === 'undo' ? '模型预览没有更早的步骤' : '模型预览没有可重做的步骤');
    return true;
  }
  return {
    setNavigationHeld: (held) => {
      if (held && !navigationHeld) cancelDrag();
      navigationHeld = held;
      if (held) pointerDown = null;
      syncGizmoEnabled();
    },
    open,
    importFile,
    close,
    historyState,
    previewHistory,
    framingBounds,
    isActive: () => active,
    isBusy: () => busy,
    workspaceCategory: () => 'model',
    editingSourceId: () => (active ? source?.id || null : null),
    viewChanged: () => {
      control.camera = getCamera();
    },
    update(summary) {
      const change = context.observe(summary);
      if (change === 'workspace') {
        geometryCache.clear();
        if (!busy) close();
      }
      const retainedKeys = new Set(
        (summary.design?.meshSources || []).map((item) => item.sourceKey),
      );
      for (const key of geometryCache.keys()) if (!retainedKeys.has(key)) geometryCache.delete(key);
      sourceOptions(summary);
      if (!active || !source || busy) return;
      const descriptor = summary.design?.meshSources?.find((item) => item.id === source.id);
      if (!descriptor) {
        close();
        notice('模型来源已移除。');
        return;
      }
      if (descriptor.sourceKey !== source.sourceKey) {
        const recipe = config();
        loadSource(source.id, { recipe }).catch((error) => notice(error.message, true));
      } else if (change === 'revision') schedule();
    },
  };
}
