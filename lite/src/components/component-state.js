import { stateKey } from '../minecraft/codec.js';
export const componentCell = (site, pos) => {
  const b = site.at(pos);
  return b
    ? { state: structuredClone(site.palette[b.state]), nbt: structuredClone(b.nbt || null) }
    : null;
};
export const sameComponentCell = (a, b) =>
  (!a && !b) ||
  (!!a &&
    !!b &&
    stateKey(a.state) === stateKey(b.state) &&
    JSON.stringify(a.nbt || null) === JSON.stringify(b.nbt || null));
