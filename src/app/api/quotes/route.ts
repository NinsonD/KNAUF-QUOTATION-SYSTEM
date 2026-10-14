import { requireApiUser } from '@/lib/auth/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { canCreateQuote, canEditQuoteItems } from '@/lib/auth/permissions';
import { AL_NAMARIQ_TERMS } from '@/lib/exporters/excel-generator';
import { calculationInput, buildCalculation, itemSchema, requirePricedForIssue, statuses } from '@/lib/engine/validation';
import { getQuotationPrices } from '@/lib/engine/prices';
export async function GET(req: NextRequest) {
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
 try {
  const {searchParams}=new URL(req.url);const search=searchParams.get('search')||'';const status=searchParams.get('status');
  const quotes=await prisma.quotation.findMany({where:{AND:[search?{OR:[{quoteNumber:{contains:search}},{projectName:{contains:search}},{clientName:{contains:search}},{salesman:{contains:search}}]}:{},status?{status}:{}]},include:{system:true,items:{orderBy:{sortOrder:'asc'}}},orderBy:{createdAt:'desc'}});
  return NextResponse.json(quotes);
 }catch{return NextResponse.json({error:'Could not load quotations.'},{status:503});}
}
const requestSchema=calculationInput.extend({quoteNumber:z.string().trim().min(1).max(100),projectName:z.string().trim().min(1).max(300),clientName:z.string().trim().min(1).max(300),salesman:z.string().trim().max(150).optional(),status:z.enum(statuses).default('DRAFT'),termsAndConditions:z.array(z.string()).max(30).optional(),calculation:z.object({baseItems:z.array(itemSchema).max(300),deflectionItems:z.array(itemSchema).max(100)}).optional()});
export async function POST(req: NextRequest) {
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
 try {
  const user=access;if(!user||!canCreateQuote(user.role))return NextResponse.json({error:'Log in with an account allowed to create quotations.'},{status:403});
  const body=requestSchema.parse(await req.json());
  const {calculation}=buildCalculation({...body,customItems:body.calculation?{base:body.calculation.baseItems,deflection:body.calculation.deflectionItems}:body.customItems},{...await getQuotationPrices(),...Object.fromEntries([...(body.calculation?.baseItems??[]),...(body.calculation?.deflectionItems??[])].map(item=>[item.productName,item.unitPriceAed]))},canEditQuoteItems(user.role));
  const items=[...calculation.baseItems,...calculation.deflectionItems];requirePricedForIssue(body.status,items);
  const system=await prisma.knaufSystem.findUnique({where:{code:body.systemCode}});if(!system)return NextResponse.json({error:'Catalog is not initialized.'},{status:503});
  const quote=await prisma.quotation.create({data:{quoteNumber:body.quoteNumber,projectName:body.projectName,clientName:body.clientName,salesman:body.salesman||user.name,userId:user.id,systemId:system.id,includeDeflection:body.includeDeflection,technicalParameters:JSON.stringify(body.technicalParameters),calculationVersion:'workbook-v1',scaleM2:body.scaleM2,baseTotalAed:calculation.baseTotalAed,baseRatePerM2:calculation.baseRatePerM2,deflectionTotalAed:calculation.deflectionTotalAed,deflectionRatePerM2:calculation.deflectionRatePerM2,grandTotalAed:calculation.grandTotalAed,grandRatePerM2:calculation.grandRatePerM2,status:body.status,termsAndConditions:JSON.stringify(body.termsAndConditions||AL_NAMARIQ_TERMS),items:{create:items.map((item,sortOrder)=>({...item,id:undefined,sortOrder,factorOverridden:Boolean(item.factorOverridden)}))}},include:{system:true,items:{orderBy:{sortOrder:'asc'}}}});
  return NextResponse.json(quote,{status:201});
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?'Check quotation fields, area, dimensions and rates.':error instanceof Error&&error.message.includes('rate for every')?error.message:'Could not save quotation. Check the reference is unique and the database is available.'},{status:400});}
}
