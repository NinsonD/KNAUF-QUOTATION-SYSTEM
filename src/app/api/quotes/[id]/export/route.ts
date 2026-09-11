import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateAlNamariqExcel } from '@/lib/exporters/excel-generator';
import { CalculationResult, KnaufSystemDefinition, QuoteMetaData } from '@/lib/engine/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        system: {
          include: {
            materials: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const systemDef: KnaufSystemDefinition = {
      code: quote.system.code,
      name: quote.system.name,
      category: quote.system.category as any,
      description: quote.system.description ?? undefined,
      supportsDeflection: quote.system.supportsDeflection,
      baseMaterials: quote.system.materials
        .filter((m) => !m.isHeadDeflection)
        .map((m) => ({
          productName: m.productName,
          factorPerM2: m.factorPerM2,
          unit: m.unit,
        })),
      deflectionMaterials: quote.system.materials
        .filter((m) => m.isHeadDeflection)
        .map((m) => ({
          productName: m.productName,
          factorPerM2: m.factorPerM2,
          unit: m.unit,
          isHeadDeflection: true,
        })),
    };

    const baseItems = quote.items
      .filter((it) => !it.isHeadDeflection)
      .map((it) => ({
        productName: it.productName,
        factorPerM2: it.factorPerM2,
        unit: it.unit,
        totalQuantity: it.totalQuantity,
        unitPriceAed: it.unitPriceAed,
        totalPriceAed: it.totalPriceAed,
        isHeadDeflection: false,
      }));

    const deflectionItems = quote.items
      .filter((it) => it.isHeadDeflection)
      .map((it) => ({
        productName: it.productName,
        factorPerM2: it.factorPerM2,
        unit: it.unit,
        totalQuantity: it.totalQuantity,
        unitPriceAed: it.unitPriceAed,
        totalPriceAed: it.totalPriceAed,
        isHeadDeflection: true,
      }));

    const calc: CalculationResult = {
      scaleM2: quote.scaleM2,
      baseItems,
      deflectionItems,
      baseTotalAed: quote.baseTotalAed,
      baseRatePerM2: quote.baseRatePerM2,
      deflectionTotalAed: quote.deflectionTotalAed ?? 0,
      deflectionRatePerM2: quote.deflectionRatePerM2 ?? 0,
      grandTotalAed: quote.grandTotalAed,
      grandRatePerM2: quote.grandRatePerM2,
    };

    const meta: QuoteMetaData = {
      quoteNumber: quote.quoteNumber,
      projectName: quote.projectName,
      clientName: quote.clientName,
      salesman: quote.salesman,
      date: new Date(quote.createdAt).toLocaleDateString('en-GB'),
    };

    let logoBuffer: Buffer | undefined;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const p = path.join(process.cwd(), 'public', 'logo', 'logo.png');
      if (fs.existsSync(p)) {
        logoBuffer = fs.readFileSync(p);
      }
    } catch (e) {
      console.warn('Could not read logo for excel export:', e);
    }

    const excelBuffer = await generateAlNamariqExcel(meta, systemDef, calc, logoBuffer);

    const safeFilename = `${quote.quoteNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}_Knauf_Quotation.xlsx`;

    return new NextResponse(excelBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Export Excel failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}

