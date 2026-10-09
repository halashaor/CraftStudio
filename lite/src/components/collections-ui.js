import markup from './views/collections-panel.html';
import { SceneBrowser } from '../ui/scene-browser.js';
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
  $('cad-browser-clear').onclick = () => {
    $('cad-object-search').value = '';
    $('cad-collection-filter').value = '';
    $('cad-object-attention').checked = false;
    update();
  };

  let currentSummary = null;
  const summary = () => currentSummary || getSummary();
  const current = () => {
    const value = $('cad-collection-filter').value;
    return value.startsWith('group:')
      ? summary()?.design.collections?.find((c) => c.id === value.slice(6))
      : null;
  };
  function filter() {
    const design = summary()?.design,
      result = browser.filter({
        query: $('cad-object-search').value,
        collection: $('cad-collection-filter').value,
        attention: $('cad-object-attention').checked,
      }),
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
        badge.textContent = '集合 · ' + collection.name + (collection.locked ? ' · 锁定' : '');
        badge.title = collection.hidden ? '集合已隐藏' : '';
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
  }
  async function mutate(method, params) {
    const s = getSummary(),
      result = await call('api', {
        method,
        params: { workspaceId: s.workspaceId, expectedRevision: s.revision, ...params },
      });
    if (!result.ok) throw Error(result.error.message);
    refresh(await call('summary'));
    await render();
    markDirty();
    return result.value;
  }
  $('cad-collection-create').onclick = () =>
    task(async () => {
      const result = await mutate('collections.put', {
        collection: { name: $('cad-collection-name').value },
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
          .design.objects.filter((o) => o.collectionId === c.id)
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
  $('cad-collection-remove').onclick = () =>
    task(async () => {
      const c = current();
      if (!c) throw Error('先选择集合');
      await mutate('collections.remove', { id: c.id });
      $('cad-collection-filter').value = '';
      filter();
    });
  $('cad-object-attention').onchange = filter;
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
    }
    currentSummary = s;
    browser = new SceneBrowser(s.design, links);
    const previous = $('cad-collection-filter').value,
      list = summary()?.design.collections || [],
      select = $('cad-collection-filter');
    select.replaceChildren(
      ...[
        ['', '全部对象与草图'],
        ['none', '未归类对象'],
        ...list.map((c) => [
          'group:' + c.id,
          c.name + ' · ' + summary().design.objects.filter((o) => o.collectionId === c.id).length,
        ]),
      ].map(([value, name]) => {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = name;
        return o;
      }),
    );
    select.value = Array.from(select.options).some((o) => o.value === previous) ? previous : '';
    const c = current();
    for (const id of ['rename', 'assign', 'unassign', 'select', 'hide', 'lock', 'remove'])
      $('cad-collection-' + id).disabled = !c;
    $('cad-collection-hide').textContent = c?.hidden ? '显示集合' : '隐藏集合';
    $('cad-collection-lock').textContent = c?.locked ? '解锁集合' : '锁定集合';
    filter();
  }
  return { update, filter };
}
