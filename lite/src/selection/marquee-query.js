// A running query and one replaceable successor; cancelled gestures never revive.
export class MarqueeQuery {
  constructor({ run, show, fail }) {
    Object.assign(this, { run, show, fail });
    this.epoch = 0;
    this.running = false;
    this.next = null;
  }
  update(input) {
    this.next = input;
    this.flush();
  }
  async flush() {
    if (this.running || !this.next) return;
    const input = this.next,
      epoch = this.epoch;
    this.next = null;
    this.running = true;
    try {
      const result = await this.run(input);
      if (epoch === this.epoch) this.show(result, input, !!this.next);
    } catch (error) {
      if (epoch === this.epoch) this.fail(error);
    } finally {
      this.running = false;
      this.flush();
    }
  }
  cancel() {
    this.epoch++;
    this.next = null;
  }
}
