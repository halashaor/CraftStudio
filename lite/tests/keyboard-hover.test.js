import test from 'node:test';
import assert from 'node:assert/strict';
import { KeyboardMotion } from '../src/view/keyboard-motion.js';
import { HoverFeedback } from '../src/selection/hover-feedback.js';
import * as THREE from '../../web/vendor/three.module.js';
test('WASDQE movement eases in, normalizes diagonals, accelerates with Shift and stops without stuck velocity', () => {
  // Integrate each frame once; independent axes share the same speed budget.
  const travel = (keys) => {
    const motion = new KeyboardMotion(),
      position = [0, 0, 0];
    for (let i = 0; i < 60; i++) {
      const step = motion.step(1 / 60, new Set(keys), [0, 0, -1], [1, 0, 0]);
      step.forEach((n, a) => (position[a] += n));
    }
    return { motion, position };
  };
  const forward = travel(['KeyW']),
    diagonal = travel(['KeyW', 'KeyD']),
    fast = travel(['KeyW', 'ShiftLeft']),
    up = travel(['KeyE']);
  assert.ok(forward.position[2] < -10);
  assert.ok(Math.abs(Math.hypot(...diagonal.position) - Math.hypot(...forward.position)) < 1e-8);
  assert.ok(Math.abs(fast.position[2] / forward.position[2] - 3) < 1e-8);
  assert.ok(up.position[1] > 10);
  for (let i = 0; i < 100; i++) forward.motion.step(1 / 60, new Set(), [0, 0, -1], [1, 0, 0]);
  assert.equal(forward.motion.moving, false);
  up.motion.reset();
  assert.equal(up.motion.moving, false);
});
test('hover feedback fades in, distinguishes selected targets and clears without retaining invisible animation', () => {
  const scene = new THREE.Scene(),
    feedback = new HoverFeedback(scene);
  feedback.show({ min: [2, 3, 4], max: [2, 3, 4], selected: false });
  for (let i = 0; i < 30; i++) feedback.tick(1 / 60, i * 16);
  assert.equal(feedback.group.visible, true);
  const ordinary = feedback.fill.material.color.getHex();
  feedback.show({ min: [2, 3, 4], max: [2, 3, 4], selected: true });
  feedback.tick(1 / 60, 500);
  assert.notEqual(feedback.fill.material.color.getHex(), ordinary);
  feedback.show(null);
  for (let i = 0; i < 50; i++) feedback.tick(1 / 60, 500 + i * 16);
  assert.equal(feedback.group.visible, false);
  assert.equal(feedback.tick(1 / 60, 1500), false);
});
