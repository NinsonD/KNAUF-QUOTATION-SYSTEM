import aliases from '@/data/reference/price-aliases.json';
import defaults from '@/data/default-prices.json';
import prisma from '@/lib/db';
export async function getQuotationPrices(): Promise<Record<string, number>> {
  const rows = await prisma.masterProductPrice.findMany();
  const prices: Record<string, number> = { ...defaults };
  for (const row of rows) prices[row.productName] = row.defaultPriceAed;
  for (const [name, original] of Object.entries(aliases)) {
    if (!rows.some(row => row.productName === name) && prices[original] !== undefined) prices[name] = prices[original];
  }
  return prices;
}
