function reject(code, message) {
  throw Object.assign(Error(message), { code });
}
export function requestReceipt(request, receipts) {
  if (!request || typeof request !== 'object' || Array.isArray(request))
    reject('INVALID_REQUEST', '请求需要 JSON 对象');
  if (request.schema && request.schema !== 'craftstudio-design/1')
    reject('UNSUPPORTED_SCHEMA', '不支持的接口版本');
  const id = request.id,
    hasId = id !== undefined && id !== null;
  if (hasId && typeof id !== 'string' && !Number.isSafeInteger(id))
    reject('INVALID_REQUEST_ID', '请求 ID 需要字符串或安全整数');
  const fingerprint = JSON.stringify({ method: request.method, params: request.params || {} });
  const previous = hasId ? receipts.get(id) : null;
  if (previous && previous.fingerprint !== fingerprint)
    reject('REQUEST_ID_REUSED', '同一请求 ID 不能用于不同操作');
  return { id, hasId, fingerprint, replay: previous ? structuredClone(previous.result) : null };
}
export function rememberReceipt(receipts, context, result) {
  if (!context.hasId) return;
  receipts.set(context.id, { fingerprint: context.fingerprint, result: structuredClone(result) });
  if (receipts.size > 256) receipts.delete(receipts.keys().next().value);
}
const transientMethods = new Set([
  'proposal.prepare',
  'proposal.cancel',
  'construction.prepare',
  'construction.cancel',
  'view.isolate',
]);
export function durableReceipt(record) {
  const method = JSON.parse(record.fingerprint).method;
  return (
    !transientMethods.has(method) &&
    (!method.startsWith('transaction.') || method === 'transaction.commit')
  );
}
