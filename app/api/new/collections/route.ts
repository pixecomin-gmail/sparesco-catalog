import {NextRequest,NextResponse} from 'next/server';
import {allV2Collections,putV2Collection,type V2Collection} from '@/lib/v2/collections';
import {allProducts} from '@/lib/v2/store';
import {matchesCollection} from '@/lib/v2/collections';
import {writeEnabled} from '@/lib/v2/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{const collections=await allV2Collections();const products=await allProducts();return NextResponse.json({collections:collections.map(c=>({...c,productCount:products.filter(p=>matchesCollection(p,c)).length}))},{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({error:String(e)},{status:500})}}
export async function POST(req:NextRequest){if(!writeEnabled())return NextResponse.json({error:'Local V2 only'},{status:403});try{const c=await req.json() as V2Collection;const saved=await putV2Collection(c);return NextResponse.json({collection:saved})}catch(e){return NextResponse.json({error:String(e)},{status:400})}}
