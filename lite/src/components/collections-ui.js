import { CollectionTreeUI } from './collection-tree-ui.js';
import markup from './views/collections-panel.html';
import { objectHidden } from './collections.js';
import { SceneBrowser, objectKindLabel } from '../ui/scene-browser.js';
export function collectionsUI({
  $,
  call,
  refresh,
  render,
  markDirty,
  task,
  getSummary,
  getObjectIds,
  selectObjects,
  objects,
}) {
  const host = document.createElement('section');
  host.id = 'cad-collection-controls';
  host.innerHTML = markup;
  $('cad-object-search').after(host);
  const status = document.createElement('div');
  status.className = 'scene-browser-status';
  status.innerHTML =
    '<small id="cad-browser-count" aria-live="polite"></small><button id="cad-browser-clear" hidden>显示全部</button>';
  $('cad-object-search').after(status);
  let browser = new SceneBrowser();
  const tree = new CollectionTreeUI({
    host: $('cad-collection-tree'),
    onSelect: (id) => {
      $('cad-collection-filter').value = 'group:' + id;
      $('cad-collection-filter').onchange();
    },
  });
  function clear() {
    $('cad-object-search').value = '';
    $('cad-collection-filter').value = '';
    $('cad-object-attention').checked = false;
    $('cad-object-kind').value = '';
    $('cad-object-state').value = '';
    update();
  }
  $('cad-browser-clear').onclick = clear;

  let currentSummary = null;
  const summary = () => currentSummary || getSummary();
  const current = () => {
    const value = $('cad-collection-filter').value;
    return value.startsWith('group:')
      ? summary()?.design.collections?.find((c) => c.id === value.slice(6))
      : null;
  };
  const scope = () => ({
    query: $('cad-object-search').value,
    collection: $('cad-collection-filter').value,
    attention: $('cad-object-attention').checked,
    kind: $('cad-object-kind').value,
    state: $('cad-object-state').value,
  });
  function filter() {
    const design = summary()?.design,
      result = browser.filter(scope()),
      relations = browser.relations;
    for (const row of objects.children) {
      const object = design?.objects.find((o) => o.id === row.dataset.objectId),
        collection = design?.collections?.find((c) => c.id === object?.collectionId);
      let badge = row.querySelector('.collection-badge');
      if (collection) {
        if (!badge) {
          badge = document.createElement('small');
          badge.className = 'collection-badge';
          row.append(badge);
        }
        badge.textContent =
          '集合 · ' +
          browser.hierarchy.path(collection.id) +
          (browser.hierarchy.flag(collection.id, 'locked') ? ' · 锁定' : '');
        badge.title = browser.hierarchy.flag(collection.id, 'hidden') ? '集合或上级已隐藏' : '';
      } else badge?.remove();
      const relation = relations.get(object?.id),
        attention = relation?.issues.length > 0;
      let issueBadge = row.querySelector('.generation-issue-badge');
      if (attention) {
        if (!issueBadge) {
          issueBadge = document.createElement('small');
          issueBadge.className = 'generation-issue-badge';
          row.append(issueBadge);
        }
        issueBadge.textContent = relation.issues.some((i) => i.code === 'OFFSET_CYCLE')
          ? '偏移来源循环'
          : relation.issues.some((i) => i.code === 'OFFSET_SOURCE_MISSING')
            ? '偏移来源失效'
            : relation.issues.some((i) => i.code === 'DEPENDENCY_CYCLE')
              ? '来源循环'
              : relation.issues.some((i) => i.code === 'MISSING_SOURCE')
                ? '来源失效'
                : relation.issues.some((i) => i.code === 'AMBIGUOUS_OUTPUT')
                  ? '来源归属冲突'
                  : relation.issues.some((i) => i.code === 'UPSTREAM_ERROR')
                    ? '上游来源问题'
                    : '待更新';
        issueBadge.dataset.severity = relation.status;
        issueBadge.title = relation.issues
          .map((issue) => issue.message + (issue.sourceId ? ' · ' + issue.sourceId : ''))
          .join('\n');
      } else issueBadge?.remove();
      row.hidden = !result.objectIds.has(row.dataset.objectId);
    }
    for (const row of $('cad-sketch-list')?.children || [])
      row.hidden = !result.guideIds.has(row.dataset.guideId);
    $('cad-object-attention-count').textContent = result.attentionCount
      ? '需要处理 ' + result.attentionCount + ' 个对象'
      : '';
    $('cad-browser-count').textContent =
      '对象 ' +
      result.objectIds.size +
      '/' +
      result.objectCount +
      ' · 草图 ' +
      result.guideIds.size +
      '/' +
      result.guideCount;
    $('cad-browser-clear').hidden = !result.filtered;
    $('cad-select-filtered').disabled = !result.selectableObjectIds.size;
    $('cad-select-filtered').textContent =
      '选中筛选结果 · ' + result.selectableObjectIds.size + ' 个可见对象';
  }
  async function mutate(method, params) {
    const s = getSummary(),
      result = await call('api', {
        method,
        params: { workspaceId: s.workspaceId, expectedRevision: s.revision, ...params },
      });
    if (!result.ok) throw Error(result.error.message);
    refresh(await call('summary'));
    markDirty();
    await render();
    return result.value;
  }
  $('cad-collection-create').onclick = () =>
    task(async () => {
      const result = await mutate('collections.put', {
        collection: { name: $('cad-collection-name').value, parentId: current()?.id || null },
        objectIds: getObjectIds(),
      });
      $('cad-collection-filter').value = 'group:' + result.id;
      update();
    });
  $('cad-collection-rename').onclick = () =>
    task(async () => {
      const c = current();
      if (!c) throw Error('先选择集合');
      await mutate('collections.put', {
        collection: { ...c, name: $('cad-collection-name').value },
      });
    });
  $('cad-collection-assign').onclick = () =>
    task(async () => {
      const c = current(),
        ids = getObjectIds();
      if (!c || !ids.length) throw Error('先选择集合和对象');
      await mutate('collections.put', { collection: c, objectIds: ids });
      filter();
    });
  $('cad-collection-unassign').onclick = () =>
    task(async () => {
      const c = current(),
        ids = getObjectIds();
      if (!c || !ids.length) throw Error('先选择集合和对象');
      await mutate('collections.put', { collection: c, removeObjectIds: ids });
      filter();
    });
  $('cad-collection-select').onclick = () => {
    const c = current();
    if (c)
      selectObjects(
        summary()
          .design.objects.filter(
            (o) =>
              browser.hierarchy.contains(c.id, o.collectionId) &&
              !objectHidden(summary().design, o),
          )
          .map((o) => o.id),
      );
  };
  $('cad-collection-hide').onclick = () =>
    task(async () => {
      const c = current();
      if (!c) throw Error('先选择集合');
      await mutate('collections.put', { collection: { ...c, hidden: !c.hidden } });
    });
  $('cad-collection-lock').onclick = () =>
    task(async () => {
      const collection = current();
      if (!collection) throw Error('先选择集合');
      await mutate('collections.put', {
        collection: { ...collection, locked: !collection.locked },
      });
    });
  $('cad-collection-reparent').onclick = () =>
    task(async () => {
      const c = current();
      if (!c) throw Error('先选择集合');
      await mutate('collections.put', {
        collection: { ...c, parentId: $('cad-collection-parent').value || null },
      });
    });
  $('cad-collection-remove').onclick = () =>
    task(async () => {
      const c = current();
      if (!c) throw Error('先选择集合');
      await mutate('collections.remove', { id: c.id });
      $('cad-collection-filter').value = '';
      filter();
    });
  $('cad-object-attention').onchange = filter;
  $('cad-object-kind').onchange = filter;
  $('cad-object-state').onchange = filter;
  $('cad-select-filtered').onclick = (event) => {
    const result = browser.filter(scope());
    if (result.selectableObjectIds.size)
      selectObjects(
        [...result.selectableObjectIds],
        event.ctrlKey || event.metaKey ? 'subtract' : event.shiftKey ? 'add' : 'replace',
      );
  };
  $('cad-select-filtered').dataset.sceneShortcuts = 'true';
  $('cad-collection-filter').onchange = () => {
    const c = current();
    if (c) $('cad-collection-name').value = c.name;
    update();
  };
  function update(s = getSummary(), links) {
    if (currentSummary && currentSummary.workspaceId !== s.workspaceId) {
      $('cad-object-search').value = '';
      $('cad-collection-filter').value = '';
      $('cad-object-attention').checked = false;
      $('cad-object-kind').value = '';
      $('cad-object-state').value = '';
    }
    currentSummary = s;
    browser = new SceneBrowser(s.design, links);
    const previous = $('cad-collection-filter').value,
      hierarchy = browser.hierarchy,
      select = $('cad-collection-filter');
    select.replaceChildren(
      ...[
        ['', '全部对象与草图'],
        ['none', '未归类对象'],
        ...hierarchy
          .rows()
          .map(({ collection: c }) => [
            'group:' + c.id,
            hierarchy.path(c.id) +
              ' · ' +
              summary().design.objects.filter((o) => hierarchy.contains(c.id, o.collectionId))
                .length,
          ]),
      ].map(([value, name]) => {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = name;
        return o;
      }),
    );
    select.value = Array.from(select.options).some((o) => o.value === previous) ? previous : '';
    const previousKind = $('cad-object-kind').value,
      kinds = [
        ...new Set((s.design.objects || []).map((object) => object.kind || 'object')),
      ].sort();
    $('cad-object-kind').replaceChildren(
      ...['', ...kinds].map((kind) => {
        const option = document.createElement('option');
        option.value = kind;
        option.textContent = kind ? objectKindLabel(kind) : '所有类型';
        return option;
      }),
    );
    $('cad-object-kind').value = kinds.includes(previousKind) ? previousKind : '';
    const c = current();
    $('cad-collection-parent').replaceChildren(
      ...[
        ['', '场景根级'],
        ...hierarchy
          .rows()
          .filter(({ collection }) => !c || !hierarchy.contains(c.id, collection.id))
          .map(({ collection }) => [collection.id, hierarchy.path(collection.id)]),
      ].map(([value, name]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = name;
        return option;
      }),
    );
    $('cad-collection-parent').value = c?.parentId || '';
    $('cad-collection-parent').disabled = !c;
    $('cad-collection-reparent').disabled = !c;
    $('cad-collection-create').textContent = c ? '新建子集合' : '新建集合';
    tree.update(s, c?.id);
    $('cad-collection-inherited').textContent = c
      ? [
          !c.hidden && hierarchy.flag(c.id, 'hidden') ? '上级集合已隐藏；请先显示上级集合。' : '',
          !c.locked && hierarchy.flag(c.id, 'locked') ? '上级集合已锁定；请先解锁上级集合。' : '',
        ]
          .filter(Boolean)
          .join(' ')
      : '';
    for (const id of ['rename', 'assign', 'unassign', 'select', 'hide', 'lock', 'remove'])
      $('cad-collection-' + id).disabled = !c;
    $('cad-collection-select').disabled =
      !c ||
      !s.design.objects.some(
        (object) =>
          browser.hierarchy.contains(c.id, object.collectionId) && !objectHidden(s.design, object),
      );
    $('cad-collection-hide').textContent = c?.hidden ? '显示集合' : '隐藏集合';
    $('cad-collection-lock').textContent = c?.locked ? '解锁集合' : '锁定集合';
    filter();
  }
  function reveal({ objectIds = [], guideIds = [] }) {
    const result = browser.filter(scope());
    if (
      objectIds.some((id) => !result.objectIds.has(id)) ||
      guideIds.some((id) => !result.guideIds.has(id))
    )
      clear();
    const target = [...objects.children].find((row) => row.dataset.objectId === objectIds.at(-1));
    target?.scrollIntoView({ block: 'nearest' });
  }
  return { update, filter, reveal };
}
