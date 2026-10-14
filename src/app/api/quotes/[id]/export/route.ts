import { NextRequest, NextResponse } from 'next/server';
import { loadExport } from '@/lib/exporters/load-quote';
import { generateAlNamariqExcel } from '@/lib/exporters/excel-generator';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const {id}=await params;const {meta,system,calculation}=await loadExport(id);const logo=await readFile(join(process.cwd(),'public/logo/logo.png'));const data=await generateAlNamariqExcel(meta,system,calculation,logo);const name=meta.quoteNumber.replace(/[^a-zA-Z0-9_-]/g,'_');return new NextResponse(new Uint8Array(data),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="${name}.xlsx"`,'Cache-Control':'no-store'}});}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Export failed.'},{status:400});}
}
