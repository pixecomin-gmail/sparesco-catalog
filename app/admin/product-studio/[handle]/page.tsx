import Editor from '../Editor';
export const runtime = 'edge';
export default async function Page({params}:{params:Promise<{handle:string}>}) {
 const {handle}=await params;
 return <Editor handle={handle}/>;
}
