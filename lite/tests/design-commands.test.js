import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesignCommands } from '../src/ui/design-commands.js';
import { searchCommands } from '../src/ui/command-search.js';

function setup() {
  const state = { selected: false, named: false, busy: false, guides: [] },
    actions = [];
  const fields = new Map();
  const $ = (id) => {
    if (!fields.has(id))
      fields.set(id, {
        value: '',
        disabled: false,
        click: () => actions.push(id),
        focus: () => actions.push(id + '.focus'),
      });
    return fields.get(id);
  };
  $('designer-operation').options = [
    { value: 'array', textContent: '线性阵列' },
    { value: 'offset', textContent: '偏移轮廓' },
  ];
  const busyReason = () => (state.busy ? '等待提交' : '');
  const commands = createDesignCommands({
    $,
    workspace: { selectCategory: (key) => actions.push(key) },
    chooseTool: (key) => actions.push(key),
    dock: (key) => actions.push(key),
    direct: { hasClipboard: () => false },
    construction: { open: (...args) => actions.push(args) },
    designer: { open: (key) => actions.push(key) },
    measurement: { open: () => actions.push('measure') },
    objectNames: { begin: () => actions.push('rename'), beginBatch: () => actions.push('batch') },
    viewPresets: { open: () => actions.push('views') },
    operations: { busyReason },
    hasOperation: () => false,
    getSummary: () => ({ design: { guides: state.guides } }),
    hasNamedSelection: () => state.named,
    repeatTransform: () => actions.push('repeat'),
    repeatReason: busyReason,
    busyReason,
    selectionReason: () => busyReason() || (state.selected ? '' : '请选择范围'),
    zoomSelection: () => actions.push('frame'),
    openDelivery: () => actions.push('delivery'),
  });
  return { state, actions, commands, get: (id) => commands.find((command) => command.id === id) };
}

test('functional command catalogue retains discovery and live selection/submission context', () => {
  const { state, commands, get } = setup();
  assert.equal(new Set(commands.map((command) => command.id)).size, commands.length);
  assert.equal(searchCommands(commands, '平滑路径')[0].id, 'figure-spline');
  assert.equal(searchCommands(commands, '薄梁')[0].id, 'precise-rectangle');
  assert.equal(searchCommands(commands, '施工交付')[0].id, 'delivery');
  assert.ok(get('move').unavailable());
  state.selected = true;
  assert.equal(get('move').unavailable(), '');
  assert.ok(get('object-rename').unavailable());
  state.named = true;
  assert.equal(get('object-rename').unavailable(), '');
  state.busy = true;
  assert.equal(get('move').unavailable(), '等待提交');
  assert.equal(get('figure-spline').unavailable(), '等待提交');
  assert.equal(get('materials').unavailable(), '');
});

test('modeling eligibility observes saved geometry rather than a startup snapshot', () => {
  const { state, get, actions } = setup();
  assert.ok(get('feature-extrude').unavailable());
  const guide = {
    id: 'outline',
    points: [
      [2, 5, 2],
      [8, 5, 2],
      [8, 5, 8],
      [2, 5, 8],
    ],
    recipe: { kind: 'polygon' },
  };
  state.guides = [guide];
  assert.equal(get('feature-extrude').unavailable(), '');
  assert.ok(get('feature-loft').unavailable());
  state.guides = [
    guide,
    { ...guide, id: 'second', points: guide.points.map(([x, y, z]) => [x, y + 4, z]) },
  ];
  assert.equal(get('feature-loft').unavailable(), '');
  get('move').run();
  get('delivery').run();
  assert.deepEqual(actions, ['edit', 'cad-move-direct', 'delivery', 'delivery-kind.focus']);
});
