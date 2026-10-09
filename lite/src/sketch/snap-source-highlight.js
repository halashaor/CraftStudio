// Temporary display feedback: it never changes saved guide data or geometry.
export function snapSourceHighlight(color = 0x55dfdc) {
  const materials = new Map(),
    roots = new Set();
  let signature = '';
  function clear() {
    for (const [material, original] of materials) material.color.copy(original);
    for (const root of roots) delete root.userData.snapHighlighted;
    materials.clear();
    roots.clear();
    signature = '';
  }
  function set(objects, ids) {
    const selected = new Set(ids.filter(Boolean)),
      key = [...selected].sort().join('\0');
    if (key === signature) return;
    clear();
    signature = key;
    if (!selected.size) return;
    for (const root of objects) {
      if (!root.visible || !selected.has(root.userData.guideId)) continue;
      roots.add(root);
      root.userData.snapHighlighted = true;
      root.traverse((node) => {
        if (!node.isLine || !node.visible) return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material])
          if (material?.color) {
            if (!materials.has(material)) materials.set(material, material.color.clone());
            material.color.setHex(color);
          }
      });
    }
  }
  return { set, clear };
}
