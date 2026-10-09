import viewMarkup0 from './views/game-ui-dialog.html';
import {
  bridgeSession,
  bridgeControls,
  activeBridgeJob,
  bridgeJobRunning,
} from './game-session.js';
export function gameUI({ info, $, call, task, imported, checkpoint, notice, getSummary }) {
  const dialog = document.createElement('dialog');
  dialog.id = 'game-bridge-dialog';
  dialog.className = 'cad-dialog';
  dialog.innerHTML = viewMarkup0;
  document.body.append(dialog);
  let connected = false,
    session = null,
    connectionEpoch = 0,
    jobId = null,
    offsetLocal = [0, 0, 0];
  function controls() {
    const state = bridgeControls(session, jobId);
    for (const action of ['read', 'validate', 'build', 'job', 'cancel', 'undo'])
      $('game-' + action).disabled = !state[action];
    const ownBusy = !!session?.busy && !!jobId;
    for (const id of ['game-token', 'game-port', 'game-token-file', 'game-connect'])
      $(id).disabled = ownBusy;
  }
  function disconnect(message = '请先连接游戏') {
    connected = false;
    session = null;
    jobId = null;
    connectionEpoch++;
    $('game-health').textContent = message;
    $('game-report').textContent = '';
    controls();
  }
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
  async function project() {
    if (!connected) throw Error('请先连接游戏');
    const packed = await call('bridgeProject', { kind: $('game-scope').value });
    offsetLocal = packed.offsetLocal;
    return packed.project;
  }
  $('game-validate').onclick = () =>
    run(async () => {
      const r = await request('validate', { project: await project() });
      $('game-report').textContent = r.ok
        ? '目标游戏的方块与状态检查通过 · ' + r.mode
        : r.errors.join('；');
    });
  $('game-build').onclick = () =>
    run(async () => {
      if (!bridgeControls(session, jobId).build)
        throw Error('当前连接未开放建造，请重新连接检查权限');
      report(
        await request('apply', {
          project: await project(),
          origin: origin().map((n, a) => n + offsetLocal[a]),
          dimension: dimension(),
          overwrite: $('game-overwrite').checked,
        }),
      );
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
