import viewMarkup0 from './views/brush-ui-controls.html';
import { brushFields, normalizePreset, importPresets } from './brush-presets.js';
export function brushUI({ $, library, notice }) {
  const host = $('cad-brush-settings'),
    controls = document.createElement('section');
  controls.innerHTML = viewMarkup0;
  host.append(controls);
  let presets = [],
    tool = 'paint';
  const fields = brushFields;
  let presetBusy = false,
    presetReady = false,
    deleted = null;
  function config() {
    const mask = {
      surface: $('brush-surface').checked,
      matchPicked: $('brush-match-picked').checked,
      inSelection: $('brush-in-selection').checked,
      emptyOnly: tool !== 'erase' && $('brush-mode').value === 'draw' && $('brush-empty').checked,
    };
    for (const [a, id] of [
      ['minY', 'brush-min-y'],
      ['maxY', 'brush-max-y'],
    ])
      if ($(id).value !== '') mask[a] = Number($(id).value);
    return {
      mode: $('brush-mode').value,
      plane: $('brush-plane').value,
      mask,
      retainShape: $('brush-retain-shape').checked,
      preserveProperties: $('brush-preserve-props').checked,
    };
  }
  function update() {
    const c = config();
    $('brush-mode').closest('label').hidden = tool === 'erase';
    $('brush-plane-label').hidden = c.mode === 'paint' && tool !== 'erase';
    $('brush-paint-options').hidden = c.mode !== 'paint' || tool === 'erase';
    $('brush-empty').closest('label').hidden = c.mode !== 'draw' || tool === 'erase';
    $('brush-conditions').textContent =
      (tool === 'erase' ? '连续擦除' : c.mode === 'paint' ? '涂改已有' : '连续新增') +
      ' · ' +
      [
        c.mask.inSelection ? '当前选择' : '',
        c.mask.surface ? '表面' : '',
        c.mask.matchPicked ? '取样材料' : '',
        c.mask.emptyOnly ? '空位' : '',
        c.mask.minY !== undefined || c.mask.maxY !== undefined
          ? 'Y ' + (c.mask.minY ?? 0) + '–' + (c.mask.maxY ?? 4095)
          : '',
      ]
        .filter(Boolean)
        .join(' / ');
    window.dispatchEvent(new Event('craftstudio-brush-settings'));
  }
  $('brush-mode').onchange = () => {
    $('brush-surface').checked = $('brush-mode').value === 'paint';
    update();
  };
  for (const id of fields) if (id !== 'brush-mode') $(id).addEventListener('input', update);
  function options(selected = $('brush-preset').value) {
    const query = $('brush-preset-search').value.trim().toLowerCase();
    $('brush-preset').replaceChildren(
      ...[
        { name: '选择预设', id: '' },
        ...presets
          .map((p, i) => ({ name: p.name, id: String(i) }))
          .filter((p) => p.name.toLowerCase().includes(query)),
      ].map((p) => {
        const o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.name;
        return o;
      }),
    );
    $('brush-preset').value = [...$('brush-preset').options].some((o) => o.value === selected)
      ? selected
      : '';
    selection();
  }
  function selection() {
    const p = $('brush-preset').value === '' ? null : presets[+$('brush-preset').value];
    for (const id of ['brush-load-preset', 'brush-rename-preset', 'brush-delete-preset'])
      $(id).disabled = !p || presetBusy;
    if (p) $('brush-preset-name').value = p.name;
  }
  async function persist(next, selected = '', message = '预设已保存') {
    if (presetBusy) return;
    if (!presetReady) {
      notice('预设尚未读取完成，请稍候', true);
      return;
    }
    presetBusy = true;
    try {
      await library.preference('brush-presets', { schema: 1, presets: next });
      presets = next;
      options(selected);
      notice(message);
      return true;
    } catch (e) {
      notice(e.message, true);
    } finally {
      presetBusy = false;
      selection();
    }
  }
  function currentValues() {
    return Object.fromEntries(
      fields.map((id) => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]),
    );
  }
  $('brush-preset-search').oninput = () => options();
  $('brush-preset').onchange = selection;
  $('brush-save-preset').onclick = () => {
    try {
      const preset = normalizePreset({
          name: $('brush-preset-name').value,
          values: currentValues(),
        }),
        i = presets.findIndex((p) => p.name === preset.name),
        next = [...presets];
      if (i < 0) next.push(preset);
      else next[i] = preset;
      persist(next, String(i < 0 ? next.length - 1 : i));
    } catch (e) {
      notice(e.message, true);
    }
  };
  $('brush-load-preset').onclick = () => {
    const index = $('brush-preset').value;
    if (index === '') return;
    const p = presets[+index];
    if (!p) return;
    for (const [id, value] of Object.entries(p.values)) {
      if ($(id).type === 'checkbox') $(id).checked = value;
      else $(id).value = value;
    }
    update();
    notice('已载入 ' + p.name + '；当前选择在起笔时读取');
  };
  $('brush-rename-preset').onclick = () => {
    try {
      const index = $('brush-preset').value;
      if (index === '') return;
      const i = +index,
        p = normalizePreset({ ...presets[i], name: $('brush-preset-name').value });
      if (presets.some((item, j) => j !== i && item.name === p.name)) throw Error('同名预设已存在');
      const next = [...presets];
      next[i] = p;
      persist(next, index, '预设已重命名');
    } catch (e) {
      notice(e.message, true);
    }
  };
  $('brush-delete-preset').onclick = async () => {
    const index = $('brush-preset').value;
    if (index === '' || presetBusy) return;
    const item = presets[+index];
    if (
      await persist(
        presets.filter((p, i) => i !== +index),
        '',
        '预设已删除，可撤销',
      )
    ) {
      deleted = item;
      $('brush-undo-delete').disabled = false;
    }
  };
  $('brush-undo-delete').onclick = async () => {
    if (!deleted || presetBusy) return;
    const next = importPresets(
      { schema: 'craftstudio-brush-presets/1', presets: [deleted] },
      presets,
    );
    if (await persist(next, String(next.length - 1), '已恢复删除的预设')) {
      deleted = null;
      $('brush-undo-delete').disabled = true;
    }
  };
  $('brush-export-presets').onclick = () => {
    const blob = new Blob(
        [JSON.stringify({ schema: 'craftstudio-brush-presets/1', presets }, null, 2)],
        { type: 'application/json' },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'CraftStudio-brush-presets.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('brush-import-presets').onclick = () => $('brush-presets-file').click();
  $('brush-presets-file').onchange = async () => {
    try {
      const file = $('brush-presets-file').files[0];
      if (!file) return;
      if (file.size > 1048576) throw Error('预设文件过大');
      const next = importPresets(JSON.parse(await file.text()), presets);
      await persist(next, '', '预设已导入；同名条目另存副本');
    } catch (e) {
      notice(e.message, true);
    } finally {
      $('brush-presets-file').value = '';
    }
  };

  library
    .preference('brush-presets')
    .then((p) => {
      presets = p?.schema === 1 ? (p.presets || []).map(normalizePreset) : [];
      presetReady = true;
      options();
    })
    .catch((e) => notice('画笔预设读取失败：' + e.message, true));
  update();
  return {
    config,
    toolChanged: (value) => {
      tool = value;
      update();
    },
  };
}
