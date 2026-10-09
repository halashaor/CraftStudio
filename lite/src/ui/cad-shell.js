import { ObjectTreeUI } from './object-tree-ui.js';
import { ObjectSelectionBinding } from '../selection/object-selection-binding.js';
import { MaterialPicker } from '../materials/material-picker.js';
import { OperationSession } from './operation-session.js';
import { SelectionSetsUI } from '../selection/selection-sets-ui.js';
import { viewportContextMenu } from './viewport-context-menu.js';
import { objectNameUI } from '../selection/object-name-ui.js';
import { componentContextUI } from '../components/component-context-ui.js';
import { selectionPredicate } from '../selection/selection-mask.js';
import { coords } from '../core/site.js';
import {
  combineObjectIds,
  objectsAtCell,
  containedObjectIds,
} from '../selection/object-selection.js';
import { collectionsUI } from '../components/collections-ui.js';
import { objectHidden } from '../components/collections.js';
import { frameBounds, pointBounds } from '../view/frame-bounds.js';
import { SketchBrowser } from '../sketch/sketch-browser.js';
import { savedViewsUI } from '../view/saved-views-ui.js';
import { generationLinks } from '../modeling/generation-links.js';
import { measurementUI } from '../measurement/measurement-ui.js';
import { createDesignCommands } from './design-commands.js';
import { commandSearch } from './command-search.js';
import { sceneShortcutBlocked, textEditing, dialogOwnsKeyboard } from './keyboard-context.js';
import { isolationUI } from '../view/isolation-ui.js';
import { cadLayout } from './cad-layout.js';
import { workspaceUI } from './workspace-ui.js';
import { designerUI } from '../modeling/designer-ui.js';
import { constructionUI } from '../modeling/construction-ui.js';
import { directEdit } from '../selection/direct-edit.js';
import { AssetUI } from '../materials/asset-ui.js';
export function cadShell({
  THREE,
  $,
  call,
  library,
  prepareIntentPersistence,
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
  getSummary,
  projectPoint,
  scene,
  getCamera,
  navigation,
  requestRender,
}) {
  let workspace = null,
    sketchBrowser = null,
    collectionBrowser = null;
  const {
    file,
    site,
    output,
    modify,
    build,
    motion,
    component,
    advanced,
    history,
    objects,
    labels,
    brushOptions,
  } = cadLayout({ $, chooseTool, library, notice, requestMaterial });
  const materialPicker = new MaterialPicker({ $, openShelf: () => dock('assets') });
  let activeDock = 'objects';
  let selectionActive = false;
  const selectionBinding = new ObjectSelectionBinding();
  const wholeObjectIds = () => (selectionActive && objectOnly ? [...selectionBinding.ids] : []);
  let selectedObjects = new Set(),
    objectCandidates = new Set(),
    objectOnly = false,
    selectionWorkspace = null;
  const operations = new OperationSession({
    operations: () => [
      { id: 'direct', controller: direct, close: direct.cancel },
      { id: 'construction', controller: construction, close: construction.close },
      { id: 'designer', controller: designer, close: designer.close },
      { id: 'measurement', controller: measurement, close: measurement.close },
    ],
    notice,
  });
  const busyReason = () =>
    operations.busyReason() || (getSummary()?.preview ? '请先采用或取消 AI 提案预览' : '');
  const selectionReason = () =>
    busyReason() || (!selectionActive ? '请先选择方块、对象或区域' : '');
  function prepareOperation(owner) {
    if (!operations.prepare(owner)) return false;
    chooseTool('inspect');
    return true;
  }
  const assets = AssetUI({
    THREE,
    $,
    call,
    library,
    notice,
    download,
    task,
    host: $('dock-assets'),
    getSelection: () => (selectionActive ? structuredClone(studio.getSelection()) : null),
    onChoose: (state, name) => {
      if (materialPicker.choose(state, name)) return 'parameter';
      $('block-id').value = state.Name;
      $('block-properties').value = state.Properties ? JSON.stringify(state.Properties) : '';
      materialChanged(state, name);
      notice('当前素材：' + name);
      return 'brush';
    },
  });
  $('cad-inspector').insertBefore(assets.detail, $('cad-selected-properties'));
  function requestMaterial(callback, owner, node, label) {
    materialPicker.request(callback, owner, node, label);
  }
  materialPicker.observe(build.dialog, 'open');
  function dock(name) {
    if (name !== 'assets') materialPicker.clear();
    activeDock = name;
    for (const n of ['objects', 'assets', 'components']) $('dock-' + n).hidden = n !== name;
    document
      .querySelectorAll('[data-dock]')
      .forEach((b) => b.classList.toggle('active', b.dataset.dock === name));
    name === 'assets' ? assets.activate() : assets.deactivate();
    assets.detail.hidden =
      name !== 'assets' && document.querySelector('[data-tool].active')?.dataset.tool === 'inspect';
    workspace?.showDock(name);
  }
  document.querySelectorAll('[data-dock]').forEach((b) => (b.onclick = () => dock(b.dataset.dock)));
  const open = (d) => {
    if (!operations.prepare(null)) return;
    materialPicker.clear();
    for (const other of [file, site, output, modify, build, motion, component, advanced, history])
      if (other !== d && other.dialog.open) other.dialog.close();
    if (!workspace?.openDialog(d.dialog)) d.dialog.showModal();
    syncVectors();
  };
  for (const [id, d] of [
    ['cad-modify-open', modify],
    ['cad-create-open', build],
    ['cad-selection-modify', modify],
    ['cad-group-selection', component],
  ])
    $(id).onclick = () => open(d);
  $('cad-components-open').onclick = () => dock('components');
  window.addEventListener('craftstudio-prefab-create', () => {
    if (!selectionActive) return notice('先在场景选择建筑或方块，再创建构件');
    open(component);
  });
  $('cad-empty-file').onclick = () => open(file);
  $('cad-empty-assets').onclick = () => {
    dock('assets');
    chooseTool('place');
  };
  $('cad-material-chip').onclick = () => {
    materialPicker.clear();
    dock('assets');
  };
  $('cad-assets-open').onclick = () => {
    materialPicker.clear();
    dock('assets');
  };
  $('cad-ai-open').onclick = () => $('ai-dialog').showModal();
  $('cad-component-library').onclick = () => {
    $('library-filter').value = 'component';
    $('library-query').value = '';
    $('open-library').click();
  };
  $('asset-edit-advanced').onclick = () => open(advanced);
  const vectors = [];
  for (const [id, names] of [
    ['studio-min', ['X', 'Y', 'Z']],
    ['studio-max', ['X', 'Y', 'Z']],
    ['studio-at', ['X', 'Y', 'Z']],
    ['studio-step', ['X', 'Y', 'Z']],
    ['studio-travel', ['X', 'Y', 'Z']],
    ['studio-size', ['宽', '深', '高']],
    ['edit-min', ['X', 'Y', 'Z']],
    ['edit-max', ['X', 'Y', 'Z']],
    ['platform-min', ['X', 'Z']],
    ['platform-max', ['X', 'Z']],
    ['protect-min', ['X', 'Y', 'Z']],
    ['protect-max', ['X', 'Y', 'Z']],
    ['mca-min', ['X', 'Y', 'Z']],
    ['mca-max', ['X', 'Y', 'Z']],
  ]) {
    const original = $(id);
    if (!original) continue;
    const group = document.createElement('div');
    group.className = 'cad-vector';
    const inputs = names.map((name, i) => {
      const l = document.createElement('label');
      l.textContent = name;
      const field = document.createElement('input');
      field.type = 'number';
      field.step = '1';
      field.dataset.vector = id;
      field.dataset.axis = i;
      field.setAttribute(
        'aria-label',
        original.closest('label')?.firstChild.textContent.trim() + ' ' + name,
      );
      field.oninput = () => (original.value = inputs.map((n) => n.value || '0').join(' '));
      l.append(field);
      group.append(l);
      return field;
    });
    original.hidden = true;
    original.after(group);
    vectors.push({ original, inputs });
  }
  function syncVectors() {
    $('download-selection').disabled = !selectionActive;
    for (const v of vectors) {
      const parts = v.original.value.trim().split(/[\s,]+/);
      v.inputs.forEach((n, i) => (n.value = parts[i] ?? '0'));
    }
    const min = $('studio-min').value.split(' ').map(Number),
      max = $('studio-max').value.split(' ').map(Number);
    $('cad-selection-label').textContent = selectionActive
      ? '已选区域 · ' +
        max.map((n, a) => n - min[a] + 1).join(' × ') +
        ' 格' +
        (studio.getSelection().regions?.length > 1
          ? ' · ' + studio.getSelection().regions.length + ' 个组合区域'
          : '')
      : '点击或拖框选择；Shift 增加，Ctrl 减去。';
    syncObjectSelectionLabel();
  }
  function syncObjectSelectionLabel() {
    if (!selectedObjects.size || !objectOnly || !selectionBinding.ids.length) return false;
    const named = getSummary().design.objects.filter((object) => selectedObjects.has(object.id));
    if (!named.length) return false;
    $('cad-selection-label').textContent =
      named.length === 1
        ? named[0].name + ' · ' + (named[0].cells?.length || 0) + ' 格'
        : '已选择 ' + named.length + ' 个对象';
    return true;
  }
  const direct = directEdit({
    beforeOpen: () => prepareOperation('direct'),
    selectResult: (selection, mode) => {
      if (['move', 'rotate'].includes(mode) && selectionBinding.matches(selection))
        selectObjects([...selectionBinding.ids]);
      else studio.selectRange(selection, 'replace');
    },
    THREE,
    $,
    scene,
    getCamera,
    renderer,
    navigation,
    requestRender,
    call,
    refresh,
    render,
    markDirty,
    policy,
    studio,
    hasSelection: () => selectionActive,
    notice,
    cast,
    hitCell,
    getSummary,
  });
  for (const [id, mode] of [
    ['cad-move-direct', 'move'],
    ['cad-copy-direct', 'copy'],
    ['cad-rotate-direct', 'rotate'],
  ])
    $(id).onclick = async () => {
      direct.begin(mode);
      if (mode === 'copy') direct.copy();
    };
  window.addEventListener('craftstudio-prefab-drop', (e) => {
    direct.begin('paste', e.detail);
  });
  const pasteButton = document.createElement('button');
  pasteButton.id = 'cad-paste-direct';
  pasteButton.textContent = '粘贴';
  pasteButton.title = 'Ctrl+V · 先复制选择';
  pasteButton.onclick = () => {
    direct.paste();
  };
  $('cad-copy-direct').after(pasteButton);
  function repeatReason() {
    return (
      selectionReason() ||
      (direct.isActive()
        ? '先确认或取消当前变换'
        : !direct.canRepeat()
          ? '先确认一次移动、复制或旋转'
          : '')
    );
  }
  function repeatTransform() {
    const reason = repeatReason();
    if (reason) return notice(reason);
    modify.dialog.close();
    construction.close();
    designer.close();
    direct.repeat();
  }
  const repeatButton = document.createElement('button');
  repeatButton.id = 'cad-repeat-transform';
  repeatButton.textContent = '重复上次变换 · 预览';
  repeatButton.title = 'Shift+R · 对当前选择复用上次已确认的移动、复制或旋转';
  repeatButton.onclick = repeatTransform;
  modify.body.prepend(repeatButton);

  const construction = constructionUI({
    beforeOpen: () => prepareOperation('construction'),
    getSummary,
    library,
    prepareIntentPersistence,
    hasSelection: () => selectionActive,
    materialName: assets.labelName,
    THREE,
    $,
    scene,
    getCamera,
    renderer,
    call,
    refresh,
    render,
    markDirty,
    studio,
    policy,
    notice,
    navigation,
    requestRender,
    cast,
    hitCell,
    onGuideHandoff: () => workspace.selectCategory('model'),
    onGuideEditingChange: (id) => {
      sketchBrowser?.setEditing(id);
      if (id) {
        collectionBrowser?.reveal({ guideIds: [id] });
        sketchBrowser?.reveal(id);
      }
    },
    pickMaterial: (callback, label) =>
      requestMaterial(callback, construction, $('construction-panel'), label || '建模材料'),
  });
  materialPicker.observe($('construction-panel'), 'hidden');
  window.addEventListener('craftstudio-edit-sketch', (e) => {
    construction.editSaved(e.detail.id);
  });
  for (const [id, label, type] of [
    ['cad-figure', '图形 / 曲线', 'geometry'],
    ['cad-terrain', '地形', 'terrain'],
    ['cad-feature', '拉伸 / 放样', 'feature'],
  ]) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = label;
    button.onclick = () => {
      construction.open(type);
    };
    $('cad-create-open').after(button);
  }

  const designer = designerUI({
    beforeOpen: () => prepareOperation('designer'),
    THREE,
    $,
    scene,
    call,
    refresh,
    render,
    markDirty,
    policy,
    getSelection: () => studio.getSelection(),
    getObjects: () => {
      if (selectionBinding.ids.length && objectOnly) return [...selectionBinding.ids];
      const r = studio.getSelection();
      if (r.regions) return [];
      return (getSummary()?.design.objects || [])
        .filter(
          (o) => o.min.every((n, a) => n === r.min[a]) && o.max.every((n, a) => n === r.max[a]),
        )
        .map((o) => o.id);
    },
    getSummary,
    materialName: assets.labelName,
    pickMaterial: (callback, label) =>
      requestMaterial(callback, designer, $('designer-panel'), label || '排列 / 编辑材料'),
    notice,
    requestRender,
  });
  materialPicker.observe($('designer-panel'), 'hidden');
  const designerButton = document.createElement('button');
  designerButton.id = 'cad-designer';
  designerButton.textContent = '排列 / 编辑';
  designerButton.onclick = () => {
    designer.open();
  };
  $('cad-modify-open').after(designerButton);
  const objectTree = new ObjectTreeUI({
    host: objects,
    onSelect: (id, event) => {
      if (!operations.allow()) return;
      direct.cancel();
      const mode = event.ctrlKey
        ? 'subtract'
        : event.shiftKey
          ? 'add'
          : $('cad-selection-mode').value;
      selectObjects([id], mode);
      if (designer.isActive()) {
        if (selectionActive) designer.open();
        else designer.close();
      }
    },
    onFrame: frameBlockSelection,
    onChange: (id, property, value) => {
      if (!operations.allow()) return;
      task(async () => {
        refresh(
          await call('studio', { command: 'object', id, [property]: value, policy: policy() }),
        );
        markDirty();
        await render();
      });
    },
    onEditGuide: (id) =>
      window.dispatchEvent(new CustomEvent('craftstudio-edit-sketch', { detail: { id } })),
    onEditFeature: (objectId) =>
      window.dispatchEvent(new CustomEvent('craftstudio-edit-feature', { detail: { objectId } })),
    onDetach: (id) => {
      if (!operations.allow()) return;
      task(async () => {
        refresh(await call('detachGeneration', { id }));
        markDirty();
        notice('已断开生成关联，方块保持原样，可撤销');
      });
    },
  });
  const componentContext = componentContextUI({
    $,
    getSummary,
    getObjectIds: wholeObjectIds,
    selectObjects,
    notice,
    openOperation: (operation, id) => {
      if (!operations.prepare('designer')) return;
      selectObjects([id]);
      chooseTool('inspect');
      designer.open(operation, { objectIds: [id] });
    },
  });
  const viewPresets = savedViewsUI({
    $,
    getSummary,
    getView: () => window.CraftStudio.viewState(),
    setView: (state) => window.CraftStudio.setView(state),
    getDisplay: () => window.CraftStudio.displayState(),
    setDisplay: (state) => window.CraftStudio.setDisplay(state),
    call,
    refresh,
    render,
    markDirty,
    notice,
    task,
  });
  const measurement = measurementUI({
    highlightSources: (ids) => construction.highlightSources(ids),
    THREE,
    $,
    scene,
    renderer,
    cast,
    getSummary,
    getCamera,
    call,
    refresh,
    render,
    markDirty,
    notice,
    requestRender,
    beforeOpen: () => prepareOperation('measurement'),
  });
  window.addEventListener('craftstudio-selection', () => {
    selectionBinding.clear();
    objectCandidates.clear();
    objectOnly = false;
    selectedObjects.clear();
    for (const row of objects.children) row.classList.remove('selected');
    selectionActive = true;
    syncVectors();
    componentContext.update();
    objectNames.update(getSummary());
  });
  $('cad-selection-clear').onclick = () => {
    selectionBinding.clear();
    $('pick-close').click();
    studio.clearSelection();
    direct.cancel();
    selectionActive = false;
    objectCandidates.clear();
    objectOnly = false;
    selectedObjects.clear();
    for (const row of objects.children) row.classList.remove('selected');
    $('cad-selection-label').textContent = '尚未选择对象';
    componentContext.update();
    objectNames.update(getSummary());
  };
  const objectNames = objectNameUI({
    $,
    getSummary,
    task,
    getObjectIds: () => (selectionActive && objectOnly ? [...selectedObjects] : []),
    getObjectId: () =>
      selectionActive && objectOnly && selectedObjects.size === 1 ? [...selectedObjects][0] : null,
    isOperating: () =>
      direct.isActive() || construction.isActive() || designer.isActive() || measurement.isActive(),
    call,
    refresh,
    markDirty,
    notice,
  });
  const names = ['文件', '场地与视图', '设计', '保存 / 导出'];
  document.querySelectorAll('#steps [data-step]').forEach((b, i) => (b.textContent = names[i]));
  const advancedAi = document.createElement('details');
  advancedAi.className = 'card';
  advancedAi.innerHTML = '<summary>高级：导入外部 AI 的结构数据</summary>';
  const aiJson = $('ai-json').closest('label');
  aiJson.before(advancedAi);
  advancedAi.append(aiJson);
  $('ai-preview').textContent = '查看方案';
  $('ai-open').hidden = true;
  function toolChanged(tool) {
    materialPicker.clear();
    if (measurement.isActive()) measurement.close();
    brushOptions.toolChanged(tool);
    if (tool !== 'inspect') {
      direct.cancel();
      construction.close();
      designer.close();
    }
    $('cad-active-tool').textContent = labels[tool] || tool;
    const s = getSummary();
    $('cad-empty').hidden = tool !== 'inspect' || !!(s?.sourceBlocks || s?.changes);
    $('cad-brush-settings').hidden = !['paint', 'erase'].includes(tool);
    assets.detail.hidden = tool === 'inspect' && activeDock !== 'assets';
  }
  window.addEventListener('craftstudio-asset-selected', () => {
    if (
      activeDock === 'assets' ||
      document.querySelector('[data-tool].active')?.dataset.tool !== 'inspect'
    )
      assets.detail.hidden = false;
  });
  collectionBrowser = collectionsUI({
    $,
    call,
    refresh,
    render,
    markDirty,
    task,
    getSummary,
    getObjectIds: () => [...selectedObjects],
    selectObjects,
    objects,
  });
  const selectionSets = new SelectionSetsUI({
    $,
    call,
    refresh,
    markDirty,
    task,
    getSummary,
    getObjectIds: wholeObjectIds,
    getSelection: () => (selectionActive ? studio.getSelection() : null),
    selectObjects,
    selectRegion: (selection) => studio.selectRange(selection, 'replace'),
    notice,
  });
  $('cad-object-search').oninput = collectionBrowser.filter;
  $('cad-history').onclick = () => {
    const s = getSummary();
    history.body.replaceChildren();
    const p = document.createElement('p');
    p.textContent = s.undo
      ? '可撤销 ' + s.undo + ' 次操作；保存正式版本后可从工程库打开历史版本。'
      : '当前没有未撤销的编辑记录。';
    history.body.append(p);
    const b = document.createElement('button');
    b.textContent = '查看工程版本';
    b.onclick = () => {
      history.dialog.close();
      $('open-library').click();
    };
    history.body.append(b);
    open(history);
  };
  for (const [id, position] of [
    ['cad-view-front', [0, 0, 1]],
    ['cad-view-side', [1, 0, 0]],
    ['cad-view-top', [0, 1, 0.001]],
    ['cad-view-iso', [1, 0.8, 1]],
  ])
    $(id).onclick = () => {
      const s = getSummary();
      if (!s) return;
      const target = s.size.map((n) => n / 2),
        distance = Math.max(...s.size) * 1.5;
      window.CraftStudio.setView({
        position: target.map((n, a) => n + position[a] * distance),
        target,
        projection: 'orthographic',
      });
    };
  const menu = viewportContextMenu({
    canvas: renderer.domElement,
    items: [
      { label: '聚焦选择 F', run: () => zoomSelection(), reason: () => selectionReason() },
      {
        label: '隔离编辑',
        run: () => $('isolation-enter').click(),
        reason: () => selectionReason(),
      },
      { label: '移动 M', run: () => runCommand('move'), reason: () => selectionReason() },
      { label: '复制 C', run: () => runCommand('copy'), reason: () => selectionReason() },
      { label: '旋转 R', run: () => runCommand('rotate'), reason: () => selectionReason() },
      { label: '重复上次变换 Shift+R', run: repeatTransform, reason: repeatReason },
      { label: '更多变换参数', run: () => open(modify), reason: () => selectionReason() },
      {
        label: '重命名 F2',
        run: () => objectNames.begin(),
        reason: () => selectionReason() || (!selectedObjects.size ? '请先选择命名对象' : ''),
      },
      { label: '建立对象', run: () => open(component), reason: () => selectionReason() },
      { label: '保存为构件', run: () => open(component), reason: () => selectionReason() },
      { label: '选择素材', run: () => dock('assets') },
      { label: '总览', run: () => $('fit').click() },
    ],
  });
  const contextMenu = menu.element;
  let pointer = null,
    marquee = null;
  renderer.domElement.addEventListener(
    'wheel',
    (e) => {
      if (
        !e.ctrlKey ||
        !['paint', 'erase'].includes(document.querySelector('[data-tool].active')?.dataset.tool)
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const sizes = [1, 3, 5, 7, 9],
        i = sizes.indexOf(Number($('brush-size').value));
      $('brush-size').value = sizes[Math.max(0, Math.min(4, i + (e.deltaY < 0 ? 1 : -1)))];
      $('brush-size').onchange();
      notice('画笔直径 ' + $('brush-size').value + ' 格');
    },
    { capture: true, passive: false },
  );
  function pickObject(e, hit) {
    if (
      $('cad-selection-target').value !== 'objects' ||
      e.button !== 0 ||
      !pointer ||
      pointer.button !== 0 ||
      Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 5 ||
      hasOperation() ||
      renderer.domElement.style.cursor === 'grab' ||
      !document.querySelector('[data-tool="inspect"].active')
    )
      return;
    if (!hit || hit.object.userData.plane || hit.object.userData.readOnly) return;
    const position = hitCell(hit).pos,
      candidates = objectsAtCell(getSummary().design, position);
    if (!candidates.length) return;
    const current = candidates.findIndex((o) => selectedObjects.has(o.id)),
      index = e.altKey ? (current + 1) % candidates.length : Math.max(0, current),
      object = candidates[index];
    selectObjects([object.id], pointer.operation);
    pointer = null;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (candidates.length > 1)
      notice('已选 ' + object.name + ' · 重叠 ' + candidates.length + ' 个对象；Alt+点击切换');
    return true;
  }
  renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointer = {
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      start: e.button === 0 ? cast(e) : null,
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      operation: e.ctrlKey ? 'subtract' : e.shiftKey ? 'add' : $('cad-selection-mode').value,
    };
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (
      !pointer ||
      pointer.button !== 0 ||
      document.querySelector('[data-tool="inspect"]').classList.contains('active') === false ||
      e.altKey ||
      direct.isActive() ||
      construction.isActive() ||
      designer.isActive() ||
      renderer.domElement.style.cursor === 'grab'
    )
      return;
    if (Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) < 8) return;
    if (!marquee) {
      marquee = document.createElement('div');
      marquee.id = 'cad-marquee';
      document.body.append(marquee);
    }
    const crossing = e.clientX < pointer.x;
    marquee.dataset.crossing = String(crossing);
    marquee.dataset.operation = pointer.operation;
    marquee.dataset.label =
      { replace: '重新选择', add: '增加', subtract: '减去', intersect: '保留交集' }[
        pointer.operation
      ] +
      ' · ' +
      (crossing ? '相交选入 ←' : '完整框入 →') +
      ' · Esc 取消';
    Object.assign(marquee.style, {
      left: Math.min(pointer.x, e.clientX) + 'px',
      top: Math.min(pointer.y, e.clientY) + 'px',
      width: Math.abs(e.clientX - pointer.x) + 'px',
      height: Math.abs(e.clientY - pointer.y) + 'px',
    });
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pointer) return;
    if (pointer.button === 2 && Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) < 5) {
      menu.open(e.clientX, e.clientY);
    }
    if (marquee) {
      const rect = renderer.domElement.getBoundingClientRect(),
        lo = [Math.min(pointer.x, e.clientX), Math.min(pointer.y, e.clientY)],
        hi = [Math.max(pointer.x, e.clientX), Math.max(pointer.y, e.clientY)],
        crossing = e.clientX < pointer.x;
      const selected = (getSummary()?.design.objects || []).filter((o) => {
        if (objectHidden(getSummary().design, o)) return false;
        const points = [];
        for (const x of [o.min[0], o.max[0] + 1])
          for (const y of [o.min[1], o.max[1] + 1])
            for (const z of [o.min[2], o.max[2] + 1]) {
              const p = projectPoint([x, y, z]);
              points.push([
                rect.left + ((p.x + 1) * rect.width) / 2,
                rect.top + ((1 - p.y) * rect.height) / 2,
                p.z,
              ]);
            }
        if (points.every((p) => p[2] < -1 || p[2] > 1)) return false;
        const a = [0, 1].map((i) => Math.min(...points.map((p) => p[i]))),
          b = [0, 1].map((i) => Math.max(...points.map((p) => p[i])));
        return crossing
          ? a.every((n, i) => n <= hi[i]) && b.every((n, i) => n >= lo[i])
          : a.every((n, i) => n >= lo[i]) && b.every((n, i) => n <= hi[i]);
      });
      if (selected.length) {
        const min = [0, 1, 2].map((a) => Math.min(...selected.map((o) => o.min[a]))),
          max = [0, 1, 2].map((a) => Math.max(...selected.map((o) => o.max[a])));
        selectObjects(
          selected.map((o) => o.id),
          pointer.operation,
        );
        $('pick-panel').hidden = true;
      } else {
        const last = cast(e);
        if (
          pointer.start &&
          last &&
          !pointer.start.object.userData.readOnly &&
          !last.object.userData.readOnly
        ) {
          const a = hitCell(pointer.start).pos,
            b = hitCell(last).pos;
          studio.selectRange(
            { min: a.map((n, i) => Math.min(n, b[i])), max: a.map((n, i) => Math.max(n, b[i])) },
            pointer.operation,
          );
        }
      }
      marquee.remove();
      marquee = null;
    }
    pointer = null;
  });
  const cancelMarquee = () => {
    pointer = null;
    marquee?.remove();
    marquee = null;
  };
  renderer.domElement.addEventListener('pointercancel', cancelMarquee);
  window.addEventListener('blur', cancelMarquee);
  window.addEventListener(
    'keydown',
    (e) => {
      if (
        !marquee ||
        e.key !== 'Escape' ||
        dialogOwnsKeyboard() ||
        textEditing(document.activeElement)
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      cancelMarquee();
      notice('已取消本次框选，原选择保留');
    },
    true,
  );
  window.addEventListener('keydown', (e) => {
    if (dialogOwnsKeyboard()) return;
    if (e.target.closest?.('[data-shortcut-scope=commands]')) return;
    if (e.defaultPrevented || e.isComposing) return;
    if (sceneShortcutBlocked(document.activeElement) && ['c', 'v'].includes(e.key.toLowerCase()))
      return;
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      direct.copy();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      direct.paste();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      $('quick-save').click();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      open(file);
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      dock('assets');
      $('asset-query').focus();
    }
    if (sceneShortcutBlocked(document.activeElement)) return;
    if (!e.ctrlKey && !e.altKey) {
      if (e.key.toLowerCase() === 'm') runCommand('move');
      if (e.key.toLowerCase() === 'c') runCommand('copy');
      if (e.key.toLowerCase() === 'r') {
        if (e.shiftKey) {
          e.preventDefault();
          repeatTransform();
        } else runCommand('rotate');
      }
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (!selectionActive) {
        notice('先选中要删除的方块或对象');
        return;
      }
      task(async () => {
        refresh(
          await call('studio', {
            command: 'deleteSelection',
            ...studio.getSelection(),
            policy: policy(),
          }),
        );
        await render();
        markDirty();
        $('cad-selection-clear').click();
        notice('已删除选择，可按 Ctrl+Z 撤销');
      });
    }
    if (e.key === 'Escape') {
      contextMenu.hidden = true;
      for (const d of [modify, build, motion, component, advanced, history]) d.dialog.close();
    }
  });
  renderer.domElement.addEventListener('dragover', (e) => e.preventDefault());
  renderer.domElement.addEventListener('drop', (e) => {
    const json = e.dataTransfer.getData('application/craftstudio-block');
    if (!json) return;
    e.preventDefault();
    const hit = cast(e);
    if (!hit || hit.object.userData.readOnly) return;
    let state;
    try {
      state = JSON.parse(json);
    } catch {
      return;
    }
    const pos = hitCell(hit, true).pos;
    task(async () => {
      refresh(
        await call('edit', {
          operations: [{ type: 'set', pos, state, reason: '拖入素材' }],
          policy: policy(),
        }),
      );
      await render();
      markDirty();
    });
  });

  const hasOperation = () =>
    direct.isActive() || construction.isActive() || designer.isActive() || measurement.isActive();
  function handleHistory(direction) {
    if (
      construction.expressionHistory(direction) ||
      construction.drawingHistory(direction) ||
      construction.parameterHistory(direction) ||
      direct.previewHistory(direction) ||
      designer.parameterHistory(direction) ||
      measurement.previewHistory(direction)
    )
      return true;
    if (!hasOperation()) return false;
    if (operations.busyReason()) {
      notice('正在提交当前操作，请稍候');
      return true;
    }
    if (direction === 'redo') {
      notice('请先确认或取消当前预览，再重做场景操作');
      return true;
    }
    direct.cancel();
    construction.close();
    designer.close();
    measurement.close();
    notice('已取消当前预览，场景中的已确认改动保持原样');
    return true;
  }
  window.addEventListener(
    'keydown',
    (e) => {
      if (dialogOwnsKeyboard()) return;
      if (e.target.closest?.('[data-shortcut-scope=commands]')) return;
      if (
        e.defaultPrevented ||
        e.isComposing ||
        sceneShortcutBlocked(document.activeElement) ||
        (!hasOperation() && !getSummary()?.preview)
      )
        return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopImmediatePropagation();
        notice('当前正在预览；Enter 确认，Esc 取消后可删除选择');
      }
    },
    true,
  );
  function syncSaveScope() {
    const button = $('quick-save');
    if (!button.dataset.baseLabel) {
      button.dataset.baseLabel = button.textContent;
      button.dataset.baseTitle = button.title;
    }
    const pending = hasOperation();
    const label = pending ? '保存已确认部分' : button.dataset.baseLabel;
    if (button.textContent !== label) button.textContent = label;
    button.title = pending
      ? '当前预览尚未确认；保存已有方案，预览仍可继续'
      : button.dataset.baseTitle;
  }
  const syncHistory = () => {
    syncSaveScope();
    const picking = construction.drawingState(),
      parameters = construction.parameterState(),
      directHistory = direct.historyState(),
      designerHistory = designer.parameterState(),
      measurementHistory = measurement.historyState(),
      drawing = directHistory.active
        ? directHistory
        : designerHistory.active
          ? designerHistory
          : measurementHistory.active
            ? measurementHistory
            : picking.active
              ? picking
              : parameters;
    $('undo').disabled = drawing.active
      ? !drawing.undo
      : !hasOperation() && !getSummary()?.preview && !getSummary()?.undo;
    $('redo').disabled = drawing.active
      ? !drawing.redo
      : hasOperation() || !!getSummary()?.preview || !getSummary()?.redo;
  };
  const operationObserver = new MutationObserver(syncHistory);
  for (const id of ['direct-edit-bar', 'construction-panel', 'designer-panel', 'measurement-panel'])
    operationObserver.observe($(id), {
      attributes: true,
      attributeFilter: ['hidden', 'data-drawing-points', 'data-local-history'],
    });
  const title = $('scene-title'),
    titleInput = document.createElement('input');
  titleInput.id = 'cad-project-name';
  titleInput.hidden = true;
  titleInput.setAttribute('aria-label', '工程名称');
  title.after(titleInput);
  title.title = '双击修改工程名称';
  title.ondblclick = () => {
    titleInput.value = $('save-title').value || title.textContent;
    title.hidden = true;
    titleInput.hidden = false;
    titleInput.focus();
    titleInput.select();
  };
  let naming = false;
  async function finishName(cancel = false) {
    if (titleInput.hidden || naming) return;
    const name = titleInput.value.trim();
    titleInput.hidden = true;
    title.hidden = false;
    if (cancel || !name) return;
    naming = true;
    try {
      $('save-title').value = name;
      refresh(await call('rename', { name }));
      markDirty();
    } catch (e) {
      notice(e.message, true);
    } finally {
      naming = false;
    }
  }
  titleInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishName();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      finishName(true);
    }
  };
  titleInput.onblur = () => finishName();
  sketchBrowser = new SketchBrowser({
    $,
    frameGuide,
    editSaved: (id) => {
      construction.editSaved(id);
    },
    openFromGuide: (id, operation) =>
      task(async () => {
        if (busyReason()) throw Error(busyReason());
        workspace.selectCategory('model');
        await construction.openFromGuide(id, operation);
      }),
  });
  $('cad-selection-focus').onclick = () => {
    if (!zoomSelection()) notice('请先选择对象或区域');
  };
  const isolation = isolationUI({
    $,
    call,
    refresh,
    render,
    task,
    getView: () => window.CraftStudio.viewState(),
    setView: (v) => window.CraftStudio.setView(v),
    getSelection: () => studio.getSelection(),
    getObjectIds: wholeObjectIds,
    hasSelection: () => selectionActive,
    notice,
    frameSelection: zoomSelection,
  });
  workspace = workspaceUI({
    $,
    construction,
    designer,
    direct,
    measurement,
    dock,
    chooseTool,
    library,
    notice,
  });
  window.addEventListener('craftstudio-edit-feature', (e) =>
    task(async () => {
      if (busyReason()) throw Error(busyReason());
      direct.cancel();
      construction.close();
      chooseTool('inspect');
      selectObjects([e.detail.objectId]);
      workspace.selectCategory('model');
      designer.open('editFeature', { objectIds: [e.detail.objectId] });
    }),
  );
  window.addEventListener('craftstudio-rebuild-offset', (e) =>
    task(async () => {
      if (busyReason()) throw Error(busyReason());
      direct.cancel();
      construction.close();
      chooseTool('inspect');
      workspace.selectCategory('model');
      designer.open('updateOffset', { guideId: e.detail.guideId, repair: !!e.detail.repair });
    }),
  );
  const commands = createDesignCommands({
    $,
    workspace,
    chooseTool,
    dock,
    direct,
    construction,
    designer,
    measurement,
    objectNames,
    viewPresets,
    operations,
    hasOperation,
    getSummary,
    hasNamedSelection: () => selectionActive && objectOnly && selectedObjects.size > 0,
    repeatTransform,
    repeatReason,
    busyReason,
    selectionReason,
    zoomSelection,
    openDelivery: () => open(output),
  });
  const commandMap = new Map(commands.map((command) => [command.id, command]));
  function runCommand(id) {
    const command = commandMap.get(id);
    const reason = command.unavailable();
    if (reason) return notice(reason);
    return command.run();
  }
  const commandFinder = commandSearch({ $, commands, library, notice, requestRender });
  viewPresets.mount();
  syncVectors();
  toolChanged('inspect');
  return {
    assets,
    pickObject,
    handleHistory,
    cancelOperations: () => {
      if (operations.busyReason()) throw Error('正在提交当前操作，请稍候');
      direct.cancel();
      construction.close();
      designer.close();
      measurement.close();
    },
    hasWorkplaneGrid: () => construction.hasWorkplaneGrid(),
    toggleWorkplaneGrid: () => construction.toggleWorkplaneGrid(),
    beforeToolChange: () => operations.allow(),
    brushConfig: brushOptions.config,
    hasSelection: () => selectionActive,
    openLegacy: (name) =>
      name === 'edit'
        ? enterWorkspace()
        : open({ import: file, check: site, save: output }[name] || file),
    enterWorkspace,
    toolChanged,
    update: (s) => {
      if (selectionWorkspace && selectionWorkspace !== s.workspaceId) {
        $('cad-selection-clear').click();
        for (const id of ['studio-min', 'studio-max', 'studio-at']) $(id).value = '0 0 0';
      }
      selectionWorkspace = s.workspaceId;
      const availableIds = new Set(s.design.objects.map((o) => o.id));
      if ([...objectCandidates].some((id) => !availableIds.has(id))) {
        objectCandidates = new Set([...objectCandidates].filter((id) => availableIds.has(id)));
        selectedObjects = new Set([...selectedObjects].filter((id) => availableIds.has(id)));
        objectOnly = false;
      }
      const links = generationLinks(s.design);
      commandFinder.update();
      direct.ensureFresh(s);
      const followed = selectionBinding.update(s);
      if (followed) {
        if (followed.ids.length) selectObjects(followed.ids);
        else $('cad-selection-clear').click();
      } else if (selectionActive && objectCandidates.size) {
        selectedObjects = containedObjectIds(
          s.design.objects,
          objectCandidates,
          studio.getSelection(),
        );
      }
      isolation.update(s);
      construction.update(s);
      designer.update(s);
      measurement.update(s);
      viewPresets.update(s);
      sketchBrowser.update(s, links);
      $('cad-empty').hidden = !!(
        s.sourceBlocks ||
        s.changes ||
        s.design?.guides?.length ||
        s.design?.measurements?.length ||
        hasOperation()
      );
      $('cad-original-row').textContent = s.sourceBlocks ? '▧ 原始场地 · 保留' : '▧ 尚未导入场地';
      assets
        .update(s)
        .then(() => materialChanged({ Name: $('block-id').value }))
        .catch((e) => notice(e.message, true));
      $('cad-change-summary').textContent =
        '新增 ' +
        s.add.toLocaleString() +
        ' · 替换 ' +
        s.replace.toLocaleString() +
        ' · 删除 ' +
        s.remove.toLocaleString();
      objectTree.update(s, links, selectedObjects);
      syncVectors();
      collectionBrowser.update(s, links);
      componentContext.update(s);
      objectNames.update(s);
      selectionSets.update(s);
    },
    materialName: assets.labelName,
    selection: () => syncVectors(),
    exportSelection: () => (selectionActive ? structuredClone(studio.getSelection()) : null),
    zoomSelection,
    isTransformActive: () =>
      direct.isActive() || construction.isActive() || designer.isActive() || measurement.isActive(),
    viewChanged: () => {
      direct.updateCamera();
      construction.viewChanged();
    },
    clearSelection: () => {
      $('cad-selection-clear').click();
    },
    materialChanged,
  };
  function selectObjects(ids, operation = 'replace') {
    if (!selectionActive && ['subtract', 'intersect'].includes(operation)) {
      notice('请先选择基础对象，再减去或取交集');
      return;
    }
    const previousCandidates = [...objectCandidates],
      previousObjectOnly = objectOnly;
    const list = getSummary()?.design.objects.filter((o) => ids.includes(o.id)) || [];
    if (!list.length) {
      $('cad-selection-clear').click();
      return;
    }
    const min = [0, 1, 2].map((a) => Math.min(...list.map((o) => o.min[a]))),
      max = [0, 1, 2].map((a) => Math.max(...list.map((o) => o.max[a])));
    studio.selectRange(
      { min, max, members: [...new Set(list.flatMap((o) => o.cells || []))] },
      operation,
    );
    objectCandidates = combineObjectIds(
      previousCandidates,
      ids,
      operation === 'replace' ? 'replace' : 'add',
    );
    objectOnly = operation === 'replace' || previousObjectOnly;
    const currentSelection = studio.getSelection(),
      contains = selectionPredicate(currentSelection),
      candidates = getSummary().design.objects.filter((o) => objectCandidates.has(o.id)),
      point = (p) => (Array.isArray(p) ? p : coords(p));
    selectedObjects = containedObjectIds(candidates, objectCandidates, currentSelection);
    if (objectOnly && !candidates.some((o) => o.cells?.some((p) => contains(point(p))))) {
      $('cad-selection-clear').click();
      return;
    }
    if (objectOnly)
      selectionBinding.bind({
        workspaceId: getSummary().workspaceId,
        revision: getSummary().revision,
        ids: [...selectedObjects],
        candidates,
        selection: currentSelection,
      });
    for (const row of objects.children)
      row.classList.toggle('selected', selectedObjects.has(row.dataset.objectId));
    $('pick-panel').hidden = true;
    if (!syncObjectSelectionLabel()) syncVectors();
    const revealed = ids.filter((id) => selectedObjects.has(id));
    if (revealed.length) collectionBrowser.reveal({ objectIds: revealed });
    componentContext.update();
    objectNames.update(getSummary());
  }
  function materialChanged(state, name) {
    $('cad-material-chip').textContent = (name || assets.labelName(state)) + ' ▾';
  }
  function frameSceneBounds(bounds) {
    if (!bounds) return false;
    const rect = renderer.domElement.getBoundingClientRect();
    window.CraftStudio.setView(
      frameBounds(
        window.CraftStudio.viewState(),
        bounds,
        Math.max(1, rect.width) / Math.max(1, rect.height),
      ),
    );
    return true;
  }
  function frameGuide(id) {
    const guide = getSummary()?.design.guides?.find((guide) => guide.id === id);
    return frameSceneBounds(pointBounds(guide?.points || []));
  }
  function zoomSelection() {
    return frameSceneBounds(construction.framingBounds()) || frameBlockSelection();
  }
  function frameBlockSelection() {
    if (!selectionActive) return false;
    return frameSceneBounds({
      min: $('studio-min').value.split(' ').map(Number),
      max: $('studio-max').value.split(' ').map(Number),
    });
  }
  function enterWorkspace() {
    for (const d of [file, site, output]) if (d.dialog.open) d.dialog.close();
    toolChanged(document.querySelector('[data-tool].active')?.dataset.tool || 'inspect');
  }
}
