import { MarqueePreviewView } from './marquee-preview-view.js';
import { MarqueeQuery } from './marquee-query.js';
import { dialogOwnsKeyboard, nativeControlTarget } from '../ui/keyboard-context.js';

export class MarqueeSelection {
  constructor({
    THREE,
    canvas,
    scene,
    controls,
    getCamera,
    getSummary,
    getOptions,
    getSelection,
    blocked,
    call,
    commit,
    menu,
    notice,
    requestRender,
  }) {
    Object.assign(this, {
      THREE,
      canvas,
      getCamera,
      getSummary,
      getOptions,
      getSelection,
      blocked,
      call,
      commit,
      menu,
      notice,
    });
    this.view = new MarqueePreviewView({ THREE, scene, requestRender });
    this.query = new MarqueeQuery({
      run: (input) => call('screenBoxSelection', { ...input, preview: true }),
      show: (result, input, pending) => {
        if (!this.element || this.finishing || !this.current(input)) return;
        this.view.show(
          result,
          input.operation,
          pending,
          input.depth === 'through' || input.target === 'objects',
        );
        this.element.dataset.feedback = pending
          ? '更新候选中…'
          : `${{ replace: '将选中', add: '将增加', subtract: '将减去', intersect: '将保留' }[input.operation]} ${result.affected.toLocaleString()} 格` +
            (result.objectIds ? ` · 命中 ${result.objectIds.length} 个对象` : '') +
            (result.affected > 2048 ? ` · 点示 ${result.shown.toLocaleString()} 格` : '');
        this.element.dataset.ready = String(!pending);
      },
      fail: (error) => {
        if (this.element) this.element.dataset.feedback = error.message;
        this.view.clear();
      },
    });
    canvas.addEventListener('pointerdown', (event) => this.start(event));
    canvas.addEventListener('pointermove', (event) => this.move(event));
    canvas.addEventListener('pointerup', (event) => this.finish(event));
    canvas.addEventListener('pointercancel', () => this.cancel());
    canvas.addEventListener('lostpointercapture', () => {
      if (!this.finishing) this.cancel();
    });
    controls.addEventListener('change', () => this.cancel());
    window.addEventListener('blur', () => this.cancel());
    window.addEventListener('craftstudio-selection', () => this.cancel());
    window.addEventListener(
      'keydown',
      (event) => {
        if (
          !this.element ||
          event.key !== 'Escape' ||
          dialogOwnsKeyboard() ||
          nativeControlTarget(document.activeElement)
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.cancel();
        notice('已取消本次框选，原选择保留');
      },
      true,
    );
  }
  current(input) {
    const head = this.getSummary(),
      options = this.getOptions();
    return (
      head.workspaceId === input.workspaceId &&
      head.revision === input.expectedRevision &&
      options.enabled &&
      ['target', 'depth', 'mode', 'cut', 'plants', 'showGround', 'showExisting', 'hit'].every(
        (key) => options[key] === input[key],
      ) &&
      !this.blocked()
    );
  }
  start(event) {
    this.cancel();
    if (this.blocked() || (event.button === 0 && !this.getOptions().enabled)) return;
    this.pointer = {
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      id: event.pointerId,
      operation: event.ctrlKey ? 'subtract' : event.shiftKey ? 'add' : this.getOptions().operation,
    };
  }
  input(event) {
    const rect = this.canvas.getBoundingClientRect(),
      head = this.getSummary(),
      camera = this.getCamera(),
      options = this.getOptions(),
      p = this.pointer,
      end = [
        Math.max(rect.left, Math.min(rect.right, event.clientX)),
        Math.max(rect.top, Math.min(rect.bottom, event.clientY)),
      ],
      crossing = options.hit === 'crossing' || (options.hit === 'direction' && end[0] < p.x);
    camera.updateMatrixWorld(true);
    const matrix = new this.THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    return {
      ...options,
      operation: p.operation,
      selection: p.selection,
      workspaceId: head.workspaceId,
      expectedRevision: head.revision,
      matrix: matrix.toArray(),
      inverse: matrix.clone().invert().toArray(),
      viewport: [rect.width, rect.height],
      box: {
        min: [Math.min(p.x, end[0]) - rect.left, Math.min(p.y, end[1]) - rect.top],
        max: [Math.max(p.x, end[0]) - rect.left, Math.max(p.y, end[1]) - rect.top],
      },
      crossing,
    };
  }
  move(event) {
    const p = this.pointer;
    if (!p || p.button !== 0 || this.finishing) return;
    if (this.blocked() || event.altKey) {
      this.cancel();
      return;
    }
    if (!this.element && Math.hypot(event.clientX - p.x, event.clientY - p.y) < 8) return;
    if (!this.element) {
      p.selection = this.getSelection();
      this.element = document.createElement('div');
      this.element.id = 'cad-marquee';
      this.element.setAttribute('role', 'status');
      document.body.append(this.element);
      this.canvas.setPointerCapture(event.pointerId);
    }
    const input = this.input(event),
      rect = this.canvas.getBoundingClientRect();
    Object.assign(this.element.style, {
      left: rect.left + input.box.min[0] + 'px',
      top: rect.top + input.box.min[1] + 'px',
      width: input.box.max[0] - input.box.min[0] + 'px',
      height: input.box.max[1] - input.box.min[1] + 'px',
    });
    this.element.dataset.crossing = String(input.crossing);
    this.element.dataset.operation = p.operation;
    this.element.dataset.label =
      { replace: '重新选择', add: '增加', subtract: '减去', intersect: '保留交集' }[p.operation] +
      ' · ' +
      (input.crossing ? '框到就选' : '完全框入') +
      ' · Esc 取消';
    this.element.dataset.feedback = '更新候选中…';
    this.element.dataset.ready = 'false';
    this.view.pending(true);
    this.query.update(input);
  }
  async finish(event) {
    const p = this.pointer;
    if (!p || event.button !== p.button) return;
    if (!this.element) {
      if (p.button === 2 && Math.hypot(event.clientX - p.x, event.clientY - p.y) < 5)
        this.menu.open(event.clientX, event.clientY);
      this.pointer = null;
      return;
    }
    const input = this.input(event);
    this.finishing = true;
    this.query.cancel();
    this.element.dataset.feedback = '正在确认选区…';
    try {
      const result = await this.call('screenBoxSelection', input);
      if (this.pointer !== p || !this.current(input)) return;
      this.commit(result, input);
    } catch (error) {
      if (this.pointer === p) this.notice(error.message, true);
    } finally {
      if (this.pointer === p) this.cancel();
    }
  }
  cancel() {
    const p = this.pointer;
    this.pointer = null;
    this.finishing = false;
    this.query.cancel();
    this.element?.remove();
    this.element = null;
    this.view.clear();
    if (p && this.canvas.hasPointerCapture(p.id)) this.canvas.releasePointerCapture(p.id);
  }
}
