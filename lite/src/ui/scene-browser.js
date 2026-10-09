import { CollectionHierarchy } from '../components/collection-hierarchy.js';
import { generationLinks } from '../modeling/generation-links.js';
import { objectHidden } from '../components/collections.js';
import { objectLocked } from '../components/object-protection.js';
export const objectKindLabel = (kind) =>
  ({
    object: '对象',
    house: '建筑',
    prefab: '构件副本',
    selection: '手工对象',
    feature: '建模特征',
    geometry: '图形生成',
    extrude: '拉伸',
    loft: '放样',
    sweep: '扫掠',
    array: '阵列',
    pathArray: '路径阵列',
  })[kind] || kind;

export class SceneBrowser {
  constructor(design = {}, links = generationLinks(design)) {
    this.design = design;
    this.objects = design.objects || [];
    this.hierarchy = new CollectionHierarchy(design.collections);
    this.guides = new Map((design.guides || []).map((guide) => [guide.id, guide]));
    this.collections = new Map(
      (design.collections || []).map((collection) => [collection.id, collection]),
    );
    this.relations = new Map(links.objects.map((object) => [object.id, object]));
    this.sources = new Map();
    this.ownedGuides = new Set();
    const parents = new Map();
    for (const guide of design.guides || []) {
      if (guide.provenance?.kind === 'offset') parents.set(guide.id, [guide.provenance.guideId]);
    }
    for (const object of this.objects) {
      const relation = this.relations.get(object.id);
      if (object.guideId && relation && !relation.detached) {
        parents.set(object.guideId, [
          ...(parents.get(object.guideId) || []),
          ...relation.sources.map((source) => source.id),
        ]);
      }
    }
    for (const object of this.objects) {
      const queue = [
        ...(this.relations.get(object.id)?.sources || []).map((source) => source.id),
        ...(object.guideId ? [object.guideId] : []),
      ];
      const sources = new Set();
      for (let index = 0; index < queue.length; index++) {
        const id = queue[index];
        if (sources.has(id)) continue;
        sources.add(id);
        for (const parent of parents.get(id) || []) queue.push(parent);
      }
      this.sources.set(object.id, sources);
      for (const id of sources) this.ownedGuides.add(id);
    }
    const families = new Map(
      (design.componentDefinitions || []).map((family) => [family.id, family.name]),
    );
    this.labels = new Map(
      this.objects.map((object) => [
        object.id,
        [
          object.name,
          objectKindLabel(object.kind || 'object'),
          this.hierarchy.path(object.collectionId),
          families.get(object.instanceOf),
          ...[...this.sources.get(object.id)].map((id) => this.guides.get(id)?.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase(),
      ]),
    );
  }

  filter({ query = '', collection = '', attention = false, kind = '', state = '' } = {}) {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matches = (text, kind = '') =>
      words.every((word) => text.includes(word) || word === kind.toLocaleLowerCase());
    const objectIds = new Set(),
      selectableObjectIds = new Set(),
      guideIds = new Set();
    let attentionCount = 0;
    for (const object of this.objects) {
      const needsAttention = !!this.relations.get(object.id)?.issues.length;
      if (needsAttention) attentionCount++;
      const inScope =
        collection === 'none'
          ? !object.collectionId
          : collection.startsWith('group:')
            ? this.hierarchy.contains(collection.slice(6), object.collectionId)
            : true;
      const hidden = objectHidden(this.design, object),
        locked = objectLocked(this.design, object);
      if (
        !inScope ||
        (attention && !needsAttention) ||
        !matches(this.labels.get(object.id), object.kind || 'object') ||
        (kind && (object.kind || 'object') !== kind) ||
        (state === 'visible' && hidden) ||
        (state === 'hidden' && !hidden) ||
        (state === 'locked' && !locked)
      )
        continue;
      objectIds.add(object.id);
      if (!hidden) selectableObjectIds.add(object.id);
      for (const id of this.sources.get(object.id)) guideIds.add(id);
    }
    for (const guide of this.guides.values()) {
      if (
        !attention &&
        !kind &&
        !state &&
        (!collection || (collection === 'none' && !this.ownedGuides.has(guide.id))) &&
        matches((guide.name || '').toLocaleLowerCase())
      )
        guideIds.add(guide.id);
    }
    const editableGuides = [...this.guides.values()].filter(
      (guide) => guide.recipe?.kind && guide.recipe.points,
    );
    return {
      objectIds,
      selectableObjectIds,
      guideIds: new Set(
        editableGuides.filter((guide) => guideIds.has(guide.id)).map((guide) => guide.id),
      ),
      objectCount: this.objects.length,
      guideCount: editableGuides.length,
      attentionCount,
      filtered: !!words.length || !!collection || attention || !!kind || !!state,
    };
  }
}
