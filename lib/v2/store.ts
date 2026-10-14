import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {Product} from './types';
import {getV2Collection,matchesCollection,allV2Collections} from './collections';
const filename=path.join(process.cwd(),'.sparesco-v2-local','products.json');
const isDev=()=>process.env.NODE_ENV==='development';
function ensureLocal(){if(!isDev())throw Error('V2 is local-development-only. Production writes and reads are disabled until a separate D1 adapter and authentication are tested.');}
async function read():Promise<Record<string,Product>>{ensureLocal();try{return JSON.parse(await fs.readFile(filename,'utf8'))}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {};throw e}}
let queue:Promise<unknown>=Promise.resolve();
function serial<T>(fn:()=>Promise<T>):Promise<T>{const next=queue.then(fn,fn);queue=next.then(()=>undefined,()=>undefined);return next;}
async function write(data:Record<string,Product>){await fs.mkdir(path.dirname(filename),{recursive:true});const tmp=filename+'.tmp';await fs.writeFile(tmp,JSON.stringify(data),'utf8');await fs.rename(tmp,filename)}
export async function getProduct(handle:string){return (await read())[handle]||null}
export async function listProducts(q='',collection='',limit=100,offset=0){const s=q.toLowerCase();const c=collection?await getV2Collection(collection):null;return Object.values(await read()).filter(p=>(!collection||(c?matchesCollection(p,c):p.collectionHandle===collection||(p.collectionHandles||[]).includes(collection)))&&(!s||[p.handle,p.title,p.vendor,p.productType,...p.variants.map(v=>v.sku||''),...p.variants.map(v=>v.partNumber||'')].join(' ').toLowerCase().includes(s))).sort((a,b)=>a.handle.localeCompare(b.handle)).slice(Math.max(0,offset),Math.max(0,offset)+Math.min(1000,Math.max(1,limit)))}
export async function allProducts(){return Object.values(await read())}
export async function listCollections(){return [...new Set([...(await allV2Collections()).map(c=>c.handle),...(await allProducts()).flatMap(p=>[p.collectionHandle,...(p.collectionHandles||[])]).filter(Boolean)])].sort()}
export async function upsertProduct(p:Product,previousHandle?:string){return serial(async()=>{const data=await read();if(previousHandle&&previousHandle!==p.handle){if(data[p.handle])throw Error('New handle already exists');delete data[previousHandle]}data[p.handle]=p;await write(data)})}
export async function bulkUpsert(products:Product[]){return serial(async()=>{const data=await read();for(const p of products)data[p.handle]=p;await write(data);return products.length})}
export async function removeProduct(handle:string){return serial(async()=>{const data=await read();delete data[handle];await write(data)})}
export async function removeCollectionReferences(handle:string){return serial(async()=>{const data=await read();let changed=false;for(const p of Object.values(data)){if(p.collectionHandle===handle){p.collectionHandle='uncategorized';changed=true}if((p.collectionHandles||[]).includes(handle)){p.collectionHandles=(p.collectionHandles||[]).filter(h=>h!==handle);changed=true}}if(changed)await write(data)})}
