// Release only pooled graphics resources with no scene or retained-model owner.
export function pruneGraphics({ textures, materials, roots = [], pinnedTextureKeys = [] }) {
  const liveMaterials = new Set(),
    liveTextures = new Set(pinnedTextureKeys.map((key) => textures.get(key)).filter(Boolean));
  for (const root of roots)
    root.traverse((node) => {
      for (const material of Array.isArray(node.material) ? node.material : [node.material])
        if (material) {
          liveMaterials.add(material);
          if (material.map) liveTextures.add(material.map);
        }
    });
  let disposedMaterials = 0;
  for (const [key, material] of materials)
    if (!liveMaterials.has(material)) {
      material.dispose();
      materials.delete(key);
      disposedMaterials++;
    }
  const releasedTextures = [];
  for (const [key, texture] of textures)
    if (!liveTextures.has(texture)) {
      texture.dispose();
      textures.delete(key);
      releasedTextures.push(key);
    }
  return { disposedMaterials, releasedTextures };
}
export async function loadTextureInfo(
  info,
  load,
  {
    createURL = (blob) => URL.createObjectURL(blob),
    revokeURL = (url) => URL.revokeObjectURL(url),
  } = {},
) {
  if (!info) return null;
  const owned = !!info.bytes,
    uri = owned ? createURL(new Blob([info.bytes], { type: 'image/png' })) : info.uri;
  if (!uri) return null;
  try {
    return await load(uri);
  } finally {
    if (owned) revokeURL(uri);
  }
}
