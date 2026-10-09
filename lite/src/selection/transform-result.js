import { memberCoordinates } from './selection-preview.js';

export function confirmedSelection(snapshot, pose, receipt) {
  if (snapshot.mode === 'paste') {
    const object = receipt.design.objects.find(
      (object) => object.id === receipt.selectionResult.objectId,
    );
    return { min: object.min, max: object.max, members: object.cells };
  }
  const members = Array.from(memberCoordinates(snapshot.relativeMembers), (pos) => {
    let [x, y, z] = pos,
      [width, , length] = snapshot.size;
    for (let turn = 0; turn < pose.turn; turn++) {
      [x, z] = [length - 1 - z, x];
      [width, length] = [length, width];
    }
    return [x, y, z].map((value, axis) => value + pose.at[axis]);
  });
  return {
    min: pose.at,
    max: pose.at.map((value, axis) => value + pose.extent[axis] - 1),
    members,
  };
}
