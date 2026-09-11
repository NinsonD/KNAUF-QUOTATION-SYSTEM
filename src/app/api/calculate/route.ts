import { NextRequest, NextResponse } from 'next/server';
import knaufSystemsData from '@/data/knauf-systems.json';
import defaultPricesData from '@/data/default-prices.json';
import { calculateQuotation } from '@/lib/engine/calculator';
import { KnaufSystemDefinition } from '@/lib/engine/types';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemCode, scaleM2, unitPrices, includeDeflection, customItems } = body;

    if (!systemCode) {
      return NextResponse.json({ error: 'systemCode is required' }, { status: 400 });
    }

    const scale = Number(scaleM2) || 1;

    // Retrieve system definition from database or static fallback
    let systemDef = (knaufSystemsData as unknown as KnaufSystemDefinition[]).find(
      (s) => s.code === systemCode
    );

    if (!systemDef) {
      const dbSystem = await prisma.knaufSystem.findUnique({
        where: { code: systemCode },
        include: { materials: { orderBy: { sortOrder: 'asc' } } },
      });

      if (dbSystem) {
        systemDef = {
          code: dbSystem.code,
          name: dbSystem.name,
          category: dbSystem.category as any,
          description: dbSystem.description ?? undefined,
          supportsDeflection: dbSystem.supportsDeflection,
          baseMaterials: dbSystem.materials
            .filter((m) => !m.isHeadDeflection)
            .map((m) => ({
              productName: m.productName,
              factorPerM2: m.factorPerM2,
              unit: m.unit,
            })),
          deflectionMaterials: dbSystem.materials
            .filter((m) => m.isHeadDeflection)
            .map((m) => ({
              productName: m.productName,
              factorPerM2: m.factorPerM2,
              unit: m.unit,
              isHeadDeflection: true,
            })),
        };
      }
    }

    if (!systemDef) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    // Merge unit prices with default prices
    const mergedPrices = {
      ...defaultPricesData,
      ...(unitPrices || {}),
    };

    const calculation = calculateQuotation(
      systemDef,
      scale,
      mergedPrices,
      Boolean(includeDeflection),
      customItems
    );

    return NextResponse.json({
      system: systemDef,
      calculation,
    });
  } catch (error: any) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: error.message || 'Calculation failed' }, { status: 500 });
  }
}

