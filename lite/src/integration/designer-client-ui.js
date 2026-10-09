import markup from './views/designer-link.html';
import { DesignerClient } from './designer-client.js';

export function designerClientUI({ $, info, page, context, blocked }) {
  const panel = document.createElement('section');
  panel.id = 'designer-link';
  panel.className = 'card';
  panel.innerHTML = markup;
  $('ai-prompt').closest('label').before(panel);
  const checkbox = $('designer-link-enabled'),
    status = (message) => {
      $('designer-link-status').textContent = message;
    };
  if (!info?.capabilities?.includes('designer-page/1')) {
    checkbox.disabled = true;
    status(
      info
        ? '本地服务需要更新并重新启动，才能连接当前工程。'
        : '此连接需要本地工作台；独立 Lite 继续使用页面设计 API。',
    );
    return null;
  }
  const client = new DesignerClient({ info, page, context, blocked, status });
  const preference = (value) => {
    try {
      if (value === undefined) return sessionStorage.getItem('craftstudio-designer-link') === '1';
      sessionStorage.setItem('craftstudio-designer-link', value ? '1' : '0');
    } catch (error) {
      status('本次连接可用，无法保存页面连接偏好：' + error.message);
    }
    return false;
  };
  checkbox.onchange = () => {
    preference(checkbox.checked);
    client.setEnabled(checkbox.checked);
  };
  checkbox.checked = preference();
  if (checkbox.checked) client.setEnabled(true);
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) client.setEnabled(false);
  });
  return client;
}
