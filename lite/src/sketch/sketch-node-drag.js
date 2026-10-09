export function nearestScreenNode(nodes, { pointer, project, radius = 12 }) {
  let best = null,
    score = radius * radius;
  for (const node of nodes) {
    const p = project(node);
    if (!p || p[2] < -1 || p[2] > 1) continue;
    const distance = (p[0] - pointer[0]) ** 2 + (p[1] - pointer[1]) ** 2;
    if (distance < score) {
      best = node;
      score = distance;
    }
  }
  return best;
}
// Dragging a node uses a camera-facing plane; explicit axis/workplane constraints stay in the editor.
export class SketchNodeDrag {
  constructor({ THREE, element, getCamera, begin, move, finish, cancel, navigation }) {
    Object.assign(this, {
      THREE,
      element,
      getCamera,
      begin,
      move,
      finish,
      cancelled: cancel,
      navigation,
    });
    this.state = null;
    element.addEventListener(
      'pointermove',
      (event) => {
        if (!this.state) return;
        this.consume(event);
        const hit = this.point(event);
        if (hit) this.move(this.state.index, hit.add(this.state.offset).toArray());
      },
      true,
    );
    element.addEventListener(
      'pointerup',
      (event) => {
        if (!this.state || event.pointerId !== this.state.pointer) return;
        this.consume(event);
        const state = this.release();
        this.finish(state.index);
      },
      true,
    );
    element.addEventListener('pointercancel', () => this.cancel(), true);
  }
  consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  point(event) {
    const { THREE, element } = this,
      rect = element.getBoundingClientRect(),
      ray = new THREE.Raycaster();
    this.getCamera().updateMatrixWorld(true);
    ray.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      ),
      this.getCamera(),
    );
    return ray.ray.intersectPlane(this.state.plane, new THREE.Vector3());
  }
  start(event, node) {
    const position = node.position.clone(),
      plane = new this.THREE.Plane().setFromNormalAndCoplanarPoint(
        this.getCamera().getWorldDirection(new this.THREE.Vector3()),
        position,
      );
    this.state = {
      pointer: event.pointerId,
      index: node.userData.index,
      plane,
      offset: new this.THREE.Vector3(),
    };
    const hit = this.point(event);
    if (!hit) {
      this.state = null;
      return false;
    }
    this.state.offset.copy(position).sub(hit);
    this.consume(event);
    this.element.setPointerCapture(event.pointerId);
    this.navigation(false);
    this.begin(this.state.index);
    return true;
  }
  release() {
    const state = this.state;
    this.state = null;
    if (this.element.hasPointerCapture(state.pointer))
      this.element.releasePointerCapture(state.pointer);
    this.navigation(true);
    return state;
  }
  cancel() {
    if (!this.state) return false;
    this.release();
    this.cancelled();
    return true;
  }
}
