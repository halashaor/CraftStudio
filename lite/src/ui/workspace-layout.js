let cancelResize = null;
globalThis.window?.addEventListener(
  'keydown',
  (event) => {
    if (event.key === 'Escape' && cancelResize?.()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);
// Dock sizing stays outside project geometry and scene undo.
export function workspaceLayout({ $, library, notice }) {
  const main = document.querySelector('main'),
    right = $('cad-inspector'),
    tree = $('workspace-tree'),
    shelf = $('workspace-shelf'),
    viewport = $('viewport');
  let sizes = {},
    touched = false,
    drag = null,
    saveTimer = null,
    tail = Promise.resolve();
  const specs = {
    inspector: {
      label: '属性栏宽度',
      orientation: 'vertical',
      sign: -1,
      read: () => right.clientWidth,
      default: () => (innerWidth <= 800 ? 240 : innerWidth <= 1100 ? 270 : 310),
      bounds: () => [
        240,
        Math.max(240, Math.min(560, main.clientWidth - $('cad-browser').clientWidth - 260)),
      ],
    },
    tree: {
      label: '场景树高度',
      orientation: 'horizontal',
      sign: 1,
      read: () => tree.getBoundingClientRect().height,
      default: () => right.clientHeight * 0.45,
      bounds: () => {
        const extra = [...right.children]
          .filter(
            (n) =>
              n !== tree &&
              !['workspace-properties', 'workspace-task'].includes(n.id) &&
              getComputedStyle(n).position !== 'absolute',
          )
          .reduce((sum, n) => sum + n.getBoundingClientRect().height, 0);
        return [100, Math.max(100, right.clientHeight - extra - 160)];
      },
    },
    shelf: {
      label: '素材架高度',
      orientation: 'horizontal',
      sign: -1,
      read: () => shelf.getBoundingClientRect().height,
      default: () => 260,
      bounds: () => {
        const chrome = [...viewport.children]
            .filter((n) => n !== shelf && n !== $('scene'))
            .reduce((sum, n) => sum + n.getBoundingClientRect().height, 0),
          space = viewport.clientHeight - chrome - 180,
          minimum = Math.min(140, Math.max(80, space));
        return [minimum, Math.max(minimum, space)];
      },
    },
  };
  const handles = {};
  function clamp(key, value) {
    const [lo, hi] = specs[key].bounds();
    return Math.round(Math.max(lo, Math.min(hi, value)));
  }
  function apply() {
    if (Number.isFinite(sizes.inspector))
      main.style.setProperty(
        '--workspace-inspector-width',
        clamp('inspector', sizes.inspector) + 'px',
      );
    else main.style.removeProperty('--workspace-inspector-width');
    tree.style.flexBasis = clamp('tree', sizes.tree ?? specs.tree.default()) + 'px';
    shelf.style.height = clamp('shelf', sizes.shelf ?? specs.shelf.default()) + 'px';
    for (const [key, handle] of Object.entries(handles)) {
      const [lo, hi] = specs[key].bounds();
      handle.setAttribute('aria-valuemin', lo);
      handle.setAttribute('aria-valuemax', hi);
      handle.setAttribute('aria-valuenow', clamp(key, sizes[key] ?? specs[key].default()));
    }
  }
  function persist() {
    clearTimeout(saveTimer);
    const data = { schema: 'craftstudio-workspace-layout/1', sizes: { ...sizes } };
    tail = tail
      .catch(() => {})
      .then(() => library.preference('workspace-layout', data))
      .catch((error) => notice('布局保存失败：' + error.message, true));
  }
  function finish(cancel = false) {
    if (!drag) return;
    const own = drag;
    drag = null;
    document.body.classList.remove('workspace-resizing');
    if (cancel) {
      sizes = own.before;
      apply();
    } else persist();
    try {
      own.handle.releasePointerCapture(own.id);
    } catch {}
    window.dispatchEvent(new Event('craftstudio-layout-resized'));
  }
  for (const [key, spec] of Object.entries(specs)) {
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.id = 'workspace-resize-' + key;
    handle.className = 'workspace-resize workspace-resize-' + spec.orientation;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-label', spec.label);
    handle.setAttribute('aria-orientation', spec.orientation);
    handle.title = '拖动调整' + spec.label + '；Esc 取消，双击恢复默认；方向键调整，Shift 微调';
    handles[key] = handle;
    if (key === 'inspector') right.append(handle);
    else if (key === 'tree') tree.after(handle);
    else shelf.prepend(handle);
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      finish(true);
      touched = true;
      handle.focus({ preventScroll: true });
      drag = {
        key,
        handle,
        id: event.pointerId,
        start: spec.orientation === 'vertical' ? event.clientX : event.clientY,
        value: spec.read(),
        before: { ...sizes },
      };
      handle.setPointerCapture(event.pointerId);
      document.body.classList.add('workspace-resizing');
    });
    handle.addEventListener('pointermove', (event) => {
      if (!drag || drag.handle !== handle || event.pointerId !== drag.id) return;
      const coordinate = spec.orientation === 'vertical' ? event.clientX : event.clientY;
      sizes[key] = clamp(key, drag.value + (coordinate - drag.start) * spec.sign);
      apply();
    });
    handle.addEventListener('pointerup', (event) => {
      if (drag?.handle === handle && event.pointerId === drag.id) finish();
    });
    handle.addEventListener('pointercancel', () => {
      if (drag?.handle === handle) finish(true);
    });
    handle.addEventListener('lostpointercapture', () => {
      if (drag?.handle === handle) finish(true);
    });
    handle.addEventListener('dblclick', (event) => {
      event.preventDefault();
      finish(true);
      touched = true;
      delete sizes[key];
      apply();
      persist();
    });
    handle.addEventListener('keydown', (event) => {
      const valid =
        spec.orientation === 'vertical' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
      if (!valid.includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      touched = true;
      sizes[key] = clamp(
        key,
        spec.read() + (event.key === valid[0] ? -1 : 1) * spec.sign * (event.shiftKey ? 1 : 10),
      );
      apply();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 180);
    });
  }
  cancelResize = () => {
    if (!drag) return false;
    finish(true);
    return true;
  };
  window.addEventListener('blur', () => finish(true));
  window.addEventListener('resize', () => {
    finish(true);
    apply();
  });
  const layoutObserver = new ResizeObserver(apply);
  layoutObserver.observe(viewport);
  for (const id of ['saved-views', 'space-review-bar', 'isolation-bar'])
    if ($(id)) layoutObserver.observe($(id));
  apply();
  library
    .preference('workspace-layout')
    .then((data) => {
      if (touched || data?.schema !== 'craftstudio-workspace-layout/1' || !data.sizes) return;
      for (const key of Object.keys(specs))
        if (Number.isFinite(data.sizes[key]) && data.sizes[key] > 0) sizes[key] = data.sizes[key];
      apply();
    })
    .catch((error) => notice('布局读取失败：' + error.message, true));
  return { apply };
}
