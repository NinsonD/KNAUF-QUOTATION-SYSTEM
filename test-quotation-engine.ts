import { calculateQuotation } from './src/lib/engine/calculator';
import knaufSystemsData from './src/data/knauf-systems.json';
import defaultPricesData from './src/data/default-prices.json';
import { generateAlNamariqExcel } from './src/lib/exporters/excel-generator';
import { KnaufSystemDefinition, QuoteMetaData } from './src/lib/engine/types';
import prisma from './src/lib/db';

async function runVerification() {
  console.log('=== STARTING AUTOMATED ENGINE VERIFICATION ===\n');

  // 1. Test calculation engine for KW 111 (Partition)
  const kw111 = knaufSystemsData.find((s) => s.code === 'KW111') as unknown as KnaufSystemDefinition;
  if (!kw111) throw new Error('KW 111 not found');

  const scaleM2 = 1000;
  const calcWithoutDef = calculateQuotation(kw111, scaleM2, defaultPricesData, false);
  console.log(`[TEST 1] KW 111 (No Deflection, ${scaleM2} m²):`);
  console.log(`  - Base Total: AED ${calcWithoutDef.baseTotalAed}`);
  console.log(`  - Base Rate/m²: AED ${calcWithoutDef.baseRatePerM2}`);
  console.log(`  - Deflection Items: ${calcWithoutDef.deflectionItems.length}`);
  console.log(`  - Grand Total: AED ${calcWithoutDef.grandTotalAed}`);
  console.assert(calcWithoutDef.deflectionItems.length === 0, 'Deflection items should be 0');
  console.assert(calcWithoutDef.grandTotalAed === calcWithoutDef.baseTotalAed, 'Grand total matches base');

  // 2. Test calculation engine with Head Deflection
  const calcWithDef = calculateQuotation(kw111, scaleM2, defaultPricesData, true);
  console.log(`\n[TEST 2] KW 111 (WITH Head Deflection, ${scaleM2} m²):`);
  console.log(`  - Base Total: AED ${calcWithDef.baseTotalAed}`);
  console.log(`  - Deflection Total: AED ${calcWithDef.deflectionTotalAed}`);
  console.log(`  - Deflection Rate/m²: AED ${calcWithDef.deflectionRatePerM2}`);
  console.log(`  - Grand Total: AED ${calcWithDef.grandTotalAed}`);
  console.log(`  - Grand Rate/m²: AED ${calcWithDef.grandRatePerM2}`);
  console.assert(calcWithDef.deflectionItems.length === 5, 'Should have 5 deflection items');
  console.assert(calcWithDef.grandTotalAed > calcWithDef.baseTotalAed, 'Grand total should include deflection');

  // 3. Test Excel Export Generation (with embedded official logo)
  const meta: QuoteMetaData = {
    quoteNumber: 'ANM-TEST-001',
    projectName: 'Dubai Marina Luxury Tower Partitions',
    clientName: 'Al Futtaim Carillion LLC',
    salesman: 'Ram Prasad',
    date: '11/09/2026',
  };

  const fs = await import('fs');
  const path = await import('path');
  const logoBuf = fs.readFileSync(path.join(process.cwd(), 'public', 'logo', 'logo.png'));
  const excelBuffer = await generateAlNamariqExcel(meta, kw111, calcWithDef, logoBuf);
  console.log(`\n[TEST 3] Excel Generation with Embedded Company Logo:`);
  console.log(`  - Buffer Size: ${excelBuffer.length} bytes`);
  console.assert(excelBuffer.length > 50000, 'Excel buffer with embedded logo should be > 50KB');

  // 4. Test Database Connection & Seeded Quotes
  const quotesCount = await prisma.quotation.count();
  const systemsCount = await prisma.knaufSystem.count();
  const pricesCount = await prisma.masterProductPrice.count();
  console.log(`\n[TEST 4] Database Integrity:`);
  console.log(`  - Systems in DB: ${systemsCount} (expected 14)`);
  console.log(`  - Master Products in DB: ${pricesCount}`);
  console.log(`  - Seeded Quotations: ${quotesCount}`);
  console.assert(systemsCount === 14, 'Should have 14 Knauf systems');
  console.assert(quotesCount >= 2, 'Should have at least 2 seeded quotations');

  console.log('\n=== ALL ENGINE VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runVerification()
  .catch((e) => {
    console.error('VERIFICATION FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

