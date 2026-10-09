import { GameDelivery } from './game-delivery.js';
import viewMarkup0 from './views/game-ui-dialog.html';
import {
  bridgeSession,
  bridgeControls,
  activeBridgeJob,
  bridgeJobRunning,
} from './game-session.js';
export function gameUI({
  info,
  $,
  call,
  task,
  imported,
  checkpoint,
  notice,
  getSummary,
  getSelection,
}) {
  const dialog = document.createElement('dialog');
  dialog.id = 'game-bridge-dialog';
  dialog.className = 'cad-dialog';
  dialog.innerHTML = viewMarkup0;
  document.body.append(dialog);
  let connected = false,
    session = null,
    connectionEpoch = 0,
    jobId = null;
  function controls() {
    const state = bridgeControls(session, jobId);
    for (const action of ['read', 'validate', 'build', 'job', 'cancel', 'undo'])
      $('game-' + action).disabled = !state[action] || (action === 'build' && !delivery.prepared);
    const ownBusy = !!session?.busy && !!jobId;
    for (const id of ['game-token', 'game-port', 'game-token-file', 'game-connect'])
      $(id).disabled = ownBusy;
  }
  function disconnect(message = '请先连接游戏') {
    connected = false;
    session = null;
    jobId = null;
    connectionEpoch++;
    delivery.clear();
    $('game-health').textContent = message;
    $('game-report').textContent = '';
    controls();
  }
  const delivery = new GameDelivery({
    call,
    request,
    options: () => ({
      connection: connectionEpoch,
      kind: $('game-scope').value,
      selection: $('game-scope').value === 'selection' ? getSelection() : undefined,
      origin: origin(),
      dimension: dimension(),
      overwrite: $('game-overwrite').checked,
    }),
    changed: (prepared) => {
      $('game-prepared').textContent = prepared
        ? `${prepared.source.name} · 版本 ${prepared.source.revision} · ${prepared.blocks} 方块\n${prepared.options.dimension} · 世界范围 ${prepared.origin.join(', ')} → ${prepared.max.join(', ')}\n${prepared.options.overwrite ? '允许替换已有方块' : '保留目标已有方块'}`
        : '先准备施工内容，检查实际世界范围后确认建造。';
      controls();
    },
  });
  for (const id of ['game-x', 'game-y', 'game-z', 'game-dimension', 'game-scope', 'game-overwrite'])
    $(id).addEventListener('input', () => delivery.clear());
  controls();
  for (const id of ['game-token', 'game-port'])
    $(id).oninput = () => disconnect('连接参数已更改，请重新连接');
  async function request(action, payload = {}) {
    const epoch = connectionEpoch;
    let r, data;
    try {
      r = await fetch((info.baseUrl || '') + '/api/lite/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CraftStudio-Token': info.token },
        body: JSON.stringify({
          action,
          port: Number($('game-port').value),
          token: $('game-token').value.trim(),
          payload,
        }),
      });
      data = await r.json();
    } catch (error) {
      if (epoch === connectionEpoch) disconnect('连接中断，请重新连接');
      throw error;
    }
    if (!r.ok || data.error) {
      if (epoch === connectionEpoch && ['health', 'apply', 'undo'].includes(action))
        disconnect('连接或写入状态已失效，请重新连接检查');
      throw Error(data.error || '游戏连接失败');
    }
    return data;
  }
  const origin = () => ['x', 'y', 'z'].map((a) => Number($('game-' + a).value)),
    dimension = () => $('game-dimension').value;
  function run(fn) {
    return task(async () => {
      try {
        await fn();
      } catch (e) {
        $('game-report').textContent = e.message;
        throw e;
      }
    }, '与游戏通信…');
  }
  function report(r) {
    if (r.id) jobId = r.id;
    if (session) session.busy = bridgeJobRunning(r.status);
    controls();
    $('game-report').textContent =
      (r.status || '') +
      (r.restoring ? ' · 正在恢复原方块' : '') +
      ' · 已放置 ' +
      (r.placed || 0) +
      (Number.isSafeInteger(r.total) ? ' / ' + r.total : '') +
      (r.error ? ' · ' + r.error : '') +
      (r.backup ? ' · 备份：' + r.backup : '');
  }
  const button = document.createElement('button');
  button.id = 'game-bridge-open';
  button.textContent = '连接游戏 · Java';
  button.className = 'full';
  button.onclick = () => {
    delivery.clear();
    const s = getSummary();
    if (s?.originConfirmed) ['x', 'y', 'z'].forEach((a, i) => ($('game-' + a).value = s.origin[i]));
    dialog.showModal();
  };
  $('desktop-files-open').after(button);
  $('game-close').onclick = () => dialog.close();
  $('game-token-file').onchange = async () => {
    const f = $('game-token-file').files[0];
    if (f) {
      $('game-token').value = (await f.text()).trim();
      disconnect('令牌已读取，请连接游戏');
      $('game-token-file').value = '';
    }
  };
  $('game-connect').onclick = () =>
    run(async () => {
      disconnect('正在连接游戏…');
      const epoch = connectionEpoch;
      try {
        const h = await request('health');
        if (epoch !== connectionEpoch) return;
        session = bridgeSession(h);
        connected = true;
        $('game-health').textContent = session.label + (session.busy ? ' · 有施工任务进行中' : '');
        if (h.dimensions?.length)
          $('game-dimension').replaceChildren(
            ...h.dimensions.map((id) => {
              const o = document.createElement('option');
              o.value = id;
              o.textContent =
                id === 'minecraft:overworld'
                  ? '主世界'
                  : id === 'minecraft:the_nether'
                    ? '下界'
                    : id === 'minecraft:the_end'
                      ? '末地'
                      : id;
              return o;
            }),
          );
        const recovered = activeBridgeJob(h.activeJob);
        if (recovered) {
          session.busy = true;
          report(recovered);
          session.busy = true;
          controls();
        } else if (h.busy)
          $('game-report').textContent = '桥接有施工进行中，但未提供可恢复任务编号；保持只读检查';
        else if (h.lastJob) {
          const previous = activeBridgeJob(h.lastJob);
          if (previous) report(previous);
        }
        controls();
      } catch (error) {
        disconnect('未连接：' + error.message);
        throw error;
      }
    });
  $('game-read').onclick = () =>
    run(async () => {
      if (!connected) throw Error('请先连接游戏');
      await checkpoint();
      const r = await request('read', {
        origin: origin(),
        dimension: dimension(),
        size: ['width', 'height', 'length'].map((a) => Number($('game-' + a).value)),
      });
      const bytes = new TextEncoder().encode(JSON.stringify(r.project));
      await imported(
        await call('import', { name: 'game-region.json', bytes: bytes.buffer }, [bytes.buffer]),
      );
      dialog.close();
      notice('游戏区域已读入设计器');
    });
  $('game-validate').onclick = () =>
    run(async () => {
      if (!bridgeControls(session, jobId).validate) throw Error('请先连接游戏并检查权限');
      const prepared = await delivery.prepare();
      $('game-report').textContent = '方块兼容性检查通过 · ' + prepared.validation.mode;
    });
  $('game-build').onclick = () =>
    run(async () => {
      if (!bridgeControls(session, jobId).build)
        throw Error('当前连接未开放建造，请重新连接检查权限');
      report(await delivery.build());
    });
  $('game-job').onclick = () =>
    run(async () => {
      if (!jobId) throw Error('当前没有施工任务');
      report(await request('job', { id: jobId }));
    });
  $('game-cancel').onclick = () =>
    run(async () => {
      if (!jobId) throw Error('当前没有施工任务');
      report(await request('cancel', { id: jobId }));
    });
  $('game-undo').onclick = () =>
    run(async () => {
      if (!bridgeControls(session, jobId).undo) throw Error('当前连接未开放撤销写入');
      report(await request('undo'));
    });
  return { dialog };
}
