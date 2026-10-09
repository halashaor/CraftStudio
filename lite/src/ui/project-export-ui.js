import { safeStem } from '../storage/delivery-package.js';

export function projectExportUI({ $, task, exporter, download, notice }) {
  const hints = {
    additions: '只交付新增和替换方块，不包含拆除。',
    patch: '交付全部变更，包括明确拆除空气；按游戏工具的粘贴策略施工。',
    selection: '只交付当前选择的精确成员，不混入外接框内其他对象。',
    full: '交付完整场地与结果，保留原始场地及实体。',
  };
  function syncScope() {
    const kind = $('delivery-kind').value;
    const missing = kind === 'selection' && $('download-selection').disabled;
    $('delivery-entities').disabled = kind !== 'selection';
    $('download-delivery').disabled = missing;
    $('delivery-hint').textContent = missing ? '先在场景或对象列表选择要交付的建筑。' : hints[kind];
  }
  $('delivery-kind').onchange = syncScope;
  new MutationObserver(syncScope).observe($('download-selection'), {
    attributes: true,
    attributeFilter: ['disabled'],
  });
  syncScope();
  $('download-delivery').onclick = () =>
    task(async () => {
      const result = await exporter.delivery({
        kind: $('delivery-kind').value,
        includeProject: $('delivery-project').checked,
        includeEntities: $('delivery-kind').value === 'selection' && $('delivery-entities').checked,
      });
      download(result.bytes, result.filename, 'application/zip');
      notice(
        '施工交付包已下载' +
          (result.entities ? ' · 含 ' + result.entities + ' 个场景实体' : '') +
          (result.entityWarnings?.length
            ? ' · ' + result.entityWarnings.join('；')
            : '，蓝图、坐标说明与清单在同一个文件中'),
      );
    }, '正在打包已确认的设计…');
  $('download-project').onclick = () =>
    task(async () => {
      const snapshot = exporter.capture();
      download(
        await exporter.projectBytes(snapshot.title, snapshot.guard),
        safeStem(snapshot.title) + '.craftlite',
      );
    });
  $('download-json').onclick = () =>
    task(async () => {
      const snapshot = exporter.capture();
      download(
        await exporter.compatibilityJSON(snapshot.title, snapshot.guard),
        safeStem(snapshot.title) + '.craft.json',
        'application/json',
      );
    }, '正在生成兼容工程文件…');
  for (const kind of ['selection', 'additions', 'patch', 'full'])
    $('download-' + kind).onclick = () =>
      task(async () => {
        const snapshot = exporter.capture(),
          value = await exporter.blueprint(kind, undefined, snapshot.guard, {
            includeEntities: kind === 'selection' && $('delivery-entities').checked,
          });
        download(value.bytes || value, safeStem(snapshot.title) + '.' + kind + '.nbt');
        if (value.offsetLocal) {
          download(
            JSON.stringify(
              {
                localOffset: value.offsetLocal,
                worldOffset: value.offsetWorld,
                containsAir: value.containsAir,
                entities: value.entities,
                entitySelection: value.entitySelection,
                entityWarnings: value.entityWarnings,
              },
              null,
              2,
            ),
            '蓝图放置偏移说明.json',
            'application/json',
          );
          notice('已导出；放置偏移坐标随说明文件提供。');
        }
      }, '正在生成 NBT，不改变原文件…');
  $('download-csv').onclick = () =>
    task(async () =>
      download(await exporter.changeTable(), '逐格施工变更.csv', 'text/csv;charset=utf-8'),
    );
  $('terrain-csv').onclick = () =>
    task(async () => {
      download(await exporter.terrainTable(), '真实场地逐列高度.csv', 'text/csv;charset=utf-8');
      notice('已导出逐列原地面、水面与占用高度。');
    });
  const spongeButton = document.createElement('button');
  spongeButton.className = 'full';
  spongeButton.textContent = '新增建筑 Sponge .schem';
  spongeButton.onclick = () =>
    task(async () => {
      const snapshot = exporter.capture();
      download(await exporter.export({ format: 'schem' }), safeStem(snapshot.title) + '.schem');
    });
  $('download-additions').after(spongeButton);
}
