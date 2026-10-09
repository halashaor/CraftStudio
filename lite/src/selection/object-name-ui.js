import { dialogOwnsKeyboard, textEditing, sceneShortcutBlocked } from '../ui/keyboard-context.js';
export function objectNameUI({
  $,
  getSummary,
  getObjectId,
  isOperating,
  call,
  refresh,
  render,
  markDirty,
  notice,
}) {
  let editor = null,
    committing = false;
  const rename = document.createElement('button');
  rename.id = 'cad-object-rename';
  rename.textContent = '重命名';
  rename.title = 'F2 · 修改单个对象名称';
  $('cad-selection-clear').before(rename);
  const rowFor = (id) =>
    [...$('cad-object-list').querySelectorAll('[data-object-id]')].find(
      (row) => row.dataset.objectId === id,
    );
  function cancel(focus = false) {
    if (!editor) return;
    const own = editor;
    editor = null;
    own.input.remove();
    own.button.hidden = false;
    if (focus) rowFor(own.id)?.querySelector('button')?.focus({ preventScroll: true });
  }
  async function finish(focus = false) {
    if (!editor || committing) return;
    const own = editor,
      name = own.input.value.trim();
    if (!name) {
      cancel(focus);
      notice('名称不能为空，已保留原名称');
      return;
    }
    if (name === own.name) {
      cancel(focus);
      return;
    }
    const summary = getSummary();
    if (
      summary?.workspaceId !== own.workspaceId ||
      !summary.design.objects.some((o) => o.id === own.id)
    ) {
      cancel();
      notice('工程或对象已改变，重命名已取消');
      return;
    }
    committing = true;
    own.input.disabled = true;
    try {
      const result = await call('studio', {
        command: 'object',
        id: own.id,
        name,
        workspaceId: summary.workspaceId,
        expectedRevision: summary.revision,
      });
      cancel();
      if (getSummary()?.workspaceId !== own.workspaceId) return;
      refresh(result);
      await render();
      markDirty();
      if (focus) rowFor(own.id)?.querySelector('button')?.focus({ preventScroll: true });
      notice('对象名称已更新，可一次撤销');
    } catch (error) {
      cancel(focus);
      notice(error.message, true);
    } finally {
      committing = false;
    }
  }
  function begin() {
    if (committing || isOperating()) {
      notice('请先确认或取消当前操作，再修改对象名称');
      return;
    }
    const id = getObjectId(),
      summary = getSummary(),
      object = summary?.design.objects.find((o) => o.id === id),
      row = rowFor(id);
    if (!object || !row) {
      notice('请先选择一个已命名对象；自由选区可先建立为对象');
      return;
    }
    if (row.hidden) {
      notice('对象被当前筛选隐藏，请先在对象树显示它');
      return;
    }
    cancel();
    for (
      let parent = row.parentElement;
      parent && parent !== $('cad-object-list');
      parent = parent.parentElement
    )
      if (parent.tagName === 'DETAILS') parent.open = true;
    const button = row.querySelector('button'),
      input = document.createElement('input');
    input.className = 'object-name-input';
    input.setAttribute('aria-label', '对象名称');
    input.value = object.name;
    editor = { id, name: object.name, workspaceId: summary.workspaceId, input, button };
    button.hidden = true;
    button.before(input);
    input.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel(true);
      }
    });
    input.addEventListener('blur', () => {
      if (!committing) finish();
    });
    input.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    input.focus({ preventScroll: true });
    input.select();
  }
  rename.onclick = begin;
  window.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.key !== 'F2' ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      dialogOwnsKeyboard() ||
      textEditing(document.activeElement) ||
      sceneShortcutBlocked(document.activeElement) ||
      event.target.closest?.('[data-shortcut-scope="commands"]')
    )
      return;
    event.preventDefault();
    begin();
  });
  return {
    begin,
    update: (summary) => {
      rename.disabled = !getObjectId();
      if (
        editor &&
        (summary.workspaceId !== editor.workspaceId ||
          !summary.design.objects.some((o) => o.id === editor.id) ||
          !editor.input.isConnected)
      )
        cancel();
    },
  };
}
