import { coordKey, coords } from '../core/site.js';
import { selectionPredicate } from './selection-mask.js';
import { objectHidden } from '../components/collections.js';

const cellKey = (cell) => (Array.isArray(cell) ? coordKey(...cell) : cell);
function membersOf(objects) {
  const members = new Set();
  for (const object of objects) for (const cell of object.cells) members.add(cellKey(cell));
  return members;
}
function boundsOf(objects) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const object of objects)
    for (const axis of [0, 1, 2]) {
      min[axis] = Math.min(min[axis], object.min[axis]);
      max[axis] = Math.max(max[axis], object.max[axis]);
    }
  return { min, max };
}
function sameMembers(a, b) {
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

// Whole-object picks follow identity. Partial masks stay at their chosen coordinates.
export class ObjectSelectionBinding {
  constructor() {
    this.clear();
  }
  clear() {
    this.workspaceId = null;
    this.revision = null;
    this.ids = [];
    this.members = new Set();
    this.bounds = null;
  }
  bind({ workspaceId, revision, ids, candidates, selection }) {
    this.clear();
    if (!ids.length) return;
    const selected = new Set(ids);
    const objects = candidates.filter((object) => selected.has(object.id));
    const members = membersOf(objects),
      contains = selectionPredicate(selection);
    // Every selected cell must be covered by a complete selected object, including overlaps.
    if (
      candidates.some((object) =>
        object.cells?.some(
          (cell) =>
            contains(Array.isArray(cell) ? cell : coords(cell)) && !members.has(cellKey(cell)),
        ),
      )
    )
      return;
    this.workspaceId = workspaceId;
    this.revision = revision;
    this.ids = [...ids];
    this.members = members;
    this.bounds = { min: [...selection.min], max: [...selection.max] };
  }
  update(summary) {
    if (!this.ids.length) return null;
    if (summary.workspaceId !== this.workspaceId) {
      this.clear();
      return null;
    }
    if (summary.revision === this.revision) return null;
    const byId = new Map(summary.design.objects.map((object) => [object.id, object]));
    const objects = this.ids
      .map((id) => byId.get(id))
      .filter((object) => object?.cells?.length && !objectHidden(summary.design, object));
    if (!objects.length) {
      this.clear();
      return { ids: [], selection: null };
    }
    const members = membersOf(objects),
      bounds = boundsOf(objects);
    const changed =
      objects.length !== this.ids.length ||
      !sameMembers(members, this.members) ||
      bounds.min.some((value, axis) => value !== this.bounds.min[axis]) ||
      bounds.max.some((value, axis) => value !== this.bounds.max[axis]);
    this.revision = summary.revision;
    this.ids = objects.map((object) => object.id);
    this.members = members;
    this.bounds = bounds;
    return changed ? { ids: [...this.ids], selection: { ...bounds, members: [...members] } } : null;
  }
  matches(selection) {
    return (
      this.ids.length > 0 &&
      Array.isArray(selection.members) &&
      sameMembers(this.members, new Set(selection.members.map(cellKey)))
    );
  }
}
