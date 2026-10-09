import { coordKey, coords } from '../core/site.js';
import { objectHidden } from '../components/collections.js';
import { selectionPredicate } from './selection-mask.js';
export function containedObjectIds(objects, ids, selection) {
  const contains = selectionPredicate(selection);
  const byId = new Map(objects.map((object) => [object.id, object]));
  return new Set(
    [...ids].filter((id) => {
      const object = byId.get(id);
      return (
        object?.cells?.length &&
        object.cells.every((cell) => contains(Array.isArray(cell) ? cell : coords(cell)))
      );
    }),
  );
}
export function objectsAtCell(design, position) {
  const key = position.join(','),
    encoded = coordKey(...position);
  return (design.objects || [])
    .filter(
      (object) =>
        !objectHidden(design, object) &&
        position.every((n, a) => n >= object.min[a] && n <= object.max[a]) &&
        object.cells?.some((cell) =>
          Array.isArray(cell)
            ? cell.every((n, a) => n === position[a])
            : typeof cell === 'number'
              ? cell === encoded
              : cell === key,
        ),
    )
    .sort((a, b) => a.cells.length - b.cells.length);
}
export function combineObjectIds(current, incoming, operation = 'replace') {
  const before = new Set(current),
    next = new Set(incoming);
  if (operation === 'replace') return next;
  if (operation === 'add') return new Set([...before, ...next]);
  if (operation === 'subtract') return new Set([...before].filter((id) => !next.has(id)));
  if (operation === 'intersect') return new Set([...before].filter((id) => next.has(id)));
  throw Error('未知对象选择组合');
}
