// The UI boundary reports errors and always restores its busy state.
export class TaskRunner {
  constructor({ blocked, begin, end, notice }) {
    Object.assign(this, { blocked, begin, end, notice });
  }
  async run(operation, label) {
    if (this.blocked()) {
      this.notice('正在处理当前修改，请先完成这一笔');
      return;
    }
    const state = this.begin(label);
    try {
      return await operation();
    } catch (error) {
      this.notice(error.message, true);
    } finally {
      this.end(state);
    }
  }
}
