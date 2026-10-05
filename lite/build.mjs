import {build} from 'esbuild';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readReferenceHTML,referenceAssets} from './src/reference.js';
const root=dirname(fileURLToPath(import.meta.url));
const optional=async name=>process.env[name]?await readFile(process.env[name]):Buffer.alloc(0);
const source=await optional('LITE_SOURCE_NBT'),example=await optional('LITE_EXAMPLE_CRAFTLITE'),trials={};
for(const[key,variable]of [['rebuild','LITE_TRIAL_REBUILD'],['redesign','LITE_TRIAL_REDESIGN']])if(process.env[variable])trials[key]=(await optional(variable)).toString('base64');
let reference={html:'',assets:{}};
if(process.env.LITE_REFERENCE_HTML){const ref=readReferenceHTML(await readFile(process.env.LITE_REFERENCE_HTML,'utf8'));reference={html:'<script id="scene" type="application/json">'+JSON.stringify(ref.scene)+'</script>'+(ref.atlas?'<img src="'+ref.atlas+'">':''),assets:referenceAssets(ref)};}
const worker=await build({entryPoints:[resolve(root,'src/worker.js')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});
const app=await build({entryPoints:[resolve(root,'src/app.js')],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true,alias:{three:resolve(root,'../web/vendor/three.module.js')},define:{__TRIALS__:JSON.stringify(trials),__EXAMPLE__:JSON.stringify(example.toString('base64')),__WORKER__:JSON.stringify(worker.outputFiles[0].text),__SOURCE__:JSON.stringify(source.toString('base64')),__REFERENCE__:JSON.stringify(reference)}});
const template=await readFile(resolve(root,'src/template.html'),'utf8'),style=await readFile(resolve(root,'src/style.css'),'utf8'),licenses=await readFile(resolve(root,'THIRD-PARTY.txt'),'utf8'),id=createHash('sha256').update(app.outputFiles[0].text).update(template).update(style).digest('hex').slice(0,16);
const result=template.replace('<head>','<head><meta name="craftstudio-build" content="'+id+'">').replace('__STYLE__',()=>style).replace('__APP__',()=>app.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'))+'\n<!-- '+licenses.replaceAll('--','—')+' -->';
await mkdir(resolve(root,'dist'),{recursive:true});await writeFile(resolve(root,'dist/CraftStudio-Lite.html'),result);await writeFile(resolve(root,'dist/worker.bundle.js'),worker.outputFiles[0].text);
for(const name of ['lite.html','index.html'])await copyFile(resolve(root,'dist/CraftStudio-Lite.html'),resolve(root,'../web',name));
console.log('Built shared designer '+id+': '+Buffer.byteLength(result)+' bytes; both local entries and Lite match.');
