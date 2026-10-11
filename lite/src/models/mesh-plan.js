import { getParsedMesh, readMesh } from './mesh-sources.js';
import { normalizeMeshTransform } from './mesh-transform.js';
import { voxelizeMesh } from './mesh-voxel.js';
import { boundaryFitter } from '../modeling/voxel-fit.js';

export function meshRecipe(config, source) {
  if (!config.state || typeof config.state.Name !== 'string' || !config.state.Name.includes(':'))
    throw Error('请先选择生成方块的材质');
  return {
    sourceId: source.id,
    transform: normalizeMeshTransform(config.transform, source.transform),
    mode: config.mode || 'surface',
    smart: !!config.smart,
    state: structuredClone(config.state),
    roles: structuredClone(config.roles || {}),
  };
}

// Pure placement plan shared by first conversion and linked rebuilding.
export function meshGeometryPlan(site, config, available = new Set()) {
  const source = readMesh(site.design, config.sourceId),
    recipe = meshRecipe(config, source),
    parsed = getParsedMesh(site.design, source.id),
    voxelized = voxelizeMesh(parsed, recipe.transform, recipe),
    fit = boundaryFitter(recipe.state, { roles: recipe.roles, available: [...available] }),
    usedRoles = {},
    warnings = [...parsed.warnings, ...voxelized.warnings];
  if (voxelized.cells.some((cell) => cell.pos.some((n) => n < 0 || n > 4095)))
    throw Error('模型超出当前工程局部范围 0–4095，请调整位置或尺寸');
  let approximated = 0;
  const operations = voxelized.cells.map(({ pos, mask }) => {
    const material = recipe.smart ? fit(mask, true) : { state: recipe.state, role: 'full' };
    usedRoles[material.role] = (usedRoles[material.role] || 0) + 1;
    if (material.fallback) approximated++;
    return { type: 'set', pos, state: material.state, reason: '模型转方块' };
  });
  if (approximated)
    warnings.push(`${approximated} 格边界无法用当前半砖/楼梯贴合，已用主体方块保留`);
  if (!operations.length) throw Error('当前尺寸没有可生成的方块，请调整尺寸或放置位置');
  return {
    operations,
    guide: [],
    warnings,
    usedRoles,
    meshStats: {
      ...voxelized.stats,
      bounds: voxelized.bounds,
      closed: parsed.topology.closed,
      sourceName: source.name,
      approximated,
    },
  };
}
