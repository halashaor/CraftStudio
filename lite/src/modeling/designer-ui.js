import viewMarkup0 from './views/designer-ui-panel.html';
import { loadTextureInfo } from '../rendering/graphics-resources.js';
import { objectHidden } from '../components/collections.js';
import { PreviewHistory } from '../runtime/preview-history.js';
import { dimensionInput } from '../ui/dimension-expression.js';
import { textEditing, dialogOwnsKeyboard, nativeEnterTarget } from '../ui/keyboard-context.js';
import { closedProfiles } from '../sketch/sketch-profiles.js';
import { offsetSourceStatus } from './guide-provenance.js';
import { PreviewContext, absentReferences } from '../runtime/preview-context.js';
export function designerUI({
  THREE,
  $,
  scene,
  call,
  refresh,
  render,
  markDirty,
  policy,
  getSelection,
  getObjects,
  getSummary,
  pickMaterial,
  notice,
  requestRender,
  materialName = (s) => s.Name,
}) {
  const previewContext = new PreviewContext();
  let committing = false,
    active = false,
    draft = null,
    version = 0,
    timer = null,
    nodes = [],
    selected = null,
    objectIds = [],
    material = { Name: 'minecraft:stone_bricks' };
  let profileDirty = false,
    pathDirty = false;
  const panel = document.createElement('div');
  panel.id = 'designer-panel';
  panel.hidden = true;
  panel.className = 'designer-panel';
  panel.innerHTML = viewMarkup0;
  $('scene').append(panel);
  const n = (id) => Number($(id).value),
    config = () => ({
      operation: $('designer-operation').value,
      selection:
        $('component-expand-source').checked && $('designer-operation').value === 'syncInstances'
          ? {
              min: selected.min,
              max: selected.min.map(
                (n, a) => n + Number($('component-size-' + ['x', 'y', 'z'][a]).value) - 1,
              ),
            }
          : selected,
      objectIds,
      axis: $('designer-axis').value,
      edge: $('designer-edge').value,
      reference: $('designer-reference').value,
      distribution: $('designer-distribution').value,
      spacingMode: $('designer-spacing-mode').value,
      gap: n('designer-gap'),
      direction: n('designer-array-direction'),
      count: n('designer-count'),
      step: ['x', 'y', 'z'].map((a) => n('designer-step-' + a)),
      guideId: $('designer-guide').value,
      ...($('designer-operation').value === 'updateOffset'
        ? { sourceGuideId: $('designer-offset-source').value }
        : {}),
      spacing: n('designer-spacing'),
      pathSpacingMode: $('designer-path-spacing').value,
      center: ['x', 'y', 'z'].map((a) => n('designer-center-' + a)),
      radius: n('designer-radius'),
      angle: n('designer-angle'),
      follow: $('designer-follow').checked,
      plane: n('designer-plane'),
      distance: n('designer-distance'),
      guidesOnly: $('designer-guides-only').checked,
      state: material,
      sourceName: $('designer-paint-source').value,
      retainShape: $('designer-paint-shape').checked,
      face: $('designer-face').value,
      mode: $('designer-boolean').value,
      consumeTool: $('designer-consume').checked,
      overlap: $('designer-overlap').value,
      expandSource: $('component-expand-source').checked,
      parameters: featureParameters(),
    });
  function dispose() {
    for (const node of nodes) {
      scene.remove(node);
      for (const texture of node.userData.paintTextures || []) texture.dispose();
      node.traverse((o) => {
        o.geometry?.dispose();
        if (o.material)
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      });
    }
    nodes = [];
  }
  function mesh(buckets, color, paintTextures = null) {
    const group = new THREE.Group();
    for (const b of buckets) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
      if (paintTextures) {
        g.setAttribute('color', new THREE.BufferAttribute(b.colors, 3));
        g.setAttribute('uv', new THREE.BufferAttribute(b.uv, 2));
      }
      group.add(
        new THREE.Mesh(
          g,
          new THREE.MeshLambertMaterial(
            paintTextures
              ? {
                  map: paintTextures.get(b.texture) || null,
                  vertexColors: true,
                  transparent: true,
                  opacity: b.alpha === 'transparent' ? 0.7 : 0.95,
                  alphaTest: 0.1,
                  depthWrite: false,
                  polygonOffset: true,
                  polygonOffsetFactor: -1,
                  polygonOffsetUnits: -1,
                  side: THREE.DoubleSide,
                }
              : {
                  color,
                  transparent: true,
                  opacity: 0.5,
                  depthWrite: false,
                  side: THREE.DoubleSide,
                },
          ),
        ),
      );
    }
    group.userData.kind = 'blocks';
    if (paintTextures) group.userData.paintTextures = [...paintTextures.values()];
    return group;
  }
  function show() {
    for (const node of nodes)
      node.visible = $(
        node.userData.kind === 'lines' ? 'designer-lines' : 'designer-blocks',
      ).checked;
    requestRender();
  }
  function featureParameters() {
    const recipe = getSummary()?.design.objects.find((o) => o.id === objectIds[0])?.recipe || {},
      operation = recipe.operation || 'extrude';
    return {
      hollow: $('designer-hollow').checked,
      ...($('designer-hollow').checked ? { thickness: n('designer-thickness') } : {}),
      ...(operation === 'extrude' ? { depth: n('designer-depth') } : {}),
      ...(operation === 'sweep' && recipe.sweepMode !== 'profile'
        ? { width: n('designer-feature-width'), height: n('designer-feature-height') }
        : {}),
      ...(profileDirty
        ? { profileIds: [...$('designer-profiles').selectedOptions].map((o) => o.value) }
        : {}),
      ...(pathDirty ? { pathId: $('designer-path').value } : {}),
    };
  }
  function fields() {
    const op = $('designer-operation').value;
    $('designer-material').textContent =
      (op === 'paint' ? '目标素材：' : '轮廓：') + materialName(material);
    for (const el of panel.querySelectorAll('[data-ops]'))
      el.hidden = !el.dataset.ops.split(' ').includes(op);
    const linear = ['array', 'instance'].includes(op),
      gap = $('designer-spacing-mode').value === 'gap';
    $('designer-path-spacing-field').hidden = $('designer-path-spacing').value === 'count';
    $('designer-gap-fields').hidden = !gap;
    $('designer-offset-fields').hidden = gap;
    if (linear) $('designer-axis-fields').hidden = !gap;
    $('designer-apply').hidden = op === 'inspect';
    const recipe = getSummary()?.design.objects.find((o) => o.id === objectIds[0])?.recipe || {},
      operation = recipe.operation || 'extrude';
    $('designer-depth-label').hidden = operation !== 'extrude';
    $('designer-sweep-size').hidden = operation !== 'sweep' || recipe.sweepMode === 'profile';
    $('designer-thickness-label').hidden = !$('designer-hollow').checked;
    $('designer-count').min = ['array', 'instance'].includes(op) ? 2 : 1;
    $('designer-count').closest('label').firstChild.textContent = ['array', 'instance'].includes(op)
      ? '数量（包含原件）'
      : op === 'pathArray'
        ? $('designer-path-spacing').value === 'count'
          ? '副本数量（整条路径）'
          : '最大副本数量'
        : '副本数量';
    $('designer-selection').textContent =
      op === 'updateOffset'
        ? '按来源和距离重新偏移，并重建关联结果；确认前可检查，默认保留下游手改'
        : op === 'offset'
          ? '使用已保存的闭合轮廓；正值向外，负值向内，沿轮廓平面偏移'
          : objectIds.length
            ? '已选择 ' + objectIds.length + ' 个对象'
            : '使用当前选区';
  }
  const expressionBindings = new Map(),
    expressionPending = new Set();
  const pendingExpression = () =>
    [...expressionBindings.keys()].find(
      (input) => input.dataset.expressionPending && input.getClientRects().length,
    );
  function holdExpression(input, message) {
    expressionPending.add(input);
    if (!active || !input.getClientRects().length) return;
    version++;
    draft = null;
    clearTimeout(timer);
    panel.dataset.previewState = 'pending-expression';
    $('designer-apply').disabled = true;
    $('designer-report').textContent = message;
    syncParameterHistory();
  }
  for (const input of panel.querySelectorAll('input[type=number]'))
    expressionBindings.set(
      input,
      dimensionInput(input, {
        pending: holdExpression,
        resolved: (input) => {
          const was = expressionPending.delete(input);
          if (was && active && !pendingExpression()) schedule();
          syncParameterHistory();
        },
      }),
    );
  const parameterSteps = new PreviewHistory(),
    fieldStarts = new Map();
  let restoringParameters = false;
  const historyControls = () =>
    [...panel.querySelectorAll('input[id],select[id]')].filter(
      (el) =>
        !['designer-operation', 'designer-lines', 'designer-blocks', 'designer-layer'].includes(
          el.id,
        ),
    );
  function captureParameters() {
    return {
      controls: Object.fromEntries(
        historyControls().map((el) => [
          el.id,
          el.type === 'checkbox'
            ? el.checked
            : el.multiple
              ? [...el.selectedOptions].map((o) => o.value)
              : el.dataset.expressionPending
                ? (expressionBindings.get(el)?.snapshotValue() ?? el.value)
                : el.value,
        ]),
      ),
      material: structuredClone(material),
      profileDirty,
      pathDirty,
    };
  }
  function parameterState() {
    return {
      active,
      undo: parameterSteps.undo.length > 0 || !!pendingExpression(),
      redo: parameterSteps.redo.length > 0,
    };
  }
  function syncParameterHistory() {
    panel.dataset.localHistory = [
      parameterSteps.undo.length,
      parameterSteps.redo.length,
      !!pendingExpression(),
    ].join(':');
  }
  function recordParameters(before) {
    if (!active || restoringParameters || committing || !before || pendingExpression()) return;
    parameterSteps.record(before, captureParameters());
    syncParameterHistory();
  }
  panel.addEventListener('focusin', (e) => {
    if (active && historyControls().includes(e.target))
      fieldStarts.set(e.target.id, captureParameters());
  });
  panel.addEventListener('change', (e) => {
    if (!historyControls().includes(e.target)) return;
    recordParameters(fieldStarts.get(e.target.id));
    fieldStarts.set(e.target.id, captureParameters());
  });
  panel.addEventListener('focusout', (e) => {
    if (!historyControls().includes(e.target)) return;
    recordParameters(fieldStarts.get(e.target.id));
    fieldStarts.delete(e.target.id);
  });
  function parameterHistory(direction) {
    if (!active) return false;
    if (committing) {
      notice('正在确认当前操作，请等待完成');
      return true;
    }
    const pending = pendingExpression();
    if (pending) {
      expressionBindings.get(pending).restore();
      pending.dispatchEvent(new Event('input', { bubbles: true }));
      fieldStarts.clear();
      syncParameterHistory();
      return true;
    }
    const frame = parameterSteps.step(direction, captureParameters());
    if (!frame) {
      notice(direction === 'undo' ? '当前参数没有更早的调整' : '当前参数没有可重做的调整');
      return true;
    }
    restoringParameters = true;
    try {
      for (const el of historyControls()) {
        const value = frame.controls[el.id];
        if (value === undefined) continue;
        if (el.type === 'checkbox') el.checked = value;
        else if (el.multiple)
          for (const option of el.options) option.selected = value.includes(option.value);
        else el.value = value;
        expressionBindings.get(el)?.reset();
      }
      material = structuredClone(frame.material);
      profileDirty = frame.profileDirty;
      pathDirty = frame.pathDirty;
      $('designer-material').textContent = '轮廓：' + materialName(material);
      fields();
      fieldStarts.clear();
    } finally {
      restoringParameters = false;
    }
    syncParameterHistory();
    schedule();
    return true;
  }
  let inspection = null;
  function componentReport(update) {
    if (!update) return '';
    const design = getSummary()?.design,
      source = design?.objects.find((o) => o.id === objectIds[0]),
      hidden = source
        ? design.objects.filter(
            (o) => o.instanceOf === source.instanceOf && objectHidden(design, o),
          ).length
        : 0;
    return (
      '\n组件来源：' +
      (source?.name || '当前实例') +
      '\n联动实例：' +
      update.instances +
      ' 份（隐藏 ' +
      hidden +
      ' 份）\n保留手改：' +
      update.preserved +
      ' 个方块'
    );
  }
  async function preview() {
    if (!active || committing) return;
    const pending = pendingExpression();
    if (pending) {
      holdExpression(pending, pending.validationMessage || '请先完成参数计算式');
      return;
    }
    panel.dataset.previewState = 'recomputing';
    const own = ++version;
    draft = null;
    $('designer-apply').disabled = true;
    try {
      const c = config();
      if (c.operation === 'inspect') {
        const result = await call('designInspect', c);
        if (!active || own !== version) return;
        if (!previewContext.matches(result)) {
          schedule();
          return;
        }
        panel.dataset.previewRevision = String(result.revision);
        panel.dataset.previewWorkspace = result.workspaceId;
        panel.dataset.previewState = 'ready';
        inspection = result;
        dispose();
        for (const [positions, color] of [
          [result.unsupported, 0xeab35c],
          [result.collisions.map((c) => c.pos), 0xf07575],
        ])
          for (const p of positions) {
            const box = new THREE.Box3Helper(
              new THREE.Box3(new THREE.Vector3(...p), new THREE.Vector3(...p.map((n) => n + 1))),
              color,
            );
            box.userData.kind = 'lines';
            nodes.push(box);
            scene.add(box);
          }
        $('designer-report').textContent =
          `尺寸 ${result.size.join(' × ')} 格\n方块 ${result.blockCount}\n地形高差 ${result.terrain ? result.terrain.max - result.terrain.min : '未知'}\n正下方无支撑 ${result.unsupportedCount} 处（最多标记 200）\n原场地改动 ${result.collisionsCount} 处\n` +
          result.notes.join('\n') +
          '\n\n材料：\n' +
          Object.entries(result.materials)
            .slice(0, 20)
            .map(([Name, count]) => materialName({ Name }) + ' × ' + count)
            .join('\n');
        show();
        return;
      }
      const result = await call('prepareConstruction', {
        type: 'designer',
        config: c,
        policy: policy(),
      });
      if (!active || own !== version) {
        await call('cancelConstruction', { id: result.id });
        return;
      }
      if (!previewContext.matches(result)) {
        await call('cancelConstruction', { id: result.id });
        schedule();
        return;
      }
      let paintTextures = null;
      if (c.operation === 'paint') {
        paintTextures = new Map();
        await Promise.all(
          Object.entries(result.textures || {}).map(async ([key, info]) => {
            try {
              const texture = await loadTextureInfo(info, (uri) =>
                new THREE.TextureLoader().loadAsync(uri),
              );
              if (!texture) return;
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.magFilter = THREE.NearestFilter;
              texture.minFilter = THREE.NearestFilter;
              texture.generateMipmaps = false;
              if (info.tile) {
                texture.repeat.set(info.tile[2], info.tile[3]);
                texture.offset.set(info.tile[0], info.tile[1]);
              }
              paintTextures.set(key, texture);
            } catch {}
          }),
        );
        if (!active || own !== version || !previewContext.matches(result)) {
          for (const texture of paintTextures.values()) texture.dispose();
          await call('cancelConstruction', { id: result.id });
          if (active && own === version) schedule();
          return;
        }
      }
      panel.dataset.previewRevision = String(result.revision);
      panel.dataset.previewWorkspace = result.workspaceId;
      panel.dataset.previewState = 'ready';
      draft = result;
      if (result.materialChange) {
        const select = $('designer-paint-source'),
          previous = select.value,
          options = [
            new Option('所有选中材质', ''),
            ...result.materialChange.sources.map(
              (v) => new Option(materialName({ Name: v.Name }) + ' · ' + v.count + ' 格', v.Name),
            ),
          ];
        if (previous && !options.some((o) => o.value === previous))
          options.push(new Option('来源不在当前选区 · 请重新选择', previous));
        select.replaceChildren(...options);
        select.value = previous;
      }
      dispose();
      nodes.push(
        mesh(result.buckets, 0x75cdb7, paintTextures),
        mesh(result.removedBuckets, 0xf18685),
      );
      if (result.guide.length) {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(
            result.guide.map((p) => new THREE.Vector3(...p)),
          ),
          new THREE.LineBasicMaterial({ color: 0xb5a4f5, depthTest: false }),
        );
        line.userData.kind = 'lines';
        nodes.push(line);
      }
      scene.add(...nodes);
      $('designer-report').textContent =
        `新增 ${result.counts.place} · 替换 ${result.counts.replace} · 移除 ${result.counts.remove}` +
        (result.materialChange
          ? '\n选中 ' +
            result.materialChange.selected +
            ' · 换材质 ' +
            result.materialChange.changed +
            ' · 未变 ' +
            result.materialChange.unchanged +
            ' · 保留 ' +
            result.materialChange.skipped +
            (result.materialChange.excluded ? ' · 未匹配 ' + result.materialChange.excluded : '')
          : '') +
        componentReport(result.componentUpdate) +
        (result.pathArray
          ? '\n路径 ' +
            result.pathArray.length.toFixed(2) +
            ' 格 · 实际副本 ' +
            result.pathArray.count +
            ' · ' +
            (result.pathArray.closed ? '闭合环（首尾不重复）' : '开放路径') +
            ' · 理论间距 ' +
            result.pathArray.spacing.toFixed(2)
          : '') +
        (result.arraySpacing?.mode === 'gap'
          ? '\n构件占格跨度 ' +
            result.arraySpacing.span +
            ' · 实际空隙 ' +
            result.arraySpacing.gap +
            ' · 每份位移 ' +
            result.arraySpacing.step.join(' / ')
          : '') +
        (result.warnings.length ? '\n' + result.warnings.join('\n') : '') +
        (result.conflicts.length ? '\n存在保护冲突，请调整参数或场地改动规则。' : '');
      $('designer-apply').disabled =
        result.conflicts.length > 0 || result.materialChange?.changed === 0;
      show();
    } catch (e) {
      if (own === version) {
        draft = null;
        dispose();
        panel.dataset.previewState = 'invalid';
        $('designer-apply').disabled = true;
        $('designer-report').textContent = e.message;
      }
    }
  }
  function schedule() {
    if (!active || committing || restoringParameters) return;
    const pending = pendingExpression();
    if (pending) {
      holdExpression(pending, pending.validationMessage || '请先完成参数计算式');
      return;
    }
    version++;
    draft = null;
    panel.dataset.previewState = 'pending';
    $('designer-apply').disabled = true;
    clearTimeout(timer);
    timer = setTimeout(preview, 180);
  }
  function close() {
    if (committing) return;
    if (draft?.id) call('cancelConstruction', { id: draft.id }).catch(() => {});
    draft = null;
    active = false;
    for (const binding of expressionBindings.values()) binding.restore();
    expressionPending.clear();
    parameterSteps.clear();
    fieldStarts.clear();
    syncParameterHistory();
    version++;
    clearTimeout(timer);
    dispose();
    panel.hidden = true;
    requestRender();
  }
  function featureReferences() {
    profileDirty = pathDirty = false;
    const object = getSummary()?.design.objects.find((o) => o.id === objectIds[0]),
      recipe = object?.recipe || {},
      guides = getSummary()?.design.guides || [],
      profiles = closedProfiles(guides),
      ids = recipe.profileIds || [],
      ordered = [
        ...ids.map(
          (id) => profiles.find((g) => g.id === id) || { id, name: '截面参照已失效 · 请选择' },
        ),
        ...profiles.filter((g) => !ids.includes(g.id) && g.id !== object?.guideId),
      ];
    $('designer-profiles').replaceChildren(
      ...ordered.map((g) => {
        const option = document.createElement('option');
        option.value = g.id;
        option.textContent = g.name || '闭合截面';
        option.selected = ids.includes(g.id);
        option.disabled = g.id === object?.guideId;
        return option;
      }),
    );
    const paths = guides.filter((g) => g.points?.length >= 2 && g.id !== object?.guideId);
    if (recipe.pathId && !paths.some((g) => g.id === recipe.pathId))
      paths.unshift({ id: recipe.pathId, name: '路径参照已失效 · 请选择' });
    $('designer-path').replaceChildren(
      ...paths.map((g) => {
        const option = document.createElement('option');
        option.value = g.id;
        option.textContent = g.name || '辅助路径';
        option.selected = g.id === recipe.pathId;
        return option;
      }),
    );
    $('designer-profile-label').hidden =
      recipe.operation === 'sweep' && recipe.sweepMode !== 'profile';
    $('designer-path-label').hidden = recipe.operation !== 'sweep';
  }
  function offsetSources(repair = false) {
    const guides = getSummary()?.design.guides || [],
      target = guides.find((g) => g.id === $('designer-guide').value),
      stored = target?.provenance?.guideId || '',
      select = $('designer-offset-source'),
      placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '请选择新的闭合来源';
    const options = [placeholder];
    if (target?.provenance?.kind !== 'offset') {
      select.replaceChildren(placeholder);
      return;
    }
    for (const guide of guides) {
      if (guide.id === target?.id || !closedProfiles([guide]).length) continue;
      const proposed = guides.map((g) =>
          g.id === target.id ? { ...g, provenance: { ...g.provenance, guideId: guide.id } } : g,
        ),
        status = offsetSourceStatus(proposed, target.id),
        option = document.createElement('option');
      option.value = guide.id;
      option.textContent = guide.name || '辅助轮廓';
      option.disabled = !!status && !status.canRebuild;
      option.title = status?.reason || '';
      options.push(option);
    }
    if (stored && !options.some((o) => o.value === stored)) {
      const missing = document.createElement('option');
      missing.value = stored;
      missing.textContent = '原来源已失效 · 请选择新来源';
      options.push(missing);
    }
    select.replaceChildren(...options);
    select.value = repair ? '' : stored;
  }
  function open(op, context = {}) {
    if (committing) return;
    close();
    previewContext.observe(getSummary());
    active = true;
    $('designer-paint-source').value = '';
    selected = structuredClone(getSelection());
    for (const [a, i] of ['x', 'y', 'z'].map((a, i) => [a, i]))
      $('component-size-' + a).value = selected.max[i] - selected.min[i] + 1;
    $('component-expand-source').checked = false;
    objectIds = context.objectIds || getObjects();
    const s = getSummary();
    panel.hidden = false;
    $('designer-material').textContent = '轮廓：' + materialName(material);
    $('cad-empty').hidden = true;
    const guides = s.design?.guides || [];
    $('designer-guide').replaceChildren(
      ...guides.map((g, i) => {
        const o = document.createElement('option');
        o.value = g.id;
        o.textContent = g.name + ' #' + (i + 1);
        return o;
      }),
    );
    if (op) $('designer-operation').value = op;
    featureReferences();
    if (context.guideId) $('designer-guide').value = context.guideId;
    if ($('designer-operation').value === 'updateOffset') {
      if (guides.find((g) => g.id === $('designer-guide').value)?.provenance?.kind !== 'offset')
        $('designer-guide').value = guides.find((g) => g.provenance?.kind === 'offset')?.id || '';
      $('designer-distance').value =
        guides.find((g) => g.id === $('designer-guide').value)?.provenance?.distance ?? 1;
    }
    const first = s.design?.objects.find((o) => o.id === objectIds[0]);
    if (first?.recipe) {
      $('designer-depth').value = first.recipe.depth ?? 8;
      $('designer-hollow').checked = !!first.recipe.hollow;
      $('designer-thickness').value = first.recipe.thickness ?? 1;
      $('designer-feature-width').value = first.recipe.width ?? 3;
      $('designer-feature-height').value = first.recipe.height ?? 3;
    }
    $('designer-plane').value = selected.max[0] + 2;
    ['x', 'y', 'z'].forEach(
      (a, i) => ($('designer-center-' + a).value = selected.min[i] + (i === 1 ? 0 : 12)),
    );
    material = {
      Name: $('block-id').value,
      ...($('block-properties').value
        ? { Properties: JSON.parse($('block-properties').value) }
        : {}),
    };
    fields();
    if ($('designer-operation').value === 'updateOffset') offsetSources(!!context.repair);
    preview();
  }
  $('designer-close').onclick = close;
  $('designer-preview').onclick = preview;
  $('designer-operation').onchange = () => {
    parameterSteps.clear();
    fieldStarts.clear();
    syncParameterHistory();
    if ($('designer-operation').value === 'editFeature') featureReferences();
    if ($('designer-operation').value === 'updateOffset') {
      const guides = getSummary()?.design.guides || [];
      if (guides.find((g) => g.id === $('designer-guide').value)?.provenance?.kind !== 'offset')
        $('designer-guide').value = guides.find((g) => g.provenance?.kind === 'offset')?.id || '';
      $('designer-distance').value =
        guides.find((g) => g.id === $('designer-guide').value)?.provenance?.distance ?? 1;
    }
    fields();
    if ($('designer-operation').value === 'updateOffset') offsetSources();
    schedule();
  };
  for (const el of panel.querySelectorAll('input,select'))
    if (el.id !== 'designer-operation')
      el.oninput = ['designer-lines', 'designer-blocks'].includes(el.id) ? show : schedule;
  $('designer-hollow').oninput = () => {
    fields();
    schedule();
  };
  $('designer-spacing-mode').oninput = () => {
    fields();
    schedule();
  };
  $('designer-path-spacing').oninput = () => {
    fields();
    schedule();
  };
  $('designer-profiles').oninput = () => {
    profileDirty = true;
    schedule();
  };
  $('designer-path').oninput = () => {
    pathDirty = true;
    schedule();
  };
  $('designer-guide').oninput = () => {
    if ($('designer-operation').value === 'updateOffset')
      $('designer-distance').value =
        getSummary()?.design.guides.find((g) => g.id === $('designer-guide').value)?.provenance
          ?.distance ?? 1;
    if ($('designer-operation').value === 'updateOffset') offsetSources();
    schedule();
  };
  $('designer-paint-shape').onchange = schedule;
  $('designer-paint-source').onchange = schedule;
  $('designer-axis').onchange = () => {
    const a = { x: 0, y: 1, z: 2 }[$('designer-axis').value];
    $('designer-plane').value = selected.max[a] + 2;
    schedule();
  };
  $('designer-material').onclick = () =>
    pickMaterial(
      (state, name) => {
        const before = captureParameters();
        material = state;
        $('designer-material').textContent =
          ($('designer-operation').value === 'paint' ? '目标素材：' : '轮廓：') + name;
        recordParameters(before);
        schedule();
      },
      $('designer-operation').value === 'paint' ? '选区换材质' : '轮廓材料',
    );
  $('designer-apply').onclick = async () => {
    if (!draft || committing) return;
    committing = true;
    $('designer-apply').disabled = true;
    try {
      refresh(
        await call('commitConstruction', {
          id: draft.id,
          policy: policy(),
          name: $('designer-operation').selectedOptions[0].textContent,
        }),
      );
      await render();
      markDirty();
      committing = false;
      close();
      notice('设计操作已确认，可一次撤销');
    } catch (e) {
      $('designer-report').textContent = e.message;
      schedule();
    } finally {
      committing = false;
    }
  };
  $('designer-isolate').onclick = async () => {
    await call('viewIsolation', { selection: selected, objectIds });
    refresh(await call('summary'));
    await render();
    notice('已隔离选择；恢复显示可返回整个场景');
  };
  $('designer-show-all').onclick = async () => {
    await call('viewIsolation', { clear: true });
    refresh(await call('summary'));
    await render();
  };
  $('designer-section').onclick = () => {
    $('cut').value = Math.max(0, Math.min(+$('cut').max, n('designer-layer')));
    $('cut').dispatchEvent(new Event('input'));
  };
  $('designer-export-report').onclick = () => {
    if (!inspection) return;
    const quote = (s) => '"' + String(s).replaceAll('"', '""') + '"',
      rows = [
        ['施工层 Y', '方块名称', '数量', '方块标识'],
        ...Object.entries(inspection.materials).map(([Name, count]) => [
          '总计',
          materialName({ Name }),
          count,
          Name,
        ]),
        ...Object.entries(inspection.layers).flatMap(([layer, row]) =>
          Object.entries(row.materials).map(([Name, count]) => [
            layer,
            materialName({ Name }),
            count,
            Name,
          ]),
        ),
      ],
      blob = new Blob(['\ufeff' + rows.map((r) => r.map(quote).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
      a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '施工材料与分层.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  window.addEventListener(
    'keydown',
    (e) => {
      if (dialogOwnsKeyboard()) return;
      if (
        e.target.closest?.('[data-shortcut-scope=commands]') ||
        e.defaultPrevented ||
        e.isComposing ||
        !active ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key === 'Escape') {
        if (e.target?.dataset.dimensionExpression === 'true') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (committing) notice('正在确认当前操作，请等待完成');
        else close();
        return;
      }
      if (e.key !== 'Enter') return;
      const focus = document.activeElement;
      if (textEditing(focus)) {
        if (panel.contains(focus) && focus.tagName === 'INPUT' && focus.type === 'number') {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!e.repeat) {
            clearTimeout(timer);
            preview();
          }
        }
        return;
      }
      if (nativeEnterTarget(focus)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (committing) return;
      if ($('designer-apply').hidden) return;
      if ($('designer-apply').disabled || !draft) {
        notice('预览尚未就绪，请检查参数或等待更新');
        return;
      }
      $('designer-apply').click();
    },
    true,
  );
  return {
    open,
    close,
    parameterHistory,
    parameterState,
    update: (s) => {
      const change = previewContext.observe(s);
      if (!active || committing || !change) return;
      if (change === 'workspace') {
        close();
        notice('工程已切换，原工程的排列预览已结束');
        return;
      }
      parameterSteps.clear();
      fieldStarts.clear();
      syncParameterHistory();
      const id = $('designer-guide').value,
        list = s.design?.guides || [];
      $('designer-guide').replaceChildren(
        ...list.map((g) => {
          const o = document.createElement('option');
          o.value = g.id;
          o.textContent = g.name;
          o.selected = g.id === id;
          return o;
        }),
      );
      for (const missing of absentReferences(list, [id])) {
        const o = document.createElement('option');
        o.value = missing;
        o.textContent = '参照已失效 · 请重新选择';
        o.selected = true;
        $('designer-guide').append(o);
      }
      dispose();
      panel.dataset.previewState = 'stale';
      $('designer-report').textContent = '场景已更新，保留当前参数，正在重新校准';
      schedule();
    },
    isActive: () => active,
    isBusy: () => committing,
  };
}
