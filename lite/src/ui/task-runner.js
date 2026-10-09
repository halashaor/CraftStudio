// The UI boundary reports errors and always restores its busy state.
export class TaskRunner {
  constructor({ blocked, begin, end, notice }) {
    Object.assign(this, { blocked, begin, end, notice });
  }
  async run(operation, label) {
    try {
      return await this.execute(operation, label);
    } catch (error) {
      this.notice(error.message, true);
    }
  }
  async execute(operation, label) {
    if (this.blocked()) {
      throw Error('正在处理当前修改，请先完成这一笔');
    }
    const state = this.begin(label);
    try {
      return await operation();
    } finally {
      this.end(state);
    }
  }
}
