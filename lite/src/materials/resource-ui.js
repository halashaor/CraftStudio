import template from './views/resource-library.html';
export function resourceUI({ $, library, resources, controller, task, notice }) {
  const dialog = document.createElement('dialog');
  dialog.id = 'resource-library-dialog';
  dialog.className = 'cad-dialog';
  dialog.innerHTML = template;
  document.body.append(dialog);
  const add = document.createElement('button');
  add.id = 'resource-library-open';
  add.textContent = '资源库';
  add.title = '原版、Create、其他 Mod 与材质包';
  $('asset-add-resource').after(add);
  function rows() {
    const enabled = resources.entries.filter((e) => e.enabled !== false),
      has = (e) => enabled.some((r) => r.kind === e);
    $('resource-library-status').textContent =
      '原版：' +
      (has('vanilla') ? '已就绪' : '待设置') +
      ' · Create：' +
      (has('create') ? '已就绪' : '待设置') +
      ' · ' +
      enabled.length +
      ' 个启用资源';
    $('resource-library-local').hidden = !library.desktop;
    $('resource-library-rows').replaceChildren(
      ...resources.entries.map((e, i) => {
        const row = document.createElement('div');
        row.className = 'card';
        const label = document.createElement('label');
        label.className = 'check';
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = e.enabled !== false;
        check.onchange = () =>
          change(
            resources.entries.map((r) => (r.id === e.id ? { ...r, enabled: check.checked } : r)),
          );
        label.append(
          check,
          document.createTextNode(
            { vanilla: '原版', create: 'Create', mod: 'Mod', pack: '材质包' }[e.kind] +
              ' · ' +
              e.name +
              ' · ' +
              e.count +
              ' 资源',
          ),
        );
        row.append(label);
        const buttons = document.createElement('div');
        buttons.className = 'row';
        for (const [text, delta] of [
          ['上移', -1],
          ['下移', 1],
        ]) {
          const b = document.createElement('button');
          b.textContent = text;
          b.disabled = i + delta < 0 || i + delta >= resources.entries.length;
          b.onclick = () => {
            const list = [...resources.entries];
            [list[i], list[i + delta]] = [list[i + delta], list[i]];
            change(list);
          };
          buttons.append(b);
        }
        const remove = document.createElement('button');
        remove.textContent = '移出资源库';
        remove.onclick = () => change(resources.entries.filter((r) => r.id !== e.id));
        buttons.append(remove);
        row.append(buttons);
        return row;
      }),
    );
  }
  function change(entries) {
    return task(async () => {
      await controller.save(entries);
      notice('资源顺序与启用状态已保存');
    }, '应用资源外观…');
  }
  const open = () => {
    rows();
    dialog.showModal();
  };
  add.onclick = open;
  $('asset-add-resource').onclick = open;
  $('resource-library-files').onclick = () => $('resource-file').click();
  $('resource-library-close').onclick = () => dialog.close();
  $('resource-library-local').onclick = () => {
    dialog.close();
    $('desktop-files-open').click();
    $('desktop-basic-resources').click();
  };
  return {
    open,
    rows,
    add: async (files) => {
      await controller.add(files);
      notice('资源已保存，新工程会自动复用');
    },
  };
}
