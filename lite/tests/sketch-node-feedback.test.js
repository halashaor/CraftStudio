import test from 'node:test';
import assert from 'node:assert/strict';
import { SketchNodeFeedback } from '../src/sketch/sketch-node-feedback.js';
import { nearestScreenNode } from '../src/sketch/sketch-node-drag.js';

test('node hover uses the direct-drag hit range and immediately changes into grabbing without changing geometry', () => {
  const element = { style: { cursor: 'crosshair' } },
    node = { geometry: {}, position: [0, 0, 0] },
    geometry = node.geometry;
  let changes = 0;
  const feedback = new SketchNodeFeedback({ element, changed: () => changes++ }),
    hit = (pointer) => nearestScreenNode([node], { pointer, project: () => [100, 100, 0] });
  feedback.show(hit([111, 100]));
  assert.equal(element.style.cursor, 'grab');
  assert.equal(feedback.appearance(node, false, true).state, 'hover');
  assert.notEqual(
    feedback.appearance(node, false, true).color,
    feedback.appearance(node, true, true).color,
  );
  feedback.show(hit([109, 100]));
  assert.equal(changes, 1, 'moving inside one hit target does not request redundant redraws');
  feedback.show(node, true);
  assert.equal(element.style.cursor, 'grabbing');
  assert.equal(feedback.appearance(node, true, true).state, 'dragging');
  assert.equal(node.geometry, geometry);
  assert.deepEqual(node.position, [0, 0, 0]);
  feedback.clear();
  assert.equal(element.style.cursor, 'crosshair');
  assert.equal(feedback.node, null);
  feedback.show(hit([113, 100]));
  assert.equal(feedback.node, null);
});

test('hover cleanup preserves another tool cursor and retains distinct selected feedback', () => {
  const element = { style: { cursor: 'default' } },
    node = {},
    other = {},
    feedback = new SketchNodeFeedback({ element, changed() {} });
  const selected = feedback.appearance(node, true, true);
  feedback.show(node);
  const selectedHover = feedback.appearance(node, true, true);
  assert.equal(selectedHover.color, selected.color);
  assert.ok(selectedHover.size > selected.size);
  assert.equal(selectedHover.state, 'selected-hover');
  feedback.show(other);
  assert.equal(feedback.appearance(node, true, true).state, 'selected');
  element.style.cursor = 'crosshair';
  assert.equal(feedback.ownsCursor, false);
  feedback.clear();
  assert.equal(element.style.cursor, 'crosshair');
  feedback.clear();
  assert.equal(element.style.cursor, 'crosshair');
});
