import { brushUI } from '../selection/brush-ui.js';
import leftMarkup from './views/cad-browser.html';
import rightMarkup from './views/cad-inspector.html';
import ribbonMarkup from './views/cad-ribbon.html';
import cubeMarkup from './views/cad-view-cube.html';
import emptyMarkup from './views/cad-empty.html';

export function cadLayout({ $, chooseTool, library, notice, requestMaterial }) {
  document.body.classList.add('cad-workspace');
  const main = document.querySelector('main'),
    oldAside = document.querySelector('main>aside');
  oldAside.id = 'legacy-aside';
  const left = document.createElement('aside');
  left.id = 'cad-browser';
  left.innerHTML = leftMarkup;
  main.prepend(left);
  const right = document.createElement('aside');
  right.id = 'cad-inspector';
  right.innerHTML = rightMarkup;
  main.append(right);
  function dialog(id, title) {
    const d = document.createElement('dialog');
    d.id = id;
    d.className = 'cad-dialog';
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.innerHTML = '<h2></h2><button>关闭</button>';
    header.querySelector('h2').textContent = title;
    header.querySelector('button').onclick = () => d.close();
    d.append(header);
    const body = document.createElement('div');
    body.className = 'cad-dialog-body';
    d.append(body);
    document.body.append(d);
    return { dialog: d, body };
  }
  const file = dialog('cad-file-dialog', '文件与资源'),
    site = dialog('cad-site-dialog', '场地与显示'),
    output = dialog('cad-output-dialog', '保存与导出'),
    modify = dialog('cad-modify-dialog', '变换与选区编辑'),
    build = dialog('cad-build-dialog', '辅助创建'),
    motion = dialog('cad-motion-dialog', '运动外观'),
    component = dialog('cad-component-dialog', '创建可复用构件'),
    advanced = dialog('cad-advanced-dialog', '高级方块设置'),
    history = dialog('cad-history-dialog', '编辑记录');
  for (const [name, d] of [
    ['import', file],
    ['check', site],
    ['save', output],
  ]) {
    const section = $('step-' + name);
    section.hidden = false;
    d.body.append(section);
  }
  const edit = $('step-edit'),
    tools = edit.querySelector('.tool-row');
  const ribbon = document.createElement('div');
  ribbon.id = 'cad-ribbon';
  ribbon.innerHTML = ribbonMarkup;
  document.querySelector('header').after(ribbon);
  $('cad-tools').append(...tools.children);
  const labels = { inspect: '选择', place: '放置', erase: '擦除', paint: '画笔', sample: '取材' };
  document.querySelectorAll('[data-tool]').forEach((b) => {
    b.textContent = labels[b.dataset.tool];
    b.title = {
      inspect: '选择 V · 左键选择，拖动框选',
      place: '放置 P · 每次一个方块',
      erase: '擦除 X',
      paint: '画笔 B · 拖动连续绘制',
    }[b.dataset.tool];
  });
  const sample = document.createElement('button');
  sample.dataset.tool = 'sample';
  sample.textContent = '取材';
  sample.title = '点击场景中的方块取材';
  sample.onclick = () => chooseTool('sample');
  $('cad-tools').append(sample);
  const chip = document.createElement('button');
  chip.id = 'cad-material-chip';
  chip.title = '更换当前素材';
  chip.textContent = '当前素材';
  $('cad-ribbon').insertBefore(chip, $('cad-active-tool'));
  const brush = edit.querySelector('.brush-settings');
  $('cad-brush-settings').append(brush);
  brush.querySelector('.small').textContent =
    '右键旋转，中键平移；空格＋左键临时旋转。Shift 画直线，E 取材，[ ] 调大小。';
  const brushOptions = brushUI({ $, library, notice });
  const material = $('block-id').closest('.card');
  advanced.body.append(material);
  $('block-search').hidden = true;
  $('block-list').hidden = true;
  const rules = $('allow-terrain').closest('.card');
  site.body.append(rules);
  modify.body.append($('edit-min').closest('details'));
  build.body.append($('platform-min').closest('details'));
  const panel = $('studio-panel');
  const take = (id, to) => {
    const node = $(id);
    if (!node) return;
    const unit = node.closest('label') || node;
    to.append(unit);
  };
  const fieldgroup = (title, to) => {
    const f = document.createElement('section');
    f.className = 'cad-form-group';
    f.innerHTML = '<h3></h3>';
    f.firstChild.textContent = title;
    to.append(f);
    return f;
  };
  const selection = fieldgroup('选择范围', modify.body);
  for (const id of ['studio-min', 'studio-max', 'studio-select', 'studio-drag'])
    take(id, selection);
  const transform = fieldgroup('移动、复制与阵列', modify.body);
  for (const id of [
    'studio-at',
    'studio-turn',
    'studio-mirror',
    'studio-count',
    'studio-step',
    'studio-copy',
    'studio-move',
  ])
    take(id, transform);
  const comp = fieldgroup('构件信息', component.body);
  for (const id of [
    'studio-name',
    'studio-register',
    'studio-prefab',
    'studio-prefab-library',
    'studio-prefab-file',
  ])
    take(id, comp);
  $('cad-components-container').append($('studio-prefabs'));
  const gen = fieldgroup('参数辅助（生成后可自由编辑）', build.body);
  for (const id of ['studio-kind', 'studio-size', 'studio-build', 'studio-demo']) take(id, gen);
  const roofLabel = $('studio-roof').closest('label');
  advanced.body.append(roofLabel);
  const roofButton = document.createElement('button');
  roofButton.id = 'cad-roof-material';
  roofButton.textContent = '选择屋顶素材';
  roofButton.onclick = () =>
    requestMaterial(
      (state, name) => {
        $('studio-roof').value = state.Name;
        $('cad-roof-material').textContent = '屋顶：' + name;
      },
      { isActive: () => build.dialog.open },
      build.dialog,
      '参数辅助 · 屋顶',
    );
  gen.append(roofButton);
  const objects = $('studio-objects');
  objects.classList.add('cad-object-tree');
  $('cad-object-list').append(objects);
  const animate = fieldgroup('选择装置与运动方式', motion.body);
  for (const id of [
    'studio-motion-target',
    'studio-motion-type',
    'studio-axis',
    'studio-rpm',
    'studio-travel',
    'studio-period',
    'studio-animation',
  ])
    take(id, animate);
  motion.body.append($('studio-route').closest('label'));
  motion.body.append($('create-panel'));
  motion.dialog.hidden = true;
  $('create-play').checked = true;
  $('create-demo').checked = true;
  $('create-rpm').value = '16';
  const merge = fieldgroup('区域裁切与蓝图合并', file.body);
  for (const id of ['studio-crop', 'studio-merge-air', 'studio-merge']) take(id, merge);
  panel.remove();
  const views = $('studio-views');
  views.open = true;
  site.body.append(views);
  edit.hidden = true;
  oldAside.hidden = true;
  const pick = $('pick-panel');
  $('cad-selected-properties').append(pick);
  pick.style.position = 'static';
  const toolbar = document.querySelector('.scene-toolbar');
  toolbar.querySelectorAll('button').forEach((b) => (b.title = b.textContent));
  const cube = document.createElement('div');
  cube.id = 'cad-view-cube';
  cube.innerHTML = cubeMarkup;
  $('scene').append(cube);
  document.querySelector('header .brand').after(document.querySelector('.scene-heading'));
  const samples = document.createElement('details');
  samples.className = 'card';
  samples.innerHTML = '<summary>示例工程与设计参考</summary>';
  for (const id of [
    'provided-source',
    'provided-demo',
    'trial-rebuild',
    'trial-redesign',
    'provided-plan',
  ])
    if ($(id)) samples.append($(id));
  file.body.append(samples);
  const empty = document.createElement('div');
  empty.id = 'cad-empty';
  empty.innerHTML = emptyMarkup;
  $('scene').append(empty);
  const statusText = document.querySelector('.gesture');
  statusText.textContent = '左键选择 / 拖框 · 右键旋转 · 中键平移 · F 总览';
  document.querySelector('.scene-heading .eyebrow').hidden = true;
  document.querySelector('.foot-right').textContent = '本地保存 · 每格一个方块';
  return {
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
  };
}
