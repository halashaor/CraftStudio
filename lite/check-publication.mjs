import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const tracked=execFileSync('git',['-c','safe.directory='+root,'ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const blocked=tracked.filter(path=>/^(docs\/|output\/|lite\/reference\/|ARCHITECTURE\.md$)/i.test(path));
if(blocked.length)throw Error('Local-only material is tracked: '+blocked.join(', '));
console.log('Publication tree excludes local design, research and verification files.');
