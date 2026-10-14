import { z } from 'zod';
import type { CalculatedItem, QuoteMetaData } from '@/lib/engine/types';

const numbers = z.record(z.string(), z.number().finite());
const item = z.object({ productName: z.string(), unit: z.string(), factorPerM2: z.number().finite(), totalQuantity: z.number().finite(), unitPriceAed: z.number().finite(), totalPriceAed: z.number().finite(), isHeadDeflection: z.boolean(), factorOverridden: z.boolean().optional() });
const draftSchema = z.object({
  version: z.literal(1), systemCode: z.string(), scale: z.number().finite(), includeDeflection: z.boolean(),
  prices: numbers, technicalParameters: numbers,
  customItems: z.object({ base: z.array(item).optional(), deflection: z.array(item).optional() }),
  meta: z.object({ quoteNumber: z.string(), projectName: z.string(), clientName: z.string(), salesman: z.string(), date: z.string(), status: z.enum(['DRAFT', 'ISSUED', 'APPROVED', 'REVISED', 'CANCELLED']).optional() }),
});

export function parseBrowserDraft(raw: string) {
  return draftSchema.parse(JSON.parse(raw));
}

export function browserDraftKey(userId: string, duplicateId?: string | null) {
  return `knauf-quotation-draft:v1:${encodeURIComponent(userId)}${duplicateId ? ':copy:' + encodeURIComponent(duplicateId) : ''}`;
}

export function duplicateQuotation(source: { calculationVersion: string; clientName: string; projectName: string; salesman: string; items: CalculatedItem[] }, freshMeta: QuoteMetaData) {
  if (source.calculationVersion === 'legacy') throw new Error('Rebuild the original using the workbook model before duplicating it.');
  const copyItem = (value: CalculatedItem) => item.parse(value);
  return {
    meta: { ...freshMeta, clientName: source.clientName, projectName: source.projectName, salesman: source.salesman, status: 'DRAFT' as const },
    customItems: { base: source.items.filter(value => !value.isHeadDeflection).map(copyItem), deflection: source.items.filter(value => value.isHeadDeflection).map(copyItem) },
  };
}
