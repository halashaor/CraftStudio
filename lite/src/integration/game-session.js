export function bridgeSession(health) {
  if (!health || typeof health !== 'object') throw Error('游戏未返回有效连接状态');
  if (health.edition && health.edition !== 'java') throw Error('仅支持 Java 版');
  if (health.protocol && health.protocol !== 'craftstudio-bridge/1')
    throw Error('桥接协议版本不匹配');
  const capabilities = new Set(
    Array.isArray(health.capabilities)
      ? health.capabilities
      : ['read', 'validate', 'apply', 'job', 'cancel', 'undo'],
  );
  return {
    connected: true,
    writable: health.writeEnabled === true,
    busy: health.busy === true,
    capabilities: [...capabilities],
    label:
      (health.minecraft || '未知 Java 版本') +
      ' · ' +
      (health.loader || '旧版桥接') +
      ' · DataVersion ' +
      (health.dataVersion ?? '未知') +
      (health.writeEnabled === true
        ? ' · 写入已启用'
        : health.writeEnabled === false
          ? ' · 当前只读'
          : ' · 写入状态未知，按只读处理'),
  };
}
export function bridgeControls(session, jobId) {
  const connected = !!session?.connected,
    has = (name) => connected && session.capabilities.includes(name);
  return {
    read: has('read'),
    validate: has('validate'),
    build: has('apply') && session.writable && !session.busy,
    job: has('job') && !!jobId,
    cancel: has('cancel') && !!jobId && session.busy,
    undo: has('undo') && session.writable && !session.busy,
  };
}

export function activeBridgeJob(report) {
  if (!report || typeof report.id !== 'string' || !report.id || report.id.length > 128) return null;
  const placed = Number.isSafeInteger(report.placed) && report.placed >= 0 ? report.placed : 0,
    total = Number.isSafeInteger(report.total) && report.total >= placed ? report.total : null;
  return {
    id: report.id,
    status: String(report.status || 'building'),
    placed,
    total,
    restoring: report.restoring === true,
    ...(typeof report.backup === 'string' ? { backup: report.backup } : {}),
  };
}
export function bridgeJobRunning(status) {
  return ['queued', 'building', 'running', 'restoring'].includes(status);
}
