import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {Product} from './types';

export type CollectionRuleField='tag'|'vendor'|'productType'|'title';
export type CollectionRule={field:CollectionRuleField;operator:'equals'|'contains';value:string};
export type V2Collection={handle:string;title:string;description:string;imageUrl:string;type:'manual'|'automated';productHandles:string[];match:'all'|'any';rules:CollectionRule[]};
const file=path.join(process.cwd(),'.sparesco-v2-local','collections.json');
const validHandle=(h:string)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(h);
function devOnly(){if(process.env.NODE_ENV!=='development')throw Error('V2 collection storage is local-development-only');}
async function read():Promise<Record<string,V2Collection>>{devOnly();try{return JSON.parse(await fs.readFile(file,'utf8'))}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {};throw e}}
let queue:Promise<unknown>=Promise.resolve();
function serial<T>(fn:()=>Promise<T>):Promise<T>{const result=queue.then(fn,fn);queue=result.then(()=>undefined,()=>undefined);return result}
async function write(data:Record<string,V2Collection>){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(data),'utf8');await fs.rename(temp,file)}
export async function allV2Collections(){return Object.values(await read()).sort((a,b)=>a.title.localeCompare(b.title))}
export async function getV2Collection(handle:string){return (await read())[handle]||null}
export function matchesCollection(p:Product,c:V2Collection){
 if(c.type==='manual')return c.productHandles.includes(p.handle)||p.collectionHandle===c.handle||(p.collectionHandles||[]).includes(c.handle);
 if(!c.rules.length)return false;
 const checks=c.rules.map(rule=>{
  const values=rule.field==='tag'?p.tags:rule.field==='vendor'?[p.vendor]:rule.field==='productType'?[p.productType]:[p.title];
  const expected=rule.value.trim().toLowerCase();
  return !!expected&&values.some(value=>rule.operator==='equals'?value.trim().toLowerCase()===expected:value.toLowerCase().includes(expected));
 });
 return c.match==='all'?checks.every(Boolean):checks.some(Boolean);
}
export async function putV2Collection(c:V2Collection,previousHandle?:string){
 if(!validHandle(c.handle)||!c.title.trim())throw Error('Collection title and valid handle required');
 if(!['manual','automated'].includes(c.type))throw Error('Invalid collection type');
 if(c.rules.length>10)throw Error('Maximum 10 rules');
 if(c.type==='automated'&&!c.rules.length)throw Error('Automated collections need at least one rule');
 if(c.rules.some(r=>!['tag','vendor','productType','title'].includes(r.field)||!['equals','contains'].includes(r.operator)||!r.value.trim()))throw Error('Invalid collection rule');
 return serial(async()=>{const data=await read();if(previousHandle&&previousHandle!==c.handle){if(data[c.handle])throw Error('Collection handle already exists');delete data[previousHandle]}else if(!previousHandle&&data[c.handle])throw Error('Collection handle already exists');data[c.handle]=c;await write(data);return c});
}
export async function deleteV2Collection(handle:string){return serial(async()=>{const data=await read();if(!data[handle])throw Error('Collection not found');delete data[handle];await write(data)})}
