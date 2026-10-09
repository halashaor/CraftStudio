export function registerFileCommands({ add, invoke, $, busyReason, openDelivery }) {
  add(
    'new-project',
    '新建空白工程',
    '文件',
    invoke('new-project-open'),
    'new blank project 从零设计',
    busyReason,
  );
  add(
    'delivery',
    '导出施工交付包',
    '文件',
    () => {
      openDelivery();
      $('delivery-kind').focus();
    },
    'export delivery blueprint zip 建造 打包',
    busyReason,
  );
  add('library', '本地工程库', '文件', invoke('open-library'), 'projects library', busyReason);
}
