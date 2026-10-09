export const coordKey = (x, y, z) => x + 4096 * (z + 4096 * y);
export const coords = (k) => [k % 4096, Math.floor(k / 16777216), Math.floor(k / 4096) % 4096];
export const chunkKey = (pos) => pos.map((v) => Math.floor(v / 16)).join(',');
