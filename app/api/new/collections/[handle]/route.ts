import {NextRequest,NextResponse} from 'next/server';
import {getV2Collection,putV2Collection,deleteV2Collection,type V2Collection} from '@/lib/v2/collections';
import {writeEnabled} from '@/lib/v2/db';
import {removeCollectionReferences} from '@/lib/v2/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Params={params:Promise<{handle:string}>};
export async function GET(_req:NextRequest,{params}:Params){try{const {handle}=await params;const collection=await getV2Collection(handle);return collection?NextResponse.json({collection}):NextResponse.json({error:'Not found'},{status:404})}catch(e){return NextResponse.json({error:String(e)},{status:500})}}
export async function PUT(req:NextRequest,{params}:Params){if(!writeEnabled())return NextResponse.json({error:'Local V2 only'},{status:403});try{const {handle}=await params;const existing=await getV2Collection(handle);if(!existing)return NextResponse.json({error:'Not found'},{status:404});const collection=await putV2Collection(await req.json() as V2Collection,handle);return NextResponse.json({collection})}catch(e){return NextResponse.json({error:String(e)},{status:400})}}
export async function DELETE(_req:NextRequest,{params}:Params){if(!writeEnabled())return NextResponse.json({error:'Local V2 only'},{status:403});try{const {handle}=await params;await deleteV2Collection(handle);await removeCollectionReferences(handle);return NextResponse.json({ok:true})}catch(e){return NextResponse.json({error:String(e)},{status:400})}}
