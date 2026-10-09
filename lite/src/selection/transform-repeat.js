// Remember an operation, never a captured selection or a second copy of scene data.
export class TransformRepeat {
  constructor() {
    this.recipe = null;
  }
  record(snapshot, pose) {
    if (!['move', 'copy', 'rotate'].includes(snapshot.mode)) return;
    this.recipe = {
      workspaceId: snapshot.workspaceId,
      mode: snapshot.mode,
      delta: pose.at.map((value, axis) => value - snapshot.min[axis]),
      turn: pose.turn,
    };
  }
  read(workspaceId) {
    return this.recipe?.workspaceId === workspaceId ? structuredClone(this.recipe) : null;
  }
  clearFor(workspaceId) {
    if (this.recipe?.workspaceId !== workspaceId) this.recipe = null;
  }
  pose(recipe, size) {
    const extent = recipe.turn % 2 ? [size[2], size[1], size[0]] : [...size];
    return {
      extent,
      offset: recipe.delta.map((value, axis) => value + (extent[axis] - size[axis]) / 2),
      angle: (-recipe.turn * Math.PI) / 2,
    };
  }
}
