import { registerEditCommands } from './commands/edit-commands.js';
import { registerSketchCommands } from './commands/sketch-commands.js';
import { registerModelingCommands } from './commands/modeling-commands.js';
import { registerTerrainCommands } from './commands/terrain-commands.js';
import { registerMaterialsCommands } from './commands/materials-commands.js';
import { registerViewCommands } from './commands/view-commands.js';
import { registerFileCommands } from './commands/file-commands.js';

export function createDesignCommands(context) {
  const commands = [];
  const add = (
    id,
    label,
    category,
    run,
    aliases = '',
    unavailable = context.busyReason,
    shortcut = '',
  ) => commands.push({ id, label, category, run, aliases, unavailable, shortcut });
  const invoke = (id, category) => () => {
    if (category) context.workspace.selectCategory(category);
    context.$(id).click();
  };
  const bindings = { ...context, add, invoke };
  registerEditCommands(bindings);
  registerSketchCommands(bindings);
  registerModelingCommands(bindings);
  registerTerrainCommands(bindings);
  registerMaterialsCommands(bindings);
  registerViewCommands(bindings);
  registerFileCommands(bindings);
  return commands;
}
