import { GameAutomation, gameTarget } from './game-automation.js';
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
  notice,
  getSummary,
  getSelection,
  setSelection,
  importFile,
}) {
  const dialog = document.createElement('dialog');
  dialog.id = 'game-bridge-dialog';
  dialog.className = 'cad-dialog';
  dialog.innerHTML = viewMarkup0;
  document.body.append(dialog);
  let session = null,
    connectionEpoch = 0,
    jobId = null,
    targetWorkspace = null;
  function controls() {
    const state = bridgeControls(session, jobId);
    for (const action of ['read', 'validate', 'build', 'job', 'cancel', 'undo'])
      $('game-' + action).disabled = !state[action] || (action === 'build' && !delivery.prepared);
    const ownBusy = !!session?.busy && !!jobId;
    for (const id of ['game-token', 'game-port', 'game-token-file', 'game-connect'])
      $(id).disabled = ownBusy;
  }
  function disconnect(message = '请先连接游戏') {
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
      if (['apply', 'undo', 'cancel'].includes(action))
        throw Error(
          'GAME_WRITE_UNCONFIRMED: 游戏写入结果未知，请重新连接并查询任务；' + error.message,
        );
      throw error;
    }
    if (epoch !== connectionEpoch)
      throw Error(
        ['apply', 'undo', 'cancel'].includes(action)
          ? 'GAME_WRITE_UNCONFIRMED: 请求期间游戏连接已变化，请重新连接查询任务'
          : 'GAME_CONNECTION_CHANGED: 请求期间游戏连接已变化',
      );
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
    if (
      delivery.prepared &&
      (delivery.prepared.source.workspaceId !== s?.workspaceId ||
        delivery.prepared.source.revision !== s?.revision)
    )
      delivery.clear();
    if (targetWorkspace !== s?.workspaceId && !delivery.prepared) {
      if (s?.originConfirmed)
        ['x', 'y', 'z'].forEach((a, i) => ($('game-' + a).value = s.origin[i]));
      targetWorkspace = s?.workspaceId;
    }
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
  const automation = new GameAutomation({
    delivery,
    describe: () => call('api', { method: 'workspace.describe' }),
    connection: () => ({
      connectionId: connectionEpoch,
      session,
      jobId,
      controls: bridgeControls(session, jobId),
    }),
    target: () => ({
      origin: origin(),
      dimension: dimension(),
      kind: $('game-scope').value,
      overwrite: $('game-overwrite').checked,
      size: ['width', 'height', 'length'].map((axis) => Number($('game-' + axis).value)),
    }),
    configure: (input) => {
      const target = gameTarget(
        input,
        automation.target(),
        [...$('game-dimension').options].map((option) => option.value),
      );
      delivery.clear();
      for (const [axis, name] of ['x', 'y', 'z'].entries())
        $('game-' + name).value = target.origin[axis];
      for (const [axis, name] of ['width', 'height', 'length'].entries())
        $('game-' + name).value = target.size[axis];
      $('game-scope').value = target.kind;
      $('game-dimension').value = target.dimension;
      $('game-overwrite').checked = target.overwrite;
      targetWorkspace = getSummary()?.workspaceId;
      if (input?.selection !== undefined) setSelection(structuredClone(input.selection));
    },
    request,
    report,
    importFile,
  });
  async function perform(action) {
    const state = await automation.status();
    const result = await automation.request({
      action,
      connectionId: state.connectionId,
      workspaceId: state.workspaceId,
      expectedRevision: state.revision,
      jobId: state.jobId,
      preparedId: state.prepared?.id,
    });
    if (action === 'prepare') $('game-report').textContent = '方块兼容性检查通过，请核对施工范围';
    if (action === 'read') {
      dialog.close();
      notice('游戏区域已读入设计器');
    }
    return result;
  }
  for (const [id, action] of [
    ['read', 'read'],
    ['validate', 'prepare'],
    ['build', 'build'],
    ['job', 'job'],
    ['cancel', 'cancel'],
    ['undo', 'undo'],
  ])
    $('game-' + id).onclick = () => run(() => perform(action));
  return { dialog, request: (input) => automation.request(input) };
}
