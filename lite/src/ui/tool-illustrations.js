const drawings = {
  inspect: '<path d="M3 3h12v12H3z" stroke-dasharray="2 2"/><path d="m10 9 8 4-4 1-1 4z"/>',
  'cad-move-direct':
    '<path d="M10 2v16M2 10h16M7 5l3-3 3 3M7 15l3 3 3-3M5 7l-3 3 3 3M15 7l3 3-3 3"/>',
  'cad-rotate-direct': '<path d="M16 7A7 7 0 1 0 16 14M12 7h5V2"/>',
  place: '<path d="m3 8 6-3 6 3v7l-6 3-6-3zM3 8l6 3 6-3M9 11v7M15 2v6M12 5h6"/>',
  paint: '<path d="m10 3 7 4-7 7-4-3zM5 12c-4 1-1 5-4 5 5 1 7-1 7-4"/>',
  erase: '<path d="m3 12 8-9 7 6-8 9H8zM7 8l7 6M10 18h8"/>',
  sample: '<path d="m14 2 4 4-4 4-4-4zM11 7 3 15v3h3l8-8M8 5l8 8"/>',
  'workspace-draw':
    '<path d="M3 16C6 2 14 18 17 4"/><circle cx="3" cy="16" r="2"/><circle cx="17" cy="4" r="2"/>',
  'workspace-measure': '<path d="M3 4v13M17 4v13M3 10h14M6 7l-3 3 3 3M14 7l3 3-3 3"/>',
};
export function illustrateTools(container) {
  for (const button of container.querySelectorAll('button')) {
    const drawing = drawings[button.dataset.tool || button.id];
    if (!drawing) continue;
    const label = document.createElement('span');
    label.textContent = button.textContent;
    button.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${drawing}</svg>`;
    button.append(label);
  }
}
