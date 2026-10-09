// Opt-in, bounded timings. Never record files, coordinates, materials or prompts.
export class PerformanceTrace {
  constructor(clock = () => performance.now()) {
    this.clock = clock;
    this.enabled = false;
    this.events = [];
    this.serial = 0;
  }
  start() {
    this.events = [];
    this.serial = 0;
    this.enabled = true;
    return this.read();
  }
  stop() {
    this.enabled = false;
    return this.read();
  }
  record(stage, details = {}) {
    if (!this.enabled) return;
    this.events.push({ sequence: ++this.serial, at: this.clock(), stage, ...details });
    if (this.events.length > 256) this.events.shift();
  }
  begin() {
    return this.enabled ? this.clock() : null;
  }
  finish(stage, start, details = {}) {
    if (start !== null) this.record(stage, { durationMs: this.clock() - start, ...details });
  }
  read() {
    return {
      schema: 'craftstudio-performance/1',
      enabled: this.enabled,
      events: structuredClone(this.events),
      limits:
        'CPU timings and WebGL frame submission, not monitor presentation or hardware GPU completion',
    };
  }
}
