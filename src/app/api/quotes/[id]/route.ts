import { requireApiUser } from '@/lib/auth/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { canEditQuoteMeta, canEditQuoteItems, canDeleteQuote } from '@/lib/auth/permissions';
import { calculateQuotation } from '@/lib/engine/calculator';
import { getQuotationPrices } from '@/lib/engine/prices';
import { itemSchema, parametersSchema, requirePricedForIssue, statuses } from '@/lib/engine/validation';
import systems from '@/data/knauf-systems.json';
import type { KnaufSystemDefinition } from '@/lib/engine/types';
type Context={params:Promise<{id:string}>};
const schema=z.object({scaleM2:z.number().finite().positive().optional(),includeDeflection:z.boolean().optional(),status:z.enum(statuses).optional(),technicalParameters:parametersSchema.optional(),rebuildFromReference:z.boolean().optional(),calculation:z.object({baseItems:z.array(itemSchema).max(300),deflectionItems:z.array(itemSchema).max(100)}).optional()});
export async function GET(_req:NextRequest,{params}:Context){
 const access = await requireApiUser(_req); if (access instanceof NextResponse) return access;
 try{const {id}=await params;const quote=await prisma.quotation.findUnique({where:{id},include:{system:true,items:{orderBy:{sortOrder:'asc'}}}});return quote?NextResponse.json(quote):NextResponse.json({error:'Quotation not found.'},{status:404});}catch{return NextResponse.json({error:'Could not load quotation.'},{status:503});}
}
export async function PUT(req:NextRequest,{params}:Context){
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
 try{
  const user=access;if(!user||!canEditQuoteMeta(user.role))return NextResponse.json({error:'You cannot edit this quotation.'},{status:403});
  const body=schema.parse(await req.json());const itemEdit=body.calculation||body.scaleM2!==undefined||body.includeDeflection!==undefined||body.technicalParameters||body.rebuildFromReference;
  if(itemEdit&&!canEditQuoteItems(user.role))return NextResponse.json({error:'Only administrators and estimators can edit quantities and rates.'},{status:403});
  const {id}=await params;const existing=await prisma.quotation.findUnique({where:{id},include:{system:true,items:true}});if(!existing)return NextResponse.json({error:'Quotation not found.'},{status:404});
  const system=(systems as KnaufSystemDefinition[]).find(system=>system.code===existing.system.code);if(!system)throw new Error('Unknown system.');
  const scale=body.scaleM2??existing.scaleM2;const include=body.includeDeflection??existing.includeDeflection;const parameters=body.technicalParameters??JSON.parse(existing.technicalParameters);
  const snapshot=body.calculation??{baseItems:existing.items.filter(item=>!item.isHeadDeflection),deflectionItems:existing.items.filter(item=>item.isHeadDeflection)};
  const base=snapshot.baseItems.map(item=>({...item,totalQuantity:0,totalPriceAed:0,isHeadDeflection:false,factorOverridden:existing.calculationVersion==='legacy'&&!body.rebuildFromReference?true:item.factorOverridden??false}));
  const head=snapshot.deflectionItems.map(item=>({...item,totalQuantity:0,totalPriceAed:0,isHeadDeflection:true,factorOverridden:existing.calculationVersion==='legacy'&&!body.rebuildFromReference?true:item.factorOverridden??false}));
  const prices=await getQuotationPrices(); for (const item of existing.items) prices[item.productName]=item.unitPriceAed;
  const calc=calculateQuotation(system,scale,prices,include,body.rebuildFromReference?undefined:{base,deflection:head},parameters);
  const items=[...calc.baseItems,...calc.deflectionItems];requirePricedForIssue(body.status??existing.status,items);
  const updated=await prisma.$transaction(async tx=>{
   if(itemEdit)await tx.quotationItem.deleteMany({where:{quotationId:id}});
   return tx.quotation.update({where:{id},data:{status:body.status??existing.status,...(itemEdit?{scaleM2:scale,includeDeflection:include,technicalParameters:JSON.stringify(parameters),calculationVersion:body.rebuildFromReference?'workbook-v1':existing.calculationVersion,baseTotalAed:calc.baseTotalAed,baseRatePerM2:calc.baseRatePerM2,deflectionTotalAed:calc.deflectionTotalAed,deflectionRatePerM2:calc.deflectionRatePerM2,grandTotalAed:calc.grandTotalAed,grandRatePerM2:calc.grandRatePerM2,items:{create:items.map((item,sortOrder)=>({productName:item.productName,factorPerM2:item.factorPerM2,factorOverridden:Boolean(item.factorOverridden),unit:item.unit,totalQuantity:item.totalQuantity,unitPriceAed:item.unitPriceAed,totalPriceAed:item.totalPriceAed,isHeadDeflection:item.isHeadDeflection,sortOrder}))}}:{})},include:{system:true,items:{orderBy:{sortOrder:'asc'}}}});
  });return NextResponse.json(updated);
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?'Check area, technical dimensions and rates.':error instanceof Error&&error.message.includes('rate for every')?error.message:'Could not update quotation. No changes were saved.'},{status:400});}
}
export async function DELETE(_req:NextRequest,{params}:Context){
 const access = await requireApiUser(_req); if (access instanceof NextResponse) return access;
 const user=access;if(!user||!canDeleteQuote(user.role))return NextResponse.json({error:'Only administrators can delete quotations.'},{status:403});
 try{const {id}=await params;await prisma.quotation.delete({where:{id}});return NextResponse.json({success:true});}catch{return NextResponse.json({error:'Could not delete quotation.'},{status:400});}
}
