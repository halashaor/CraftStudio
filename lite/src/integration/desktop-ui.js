import viewMarkup0 from './views/desktop-ui-dialog.html';
export function desktopUI({
  info,
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
  addResources,
}) {
  document.querySelector('.brand em').textContent = '本地';
  document.title = 'CraftStudio · 本地建筑设计';
  document.querySelector('.foot-right').textContent =
    (info.capabilities?.includes('local-engine/1')
      ? '本地计算'
      : info.requestedEngine === 'local'
        ? '本地计算未启用 · 浏览器计算'
        : '浏览器计算') +
    ' · SQLite 工程库 · v' +
    info.version;
  $('library-dialog').querySelector('.muted').textContent =
    '工程和版本保存在本机 SQLite 数据库；浏览器工程库首次连接时会迁入，原数据保留。';
  const dialog = document.createElement('dialog');
  dialog.id = 'desktop-dialog';
  dialog.className = 'cad-dialog';
  dialog.innerHTML = viewMarkup0;
  document.body.append(dialog);
  const button = document.createElement('button');
  button.id = 'desktop-files-open';
  button.className = 'full';
  button.textContent = '从 Minecraft 实例读取';
  button.onclick = () =>
    task(async () => {
      dialog.showModal();
      if (!$('desktop-instance').options.length) {
        $('desktop-report').textContent =
          '没有发现 Minecraft 实例；仍可手动选择文件。可配置 CRAFTSTUDIO_MINECRAFT_HOME。';
        return;
      }
      await loadFiles();
      const legacy = await fetch((info.baseUrl || '') + '/api/library').then((r) => r.json());
      $('desktop-legacy').replaceChildren(
        ...(legacy.items || []).map((p) => option(p.id, p.title)),
      );
    });
  document.querySelector('#cad-file-dialog .cad-dialog-body').prepend(button);
  const basic = document.createElement('button');
  basic.id = 'desktop-basic-resources';
  basic.textContent = '原版 + Create 基础素材';
  $('desktop-resources').before(basic);
  basic.onclick = () => {
    for (const name of ['schematic', 'world', 'resources'])
      $('desktop-' + name).hidden = name !== 'resources';
  };
  function option(value, label) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    return o;
  }
  $('desktop-instance').replaceChildren(
    ...info.instances.map((i) => option(i.id, i.id + ' · ' + i.loader)),
  );
  let files = null;
  async function json(url, body) {
    const r = await fetch(
        (info.baseUrl || '') + url,
        body
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CraftStudio-Token': info.token },
              body: JSON.stringify(body),
            }
          : {},
      ),
      value = await r.json();
    if (!r.ok || value.error) throw Error(value.error || '读取失败');
    return value;
  }
  async function loadFiles() {
    files = await json(
      '/api/desktop/files?instance=' + encodeURIComponent($('desktop-instance').value),
    );
    $('desktop-schematic-file').replaceChildren(
      ...files.schematics.map((p) => option(p.path, p.name)),
    );
    $('desktop-world-file').replaceChildren(...files.worlds.map((w) => option(w.id, w.id)));
    dimensions();
    const preferredCreate = files.resources
      .filter((r) => r.kind === 'mod' && /^create[-_]\d/i.test(r.name))
      .sort(
        (a, b) =>
          Number(a.name.includes('-local')) - Number(b.name.includes('-local')) ||
          b.name.localeCompare(a.name),
      )[0]?.name;
    $('desktop-resource-list').replaceChildren(
      ...files.resources.map((r, i) => {
        const label = document.createElement('label');
        label.className = 'check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = r.kind === 'vanilla' || r.name === preferredCreate;
        input.dataset.resource = i;
        label.append(
          input,
          document.createTextNode(
            { vanilla: '原版', mod: '模组', resourcepack: '材质包' }[r.kind] + ' · ' + r.name,
          ),
        );
        return label;
      }),
    );
    $('desktop-report').textContent =
      files.schematics.length +
      ' 份蓝图 · ' +
      files.worlds.length +
      ' 个存档 · ' +
      files.resources.length +
      ' 个可选资源文件';
  }
  function dimensions() {
    const world = files?.worlds.find((w) => w.id === $('desktop-world-file').value);
    $('desktop-dimension').replaceChildren(
      ...(world?.dimensions || []).map((name) => option(name, name)),
    );
  }
  function fileUrl(r) {
    return (
      (info.baseUrl || '') +
      '/api/desktop/file?' +
      new URLSearchParams({ instance: $('desktop-instance').value, kind: r.kind, path: r.path })
    );
  }
  $('desktop-close').onclick = () => dialog.close();
  $('desktop-instance').onchange = () => task(loadFiles);
  $('desktop-world-file').onchange = dimensions;
  for (const tab of dialog.querySelectorAll('[data-desktop-tab]'))
    tab.onclick = () => {
      for (const name of ['schematic', 'world', 'resources'])
        $('desktop-' + name).hidden = name !== tab.dataset.desktopTab;
    };
  $('desktop-read-schematic').onclick = () =>
    task(async () => {
      const row = files.schematics.find((r) => r.path === $('desktop-schematic-file').value);
      if (!row) throw Error('请选择蓝图');
      const response = await fetch(fileUrl({ ...row, kind: 'schematic' }));
      if (!response.ok) throw Error('蓝图读取失败');
      await openFile(new File([await response.arrayBuffer()], row.name));
      dialog.close();
    });
  $('desktop-read-world').onclick = () =>
    task(async () => {
      if (!$('desktop-world-file').value || !$('desktop-dimension').value)
        throw Error('请选择存档和维度');
      await checkpoint();
      const p = await json('/api/desktop/world', {
          instance: $('desktop-instance').value,
          world: $('desktop-world-file').value,
          dimension: $('desktop-dimension').value,
          min: ['x', 'y', 'z'].map((a) => Number($('desktop-min-' + a).value)),
          max: ['x', 'y', 'z'].map((a) => Number($('desktop-max-' + a).value)),
        }),
        bytes = new TextEncoder().encode(JSON.stringify(p));
      await imported(
        await call('import', { name: p.name + '.json', bytes: bytes.buffer }, [bytes.buffer]),
      );
      dialog.close();
      notice('已读取真实地形区域，原存档保持不变');
    }, '读取所选存档区域…');
  $('desktop-read-resources').onclick = () =>
    task(async () => {
      const chosen = [...$('desktop-resource-list').querySelectorAll('input:checked')].map(
        (n) => files.resources[Number(n.dataset.resource)],
      );
      if (!chosen.length) throw Error('请勾选需要的原版、模组或材质包');
      const selected = [];
      for (const r of chosen) {
        const response = await fetch(fileUrl(r));
        if (!response.ok) throw Error('读取失败：' + r.name);
        selected.push({ name: r.name, bytes: await response.arrayBuffer() });
      }
      await addResources(selected);
      dialog.close();
      notice('已导入所选的 ' + selected.length + ' 个资源文件');
    });
  $('desktop-read-legacy').onclick = () =>
    task(async () => {
      if (!$('desktop-legacy').value) throw Error('旧工程库没有可读取的工程');
      const r = await fetch(
        (info.baseUrl || '') +
          '/api/library/export?id=' +
          encodeURIComponent($('desktop-legacy').value),
      );
      if (!r.ok) throw Error('旧工程读取失败');
      await openFile(new File([await r.arrayBuffer()], '旧工程.craft.json'));
      dialog.close();
    });
  return { dialog };
}
