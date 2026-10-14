import { requireApiUser } from '@/lib/auth/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAlNamariqPDF } from '@/lib/exporters/pdf-generator';
import { calculateQuotation } from '@/lib/engine/calculator';
import { itemSchema, parametersSchema } from '@/lib/engine/validation';
import systems from '@/data/knauf-systems.json';
import type { KnaufSystemDefinition } from '@/lib/engine/types';
const schema=z.object({meta:z.object({quoteNumber:z.string().max(100),projectName:z.string().max(300),clientName:z.string().max(300),salesman:z.string().max(150),date:z.string().max(30)}),system:z.object({code:z.string()}),calculation:z.object({scaleM2:z.number().positive(),baseItems:z.array(itemSchema),deflectionItems:z.array(itemSchema),technicalParameters:parametersSchema.optional(),includeDeflection:z.boolean().optional()}),download:z.boolean().optional()});
export async function POST(req:NextRequest){
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
 try{
  const body=schema.parse(await req.json());const system=(systems as KnaufSystemDefinition[]).find(s=>s.code===body.system.code);if(!system)return NextResponse.json({error:'Unknown system.'},{status:400});
  const toItem=(item:z.infer<typeof itemSchema>)=>({...item,totalQuantity:0,totalPriceAed:0,isHeadDeflection:Boolean(item.isHeadDeflection)});
  const calc=calculateQuotation(system,body.calculation.scaleM2,{},body.calculation.includeDeflection??body.calculation.deflectionItems.length>0,{base:body.calculation.baseItems.map(toItem),deflection:body.calculation.deflectionItems.map(toItem)},body.calculation.technicalParameters);
  if([...calc.baseItems,...calc.deflectionItems].some(i=>i.totalQuantity>0&&i.unitPriceAed<=0))return NextResponse.json({error:'Enter a rate for every material before exporting.'},{status:400});
  const pdf=await generateAlNamariqPDF(body.meta,system,calc);const name=(body.meta.quoteNumber||'Quotation').replace(/[^a-zA-Z0-9_-]/g,'_');
  return new NextResponse(Buffer.from(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`${body.download?'attachment':'inline'}; filename="${name}.pdf"`,'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Check quotation details, quantities and rates before exporting.'},{status:400});}
}
