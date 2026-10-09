// A preview can be replaced. A submitted edit keeps ownership until its receipt arrives.
export class OperationSession {
  constructor({ operations, notice }) {
    this.operations = operations;
    this.notice = notice;
  }
  busyReason() {
    return this.operations().some(({ controller }) => controller.isBusy())
      ? '正在提交当前操作，请稍候'
      : '';
  }
  allow() {
    const reason = this.busyReason();
    if (!reason) return true;
    this.notice(reason);
    return false;
  }
  prepare(owner) {
    if (!this.allow()) return false;
    for (const operation of this.operations()) if (operation.id !== owner) operation.close();
    return true;
  }
}
