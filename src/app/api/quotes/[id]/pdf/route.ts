import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateAlNamariqPDF } from '@/lib/exporters/pdf-generator';
import { CalculationResult, KnaufSystemDefinition, QuoteMetaData, CalculatedItem, QuoteStatus } from '@/lib/engine/types';
import fs from 'fs';
import path from 'path';

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
            materials: true,
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

    const baseItems: CalculatedItem[] = quote.items
      .filter((i) => !i.isHeadDeflection)
      .map((i) => ({
        productName: i.productName,
        factorPerM2: i.factorPerM2,
        unit: i.unit,
        totalQuantity: i.totalQuantity,
        unitPriceAed: i.unitPriceAed,
        totalPriceAed: i.totalPriceAed,
        isHeadDeflection: false,
      }));

    const deflectionItems: CalculatedItem[] = quote.items
      .filter((i) => i.isHeadDeflection)
      .map((i) => ({
        productName: i.productName,
        factorPerM2: i.factorPerM2,
        unit: i.unit,
        totalQuantity: i.totalQuantity,
        unitPriceAed: i.unitPriceAed,
        totalPriceAed: i.totalPriceAed,
        isHeadDeflection: true,
      }));

    const calc: CalculationResult = {
      scaleM2: quote.scaleM2,
      baseItems,
      deflectionItems,
      baseTotalAed: quote.baseTotalAed,
      baseRatePerM2: quote.baseRatePerM2,
      deflectionTotalAed: quote.deflectionTotalAed || 0,
      deflectionRatePerM2: quote.deflectionRatePerM2 || 0,
      grandTotalAed: quote.grandTotalAed,
      grandRatePerM2: quote.grandRatePerM2,
    };

    const meta: QuoteMetaData = {
      quoteNumber: quote.quoteNumber,
      projectName: quote.projectName,
      clientName: quote.clientName,
      salesman: quote.salesman,
      date: new Date(quote.createdAt).toLocaleDateString('en-GB'),
      status: (quote.status as QuoteStatus) || 'DRAFT',
    };

    const systemDef: KnaufSystemDefinition = {
      code: quote.system?.code || 'CUSTOM',
      name: quote.system?.name || 'Custom Knauf Assembly',
      category: (quote.system?.category || 'PARTITION') as any,
      supportsDeflection: quote.system?.supportsDeflection || false,
      baseMaterials: quote.system?.materials
        ? quote.system.materials
            .filter((m) => !m.isHeadDeflection)
            .map((m) => ({
              productName: m.productName,
              factorPerM2: m.factorPerM2,
              unit: m.unit,
            }))
        : [],
    };

    // Load logo
    let logoBuffer: Buffer | undefined;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo', 'logo.png');
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (e) {
      console.warn('Could not read logo for PDF route', e);
    }

    const pdfBytes = await generateAlNamariqPDF(meta, systemDef, calc, logoBuffer);

    const safeQuoteNumber = (quote.quoteNumber || 'Quotation').replace(/[^a-zA-Z0-9_-]/g, '_');
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeQuoteNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('PDF export failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to export PDF' }, { status: 500 });
  }
}
