import test from 'node:test';
import assert from 'node:assert/strict';
import { constructionOutput, previewPresentation } from '../src/modeling/preview-presentation.js';
import { sketchPhase } from '../src/sketch/placement-mode.js';

test('a computed but protected preview never invites confirmation', () => {
  const blocked = { state: 'ready', canConfirm: false };
  assert.equal(previewPresentation(blocked).id, 'blocked');
  assert.equal(sketchPhase({ previewState: 'ready', canConfirm: false }).id, 'blocked');
  assert.equal(previewPresentation({ ...blocked, canConfirm: true }).id, 'ready');
});

test('sketch status preserves pending, invalid and stale states in both output modes', () => {
  for (const guidesOnly of [true, false]) {
    for (const [previewState, expected] of [
      ['pending', 'pending'],
      ['recomputing', 'pending'],
      ['live', 'live'],
      ['invalid', 'blocked'],
      ['stale', 'stale'],
      ['expression', 'expression'],
    ]) {
      assert.equal(sketchPhase({ previewState, guidesOnly }).id, expected);
    }
  }
  assert.equal(sketchPhase({ drawing: true, previewState: 'ready' }).id, 'drawing');
});

test('saved references, confirmed blocks and in-flight commits have distinct outcomes', () => {
  const ready = { state: 'ready', canConfirm: true };
  assert.equal(previewPresentation({ ...ready, referenceOnly: true }).tone, 'source');
  assert.equal(previewPresentation(ready).tone, 'result');
  assert.equal(previewPresentation({ ...ready, committing: true }).id, 'applying');
  assert.equal(previewPresentation({ state: 'applying', canConfirm: false }).id, 'applying');
});

test('updating a guide with linked construction cannot be described as reference-only', () => {
  const state = { type: 'geometry', guidesOnly: true, counts: { place: 0, replace: 0, remove: 0 } };
  assert.equal(constructionOutput(state), 'reference');
  assert.equal(constructionOutput({ ...state, counts: { remove: 1 } }), 'blocks');
  const output = constructionOutput({ ...state, regeneration: { objects: 2 } });
  assert.equal(output, 'linked');
  assert.equal(
    sketchPhase({ guidesOnly: true, previewState: 'ready', previewOutput: output }).id,
    'blocks',
  );
  assert.match(previewPresentation({ state: 'ready', canConfirm: true, output }).label, /建筑/);
});
