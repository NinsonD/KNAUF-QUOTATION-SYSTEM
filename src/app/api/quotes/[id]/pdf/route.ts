import { requireApiUser } from '@/lib/auth/security';
import { NextRequest, NextResponse } from 'next/server';
import { loadExport } from '@/lib/exporters/load-quote';
import { generateAlNamariqPDF } from '@/lib/exporters/pdf-generator';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
 try{const {id}=await params;const {meta,system,calculation}=await loadExport(id);const data=await generateAlNamariqPDF(meta,system,calculation);const name=meta.quoteNumber.replace(/[^a-zA-Z0-9_-]/g,'_');return new NextResponse(Buffer.from(data),{headers:{'Content-Type':'application/pdf','Content-Disposition':`${new URL(req.url).searchParams.get('download')==='true'?'attachment':'inline'}; filename="${name}.pdf"`,'Cache-Control':'no-store'}});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Export failed.'},{status:400});}
}
