import { meshGeometryPlan, meshRecipe } from './mesh-plan.js';
import { meshMutation, readMesh } from './mesh-sources.js';
import { normalizeMeshTransform } from './mesh-transform.js';
import { regenerateObjects } from '../modeling/generation.js';

// The source is reusable geometry; each derived object retains its own placement recipe.
export function meshConstructionPlan(site, config, available) {
  const source = readMesh(site.design, config.sourceId);
  let plan;
  if (config.saveOnly) {
    plan = {
      operations: [],
      guide: [],
      warnings: source.warnings || [],
      usedRoles: {},
      design: structuredClone(site.design),
    };
  } else if (config.objectId) {
    const object = site.design.objects.find((object) => object.id === config.objectId);
    if (!object || object.generation?.type !== 'mesh' || object.meshSourceId !== source.id)
      throw Error('此生成结果与模型来源不匹配，请重新选择');
    if (object.generation.detached) throw Error('此结果已独立化，可从模型创建新的结果');
    plan = regenerateObjects(site, [object], {
      manualStrategy: config.manualStrategy || 'preserve',
      overrides: { [object.id]: meshRecipe(config, source) },
      available,
    });
  } else {
    plan = {
      ...meshGeometryPlan(site, config, available),
      design: structuredClone(site.design),
      newMeshObject: meshRecipe(config, source),
    };
  }
  meshMutation({ design: plan.design }, 'meshes.put', {
    source: {
      id: source.id,
      ...(config.saveOnly && config.sourceName ? { name: config.sourceName } : {}),
      transform: normalizeMeshTransform(config.transform, source.transform),
      hidden: config.saveOnly ? false : config.hideSource !== false,
    },
  });
  return plan;
}
