import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),names=['dist/CraftStudio-Lite.html','../web/lite.html','../web/index.html'],data=await Promise.all(names.map(n=>readFile(resolve(root,n))));
if(data.some(b=>!b.equals(data[0])))throw Error('本地入口与 Lite 构建不一致，请先运行 npm run build');
if(!data[0].toString().includes('name="craftstudio-build"'))throw Error('构建缺少版本标记');
console.log('Shared local / Lite artifacts match byte for byte.');
