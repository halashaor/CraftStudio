import { coords, terrainType } from '../core/site.js';
import { stateKey } from '../minecraft/codec.js';
// Diff the candidate against live data, retaining deletion rather than inventing air.
export function proposalOperations(site, candidate) {
  const ops = [];
  for (const key of new Set([...site.overlay.keys(), ...candidate.overlay.keys()])) {
    const pos = coords(key),
      before = site.at(pos),
      after = candidate.at(pos);
    if (
      (before ? stateKey(site.palette[before.state]) : null) ===
        (after ? stateKey(candidate.palette[after.state]) : null) &&
      JSON.stringify(before?.nbt || null) === JSON.stringify(after?.nbt || null)
    )
      continue;
    ops.push({
      type: 'set',
      pos,
      state: after ? candidate.palette[after.state] : null,
      nbt: after?.nbt || null,
      reason: 'AI / 方案预览',
    });
  }
  return ops;
}
// Summarize the exact cell diff against the current design, not the imported baseline.
export function proposalChanges(site, operations) {
  const counts = { add: 0, replace: 0, remove: 0, terrain: 0, total: operations.length };
  for (const operation of operations) {
    const before = site.at(operation.pos);
    if (operation.state === null) counts.remove++;
    else if (before) counts.replace++;
    else counts.add++;
    const names = [before ? site.palette[before.state].Name : null, operation.state?.Name];
    if (names.some((name) => name && ['ground', 'water'].includes(terrainType(name))))
      counts.terrain++;
  }
  return counts;
}
export function acceptedProposal(site, candidate, operations, policy) {
  const accepted = site.fork();
  accepted.operations(operations, policy || {});
  if (accepted.lastSkipped) throw Error('方案包含被保护的改动，请调整方案或放置条件后重新确认');
  accepted.design = structuredClone(candidate.design);
  return accepted;
}
