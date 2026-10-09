// A temporary menu owns keyboard input; closing it returns control to the view.
export function viewportContextMenu({ canvas, items }) {
  const element = document.createElement('div');
  element.id = 'cad-context-menu';
  element.hidden = true;
  element.dataset.shortcutScope = 'commands';
  element.setAttribute('role', 'menu');
  element.setAttribute('aria-label', '视口操作');
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.dataset.label = item.label;
    const label = document.createElement('span'),
      reason = document.createElement('small');
    label.textContent = item.label;
    button.append(label, reason);
    button.onclick = () => {
      if (button.disabled) return;
      close(true);
      item.run();
    };
    element.append(button);
    item.button = button;
    item.reasonElement = reason;
  }
  document.body.append(element);
  function close(restore = false) {
    const focused = element.contains(document.activeElement);
    element.hidden = true;
    if (restore && focused) canvas.focus({ preventScroll: true });
  }
  function open(x, y) {
    for (const item of items) {
      const reason = item.reason?.() || '';
      item.button.disabled = !!reason;
      item.button.title = reason;
      item.reasonElement.textContent = reason;
      item.reasonElement.hidden = !reason;
    }
    element.hidden = false;
    const rect = element.getBoundingClientRect();
    element.style.left = Math.max(4, Math.min(x, innerWidth - rect.width - 4)) + 'px';
    element.style.top = Math.max(4, Math.min(y, innerHeight - rect.height - 4)) + 'px';
    element.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  document.addEventListener('pointerdown', (e) => {
    if (!element.contains(e.target)) close();
  });
  window.addEventListener('blur', () => close());
  window.addEventListener(
    'keydown',
    (e) => {
      if (element.hidden || e.isComposing) return;
      e.stopImmediatePropagation();
      const available = [...element.querySelectorAll('button:not(:disabled)')],
        current = available.indexOf(document.activeElement);
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        close(true);
        return;
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        const index =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? available.length - 1
              : (current + (e.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length;
        available[index]?.focus({ preventScroll: true });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (current >= 0) available[current].click();
      }
    },
    true,
  );
  return { element, open, close };
}
