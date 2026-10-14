import { z } from 'zod';
import systemsData from '@/data/knauf-systems.json';
import { calculateQuotation } from './calculator';
import type { CalculatedItem, KnaufSystemDefinition } from './types';
export const statuses = ['DRAFT','ISSUED','APPROVED','REVISED','CANCELLED'] as const;
export const itemSchema = z.object({ productName: z.string().trim().min(1).max(500), factorPerM2: z.number().finite().nonnegative(), unit: z.enum(['m²','m','pcs','kg','bags','buckets']), unitPriceAed: z.number().finite().nonnegative(), isHeadDeflection: z.boolean().optional(), factorOverridden: z.boolean().optional() });
export const parametersSchema = z.record(z.string(), z.number().finite().positive());
export const calculationInput = z.object({ systemCode: z.string(), scaleM2: z.number().finite().positive(), includeDeflection: z.boolean().default(false), technicalParameters: parametersSchema.default({}), unitPrices: z.record(z.string(),z.number().finite().nonnegative()).optional(), customItems: z.object({ base: z.array(itemSchema).max(300).optional(), deflection: z.array(itemSchema).max(100).optional() }).optional() });
export function validatedItems(items: unknown): CalculatedItem[] {
 return z.array(itemSchema).max(400).parse(items).map(item=>({...item,totalQuantity:0,totalPriceAed:0,isHeadDeflection:Boolean(item.isHeadDeflection)}));
}
export function buildCalculation(input: z.infer<typeof calculationInput>, prices: Record<string,number>, allowCustom = true) {
 const system=(systemsData as KnaufSystemDefinition[]).find(s=>s.code===input.systemCode);
 if(!system) throw new Error('Unknown Knauf system.');
 const custom=allowCustom&&input.customItems ? {base:input.customItems.base?.map(item=>({...item,totalQuantity:0,totalPriceAed:0,isHeadDeflection:false})),deflection:input.customItems.deflection?.map(item=>({...item,totalQuantity:0,totalPriceAed:0,isHeadDeflection:true}))} : undefined;
 return {system,calculation:calculateQuotation(system,input.scaleM2,{...prices,...input.unitPrices},input.includeDeflection,custom,input.technicalParameters)};
}
export function requirePricedForIssue(status: string, items: CalculatedItem[]) {
 if(status!=='DRAFT' && items.some(item=>item.totalQuantity>0&&item.unitPriceAed<=0)) throw new Error('Enter a rate for every material before issuing this quotation.');
}
