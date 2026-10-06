import {createEngineService} from './service.mjs';
const database=process.argv[2],token=process.env.CRAFTSTUDIO_ENGINE_TOKEN;
if(!database)throw Error('An explicit engine database path is required');
const service=await createEngineService({database,token});
console.log(JSON.stringify({protocol:'craftstudio-engine-process/1',url:service.url}));
let closing=false;const close=async()=>{if(closing)return;closing=true;await service.close();process.exit(0);};
process.on('SIGTERM',close);process.on('SIGINT',close);
