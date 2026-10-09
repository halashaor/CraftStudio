// Expose the common choice; keep specialist box rules out of the first-use path.
export function selectionSettingsUI($) {
  const target = $('cad-selection-target'),
    buttons = [...document.querySelectorAll('[data-selection-target]')];
  const sync = () => {
    for (const button of buttons) {
      const active = button.dataset.selectionTarget === target.value;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('primary', active);
    }
    const details = [];
    if ($('cad-box-depth').value === 'through') details.push('穿透');
    if ($('cad-box-hit').value === 'window') details.push('完全框入');
    if ($('cad-box-hit').value === 'direction') details.push('CAD 方向');
    const operation = $('cad-selection-mode').value;
    if (operation !== 'replace')
      details.push({ add: '加选', subtract: '减选', intersect: '交集' }[operation]);
    $('cad-selection-advanced-summary').textContent =
      '更多框选设置' + (details.length ? ' · ' + details.join(' / ') : '');
  };
  for (const button of buttons)
    button.onclick = () => {
      target.value = button.dataset.selectionTarget;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#scene canvas')?.focus({ preventScroll: true });
    };
  for (const id of ['cad-selection-target', 'cad-box-hit', 'cad-box-depth', 'cad-selection-mode'])
    $(id).addEventListener('change', sync);
  sync();
}
