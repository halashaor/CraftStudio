import { emptyProject } from '../minecraft/codec.js';

export function newProject({ name, size }) {
  if (
    !Array.isArray(size) ||
    size.length !== 3 ||
    size.some((value) => !Number.isInteger(value) || value < 1 || value > 4096)
  ) {
    throw Error('工作范围的长、宽、高需要是 1 到 4096 之间的整数');
  }
  return { ...emptyProject(name.trim() || '未命名设计'), size: [...size] };
}
