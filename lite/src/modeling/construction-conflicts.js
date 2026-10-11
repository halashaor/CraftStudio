import { terrainType } from '../core/site.js';

const labels = {
  terrain: '地形与河水',
  existing: '原建筑与植被',
  protected: '保留区',
  locked: '锁定对象或集合',
  other: '其他冲突',
};

export function constructionConflictKind(site, pos, locked) {
  if (locked) return 'locked';
  if (site.protected.some((r) => pos.every((v, a) => v >= r.min[a] && v <= r.max[a])))
    return 'protected';
  const original = site.at(pos, true);
  if (!original) return 'other';
  const category = terrainType(site.palette[original.state].Name);
  return category === 'ground' || category === 'water' ? 'terrain' : 'existing';
}

function extendBounds(bounds, pos) {
  if (!bounds) return { min: [...pos], max: [...pos] };
  for (let axis = 0; axis < 3; axis++) {
    bounds.min[axis] = Math.min(bounds.min[axis], pos[axis]);
    bounds.max[axis] = Math.max(bounds.max[axis], pos[axis]);
  }
  return bounds;
}

// The caller passes final, deduplicated operations. Keep complete counts and
// bounds while bounding visual samples; even a late category gets a marker.
export class ConstructionConflicts {
  constructor() {
    this.count = 0;
    this.bounds = null;
    this.groups = new Map();
    this.conflicts = [];
    this.sampleCount = 0;
  }

  add(pos, message, kind = 'other') {
    let group = this.groups.get(kind);
    if (!group) {
      group = { kind, label: labels[kind], count: 0, bounds: null, samples: [] };
      this.groups.set(kind, group);
    }
    this.count++;
    this.bounds = extendBounds(this.bounds, pos);
    group.count++;
    group.bounds = extendBounds(group.bounds, pos);
    const sample = { pos: [...pos], message };
    if (this.conflicts.length < 20) this.conflicts.push(sample);
    if (!group.samples.length && this.sampleCount === 200) {
      const largest = [...this.groups.values()].reduce((a, b) =>
        a.samples.length >= b.samples.length ? a : b,
      );
      largest.samples.pop();
      this.sampleCount--;
    }
    if (this.sampleCount < 200) {
      group.samples.push(sample);
      this.sampleCount++;
    }
  }

  summary() {
    return structuredClone({
      count: this.count,
      bounds: this.bounds,
      groups: Object.keys(labels)
        .filter((kind) => this.groups.has(kind))
        .map((kind) => this.groups.get(kind)),
      sampleCount: this.sampleCount,
      truncated: this.sampleCount < this.count,
    });
  }
}
