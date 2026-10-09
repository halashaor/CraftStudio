import { coordKey } from '../core/coordinates.js';

export const objectLocked = (design, object) =>
  !!object.locked ||
  !!design.collections?.find((collection) => collection.id === object.collectionId)?.locked;

const memberKey = (value) =>
  typeof value === 'number'
    ? value
    : coordKey(...(Array.isArray(value) ? value : value.split(',').map(Number)));

// Object membership arrays are replaced by edits, never mutated in place.
// Weak keys let repeated brush strokes reuse indexes without retaining closed scenes.
const indexes = new WeakMap();
function memberIndex(cells) {
  if (!indexes.has(cells)) indexes.set(cells, new Set(cells.map(memberKey)));
  return indexes.get(cells);
}

// Resolve lock flags per operation; reuse only immutable membership indexes.
export class ObjectProtection {
  constructor(design) {
    const lockedCollections = new Set(
      (design.collections || [])
        .filter((collection) => collection.locked)
        .map((collection) => collection.id),
    );
    this.entries = (design.objects || [])
      .filter((object) => object.locked || lockedCollections.has(object.collectionId))
      .map((object) => ({
        object,
        members: Array.isArray(object.cells) ? memberIndex(object.cells) : null,
      }));
  }

  at(position) {
    const key = coordKey(...position);
    for (const { object, members } of this.entries) {
      if (
        members
          ? members.has(key)
          : position.every((value, axis) => value >= object.min[axis] && value <= object.max[axis])
      )
        return object;
    }
    return null;
  }
}
