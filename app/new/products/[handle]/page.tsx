import { getProduct } from '@/lib/v2/store';
import { notFound } from 'next/navigation';
import V2ProductPageClient from './V2ProductPageClient';
import type { Product as ExistingProduct } from '@/types/product';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default async function Page({params}:{params:Promise<{handle:string}>}) {
  const {handle} = await params;
  const p = await getProduct(handle);
  if (!p) notFound();
  const adapted = {
    handle:p.handle, title:p.title, collection:p.collectionHandle,
    collectionHandle:p.collectionHandle, category:p.productType,
    images:p.images.map(i=>i.src).filter(Boolean),
    variants:(p.variants.length ? p.variants : [{title:p.title,partNumber:p.handle}]).map(v=>({
      title:String(v.title || v.partNumber || v.sku || p.title),
      partNumber:String(v.partNumber || v.sku || ''),
      sku:String(v.sku || ''), vendor:String(v.vendor || p.vendor || ''),
      price:Number(v.price || 0), image:String(v.image || ''),
      description: String(
        v.brandDescription ||
        p.bodyHtml?.replace(/<[^>]*>/g, " ") ||
        ""
      ),
      hsCode:String(v.hsCode || ''),countryOfOrigin:String(v.countryOfOrigin || ''),
      unitWeight:String(v.unitWeight || v.weight || ''),
      shippingVolume:String(v.shippingVolume || ''),
      specifications:String(v.specification || '').split(/\n|;/).filter(Boolean),
    }))
  } as unknown as ExistingProduct;
  return <V2ProductPageClient handle={handle} initialProduct={adapted}/>;
}
