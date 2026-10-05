import { build } from 'esbuild';
import { readFile,writeFile,mkdir,copyFile } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readReferenceHTML,referenceAssets } from './src/reference.js';
const root=dirname(fileURLToPath(import.meta.url));
const source=process.env.LITE_SOURCE_NBT?await readFile(process.env.LITE_SOURCE_NBT):Buffer.alloc(0);
let reference={html:'',assets:{}};
if(process.env.LITE_REFERENCE_HTML){const ref=readReferenceHTML(await readFile(process.env.LITE_REFERENCE_HTML,'utf8'));reference={html:'<script id="scene" type="application/json">'+JSON.stringify(ref.scene)+'</script>'+(ref.atlas?'<img src="'+ref.atlas+'">':''),assets:referenceAssets(ref)};}
const worker=await build({entryPoints:[resolve(root,'src/worker.js')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});
const app=await build({entryPoints:[resolve(root,'src/app.js')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,alias:{three:resolve(root,'../web/vendor/three.module.js')},define:{__TRIALS__:JSON.stringify({}),__EXAMPLE__:JSON.stringify(''),__WORKER__:JSON.stringify(worker.outputFiles[0].text),__SOURCE__:JSON.stringify(source.toString('base64')),__REFERENCE__:JSON.stringify(reference)}});
const template=await readFile(resolve(root,'src/template.html'),'utf8'),style=await readFile(resolve(root,'src/style.css'),'utf8');
const licenses=await readFile(resolve(root,'THIRD-PARTY.txt'),'utf8');
const result=template.replace('__STYLE__',()=>style).replace('__APP__',()=>app.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'))+'\n<!-- '+licenses.replaceAll('--','—')+' -->';
await mkdir(resolve(root,'dist'),{recursive:true});await writeFile(resolve(root,'dist/CraftStudio-Lite.html'),result);await writeFile(resolve(root,'dist/worker.bundle.js'),worker.outputFiles[0].text);await copyFile(resolve(root,'dist/CraftStudio-Lite.html'),resolve(root,'../web/lite.html'));
console.log('Built standalone HTML without personal fixtures:',Buffer.byteLength(result),'bytes');
