import prisma from '@/lib/db';
import systems from '@/data/knauf-systems.json';
import { calculateQuotation } from '@/lib/engine/calculator';
import type { KnaufSystemDefinition, QuoteMetaData } from '@/lib/engine/types';
export async function loadExport(id:string){
 const quote=await prisma.quotation.findUnique({where:{id},include:{system:true,items:{orderBy:{sortOrder:'asc'}}}});
 if(!quote)throw new Error('Quotation not found.');
 const system=(systems as KnaufSystemDefinition[]).find(s=>s.code===quote.system.code);if(!system)throw new Error('Unknown system.');
 const items=quote.items.map(item=>({...item,factorOverridden:quote.calculationVersion==='legacy'?true:item.factorOverridden}));
 const calculation=calculateQuotation(system,quote.scaleM2,{},quote.includeDeflection,{base:items.filter(i=>!i.isHeadDeflection),deflection:items.filter(i=>i.isHeadDeflection)},JSON.parse(quote.technicalParameters));
 if([...calculation.baseItems,...calculation.deflectionItems].some(item=>item.totalQuantity>0&&item.unitPriceAed<=0))throw new Error('Enter a rate for every material before exporting.');
 const meta:QuoteMetaData={quoteNumber:quote.quoteNumber,projectName:quote.projectName,clientName:quote.clientName,salesman:quote.salesman,date:new Date(quote.createdAt).toLocaleDateString('en-GB')};
 return{meta,system,calculation};
}
