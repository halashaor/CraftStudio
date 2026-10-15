import { screenBoxSelection, screenObjectMatches, projectScreen } from './screen-box.js';
import { objectHidden } from '../components/collections.js';
import { coordKey, coords } from '../core/coordinates.js';
import { selectionPredicate } from './selection-mask.js';

const point = (value) =>
  Array.isArray(value)
    ? value
    : typeof value === 'number'
      ? coords(value)
      : value.split(',').map(Number);
export class ScreenSelectionQuery {
  constructor() {
    this.views = new WeakMap();
  }
  query(site, options) {
    const { box, crossing = true, preview, selection, operation, target, ...context } = options;
    const key = JSON.stringify(context);
    let view = this.views.get(site);
    if (!view || view.key !== key || view.isolateKeys !== context.isolateKeys) {
      view = {
        key,
        isolateKeys: context.isolateKeys,
        chunks: new Map(),
        visibility: new Map(),
        cells: 0,
        limit: 262144,
      };
      this.views.set(site, view);
    }
    const rectangle = JSON.stringify([box, crossing, target]);
    if (view.rectangle !== rectangle) {
      let range, objectIds;
      if (target === 'objects') {
        const objects = site.design.objects.filter(
          (object) =>
            !objectHidden(site.design, object) &&
            screenObjectMatches(object, {
              box,
              crossing,
              project: (p) => projectScreen(p, context.matrix, context.viewport),
            }),
        );
        objectIds = objects.map((object) => object.id);
        const members = [
          ...new Set(objects.flatMap((o) => (o.cells || []).map((v) => coordKey(...point(v))))),
        ].map(coords);
        range = members.length
          ? {
              members,
              min: [0, 1, 2].map((a) => members.reduce((n, p) => Math.min(n, p[a]), Infinity)),
              max: [0, 1, 2].map((a) => members.reduce((n, p) => Math.max(n, p[a]), -Infinity)),
            }
          : null;
      } else range = screenBoxSelection(site, options, view);
      view.result = { range, objectIds };
      view.rectangle = rectangle;
    }
    if (preview) return selectionFeedback(view.result, selection, operation);
    return target === 'objects' ? view.result : view.result.range;
  }
}

// The display budget limits drawing only. Final selection always uses every matching cell.
export function selectionFeedback(result, selection, operation = 'replace', limit = 12000) {
  const members = result.range?.members || [],
    selected = selection ? selectionPredicate(selection) : () => false,
    affected =
      operation === 'add'
        ? members.filter((p) => !selected(p))
        : ['subtract', 'intersect'].includes(operation)
          ? members.filter(selected)
          : members,
    shown = Math.min(limit, affected.length),
    coordinates = new Float32Array(shown * 3);
  for (let i = 0; i < shown; i++)
    coordinates.set(affected[Math.floor((i * affected.length) / shown)], i * 3);
  return {
    hits: members.length,
    affected: affected.length,
    shown,
    coordinates,
    objectIds: result.objectIds,
  };
}
