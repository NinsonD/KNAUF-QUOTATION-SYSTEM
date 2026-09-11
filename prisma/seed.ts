import { PrismaClient } from '@prisma/client';
import knaufSystemsData from '../src/data/knauf-systems.json';
import defaultPricesData from '../src/data/default-prices.json';
import { calculateQuotation } from '../src/lib/engine/calculator';
import { KnaufSystemDefinition } from '../src/lib/engine/types';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Al Namariq Users & Roles ---');
  const defaultUsers = [
    {
      email: 'admin@alnamariq.ae',
      name: 'Corporate Admin',
      role: 'ADMIN',
      password: 'Admin@1234',
      avatarUrl: '/avatars/admin.png',
    },
    {
      email: 'estimator@alnamariq.ae',
      name: 'Lora Piterson (Senior Estimator)',
      role: 'ESTIMATOR',
      password: 'Estimator@1234',
      avatarUrl: '/avatars/estimator.png',
    },
    {
      email: 'sales@alnamariq.ae',
      name: 'Ram (Commercial Sales)',
      role: 'SALES',
      password: 'Sales@1234',
      avatarUrl: '/avatars/sales.png',
    },
    {
      email: 'viewer@alnamariq.ae',
      name: 'Audit Viewer',
      role: 'VIEWER',
      password: 'Viewer@1234',
      avatarUrl: '/avatars/viewer.png',
    },
  ];

  const seededUserMap: Record<string, string> = {};

  for (const u of defaultUsers) {
    const passwordHash = hashPassword(u.password);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        avatarUrl: u.avatarUrl,
      },
    });
    seededUserMap[u.role] = user.id;
    console.log(`✓ User seeded: ${u.email} [${u.role}]`);
  }

  console.log('--- Seeding Al Namariq Master Price List ---');
  for (const [productName, price] of Object.entries(defaultPricesData)) {
    // determine unit
    let unit = 'pcs';
    const lower = productName.toLowerCase();
    if (lower.includes('board') || lower.includes('cleaneo') || lower.includes('insulation')) {
      unit = 'm²';
    } else if (lower.includes('channel') || lower.includes('angle') || lower.includes('stud') || lower.includes('track') || lower.includes('tape')) {
      unit = 'm';
    } else if (lower.includes('compound') || lower.includes('powder')) {
      unit = 'kg';
    }

    await prisma.masterProductPrice.upsert({
      where: { productName },
      update: {
        defaultPriceAed: price,
        unit,
      },
      create: {
        productName,
        defaultPriceAed: price,
        unit,
      },
    });
  }

  console.log('--- Seeding Knauf Systems & Material Requirements ---');
  for (const sys of knaufSystemsData) {
    const createdSystem = await prisma.knaufSystem.upsert({
      where: { code: sys.code },
      update: {
        name: sys.name,
        category: sys.category,
        description: sys.description,
        supportsDeflection: sys.supportsDeflection,
      },
      create: {
        code: sys.code,
        name: sys.name,
        category: sys.category,
        description: sys.description,
        supportsDeflection: sys.supportsDeflection,
      },
    });

    // Delete existing materials for system to re-seed clean
    await prisma.systemMaterial.deleteMany({
      where: { systemId: createdSystem.id },
    });

    // Base materials
    let order = 0;
    for (const mat of sys.baseMaterials) {
      await prisma.systemMaterial.create({
        data: {
          systemId: createdSystem.id,
          productName: mat.productName,
          factorPerM2: mat.factorPerM2,
          unit: mat.unit,
          isHeadDeflection: false,
          sortOrder: order++,
        },
      });
    }

    // Head deflection materials
    if (sys.supportsDeflection && sys.deflectionMaterials) {
      for (const mat of sys.deflectionMaterials) {
        await prisma.systemMaterial.create({
          data: {
            systemId: createdSystem.id,
            productName: mat.productName,
            factorPerM2: mat.factorPerM2,
            unit: mat.unit,
            isHeadDeflection: true,
            sortOrder: order++,
          },
        });
      }
    }
  }

  // Seed sample quotation
  console.log('--- Seeding Sample Quotations ---');
  const kw111 = knaufSystemsData.find((s) => s.code === 'KW111') as unknown as KnaufSystemDefinition;
  const kw111Db = await prisma.knaufSystem.findUnique({ where: { code: 'KW111' } });

  if (kw111 && kw111Db) {
    const scale = 2500;
    const calc = calculateQuotation(kw111, scale, defaultPricesData, true);

    const existingQuote = await prisma.quotation.findUnique({
      where: { quoteNumber: 'ANM-2026-001' },
    });

    if (!existingQuote) {
      const q = await prisma.quotation.create({
        data: {
          quoteNumber: 'ANM-2026-001',
          projectName: 'BUTEC - Dubai Hills Estate Luxury Villas',
          clientName: 'BUTEC Engineering Contracting LLC',
          salesman: 'Ram Prasad',
          scaleM2: scale,
          systemId: kw111Db.id,
          includeDeflection: true,
          baseTotalAed: calc.baseTotalAed,
          baseRatePerM2: calc.baseRatePerM2,
          deflectionTotalAed: calc.deflectionTotalAed,
          deflectionRatePerM2: calc.deflectionRatePerM2,
          grandTotalAed: calc.grandTotalAed,
          grandRatePerM2: calc.grandRatePerM2,
          status: 'ISSUED',
          termsAndConditions: JSON.stringify([
            '1) Above consumption is based on theoretical calculation. The material requirement is based on the standard Knauf system proposed and does not include wastage or overlaps. It is the responsibility of the customer to verify actual quantity against BOQ, final drawings and site conditions before placing orders. Al Namariq will not be liable for any variations required for the project.',
            '2) Material will be supplied as per bundle/packaging multiple in full trailer load only.',
            '3) Non standard materials leadtime is approx 3-4 weeks upon receipt of confirmed order.',
            '4) Merchandise or imported goods will take 6-8 weeks.',
            '5) Delivery schedule is a must to plan supply and initiate production.',
            '6) The technical proposal for this project will be submitted upon confirmation.',
            '7) Standard sales terms & conditions apply.'
          ]),
        },
      });

      let sort = 0;
      for (const item of [...calc.baseItems, ...calc.deflectionItems]) {
        await prisma.quotationItem.create({
          data: {
            quotationId: q.id,
            productName: item.productName,
            factorPerM2: item.factorPerM2,
            unit: item.unit,
            totalQuantity: item.totalQuantity,
            unitPriceAed: item.unitPriceAed,
            totalPriceAed: item.totalPriceAed,
            isHeadDeflection: item.isHeadDeflection,
            sortOrder: sort++,
          },
        });
      }
    }
  }

  // Seed second sample quote: Ceiling D127 Cleaneo
  const d127 = knaufSystemsData.find((s) => s.code === 'D127') as unknown as KnaufSystemDefinition;
  const d127Db = await prisma.knaufSystem.findUnique({ where: { code: 'D127' } });

  if (d127 && d127Db) {
    const scale = 1200;
    const calc = calculateQuotation(d127, scale, defaultPricesData, false);

    const existingQuote2 = await prisma.quotation.findUnique({
      where: { quoteNumber: 'ANM-2026-002' },
    });

    if (!existingQuote2) {
      const q2 = await prisma.quotation.create({
        data: {
          quoteNumber: 'ANM-2026-002',
          projectName: 'Madar Mall - Auditorium Acoustic Ceilings',
          clientName: 'Al Sahel Contracting Co.',
          salesman: 'Vishnu Nair',
          scaleM2: scale,
          systemId: d127Db.id,
          includeDeflection: false,
          baseTotalAed: calc.baseTotalAed,
          baseRatePerM2: calc.baseRatePerM2,
          deflectionTotalAed: 0,
          deflectionRatePerM2: 0,
          grandTotalAed: calc.grandTotalAed,
          grandRatePerM2: calc.grandRatePerM2,
          status: 'APPROVED',
          termsAndConditions: JSON.stringify([
            '1) Above consumption is based on theoretical calculation. The material requirement is based on the standard Knauf system proposed and does not include wastage or overlaps. It is the responsibility of the customer to verify actual quantity against BOQ, final drawings and site conditions before placing orders. Al Namariq will not be liable for any variations required for the project.',
            '2) Material will be supplied as per bundle/packaging multiple in full trailer load only.',
            '3) Non standard materials leadtime is approx 3-4 weeks upon receipt of confirmed order.',
            '4) Merchandise or imported goods will take 6-8 weeks.',
            '5) Delivery schedule is a must to plan supply and initiate production.',
            '6) The technical proposal for this project will be submitted upon confirmation.',
            '7) Standard sales terms & conditions apply.'
          ]),
        },
      });

      let sort2 = 0;
      for (const item of calc.baseItems) {
        await prisma.quotationItem.create({
          data: {
            quotationId: q2.id,
            productName: item.productName,
            factorPerM2: item.factorPerM2,
            unit: item.unit,
            totalQuantity: item.totalQuantity,
            unitPriceAed: item.unitPriceAed,
            totalPriceAed: item.totalPriceAed,
            isHeadDeflection: item.isHeadDeflection,
            sortOrder: sort2++,
          },
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

