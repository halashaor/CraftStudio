import { generationLinks } from '../modeling/generation-links.js';
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
  const host = document.createElement('details');
  host.id = 'cad-collections';
  host.innerHTML =
    '<summary>集合与筛选</summary><label class="check"><input type="checkbox" id="cad-object-attention">只看需要处理</label><small id="cad-object-attention-count"></small><label>浏览集合<select id="cad-collection-filter"><option value="">全部对象</option></select></label><label>集合名称<input id="cad-collection-name" placeholder="例如：主馆、庭院、设备层"></label><div class="row"><button id="cad-collection-create">新建</button><button id="cad-collection-rename">改名</button></div><div class="row"><button id="cad-collection-assign">选中对象归入</button><button id="cad-collection-select">选择全部成员</button></div><div class="row"><button id="cad-collection-unassign">选中对象移出</button></div><div class="row"><button id="cad-collection-hide">隐藏集合</button><button id="cad-collection-remove">解除集合</button></div><p class="small">集合用于组织对象；解除集合不删除方块。隐藏集合保留成员自己的隐藏状态。</p>';
  $('cad-object-search').after(host);
  let currentSummary = null;
  const summary = () => currentSummary || getSummary();
  const current = () => {
    const value = $('cad-collection-filter').value;
    return value.startsWith('group:')
      ? summary()?.design.collections?.find((c) => c.id === value.slice(6))
      : null;
  };
  function filter() {
    const value = $('cad-collection-filter').value,
      q = $('cad-object-search').value.toLowerCase(),
      design = summary()?.design,
      relations = new Map(generationLinks(design).objects.map((o) => [o.id, o]));
    let attentionCount = 0;
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
        badge.textContent = '集合 · ' + collection.name;
        badge.title = collection.hidden ? '集合已隐藏' : '';
      } else badge?.remove();
      const relation = relations.get(object?.id),
        attention = relation?.issues.length > 0;
      let issueBadge = row.querySelector('.generation-issue-badge');
      if (attention) {
        attentionCount++;
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
      row.hidden =
        ($('cad-object-attention').checked && !attention) ||
        !row.textContent.toLowerCase().includes(q) ||
        (value === 'none' && !!object?.collectionId) ||
        (value.startsWith('group:') && object?.collectionId !== value.slice(6));
    }
    $('cad-object-attention-count').textContent = attentionCount
      ? '需要处理 ' + attentionCount + ' 个对象'
      : '没有待处理的生成对象';
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
  function update(s = getSummary()) {
    currentSummary = s;
    const previous = $('cad-collection-filter').value,
      list = summary()?.design.collections || [],
      select = $('cad-collection-filter');
    select.replaceChildren(
      ...[
        ['', '全部对象'],
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
    for (const id of ['rename', 'assign', 'unassign', 'select', 'hide', 'remove'])
      $('cad-collection-' + id).disabled = !c;
    $('cad-collection-hide').textContent = c?.hidden ? '显示集合' : '隐藏集合';
    filter();
  }
  return { update, filter };
}
