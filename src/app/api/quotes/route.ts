import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AL_NAMARIQ_TERMS } from '@/lib/exporters/excel-generator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const quotes = await prisma.quotation.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { quoteNumber: { contains: search } },
                  { projectName: { contains: search } },
                  { clientName: { contains: search } },
                  { salesman: { contains: search } },
                ],
              }
            : {},
          status ? { status } : {},
        ],
      },
      include: {
        system: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotes);
  } catch (error: any) {
    console.error('Failed to list quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quoteNumber,
      projectName,
      clientName,
      salesman,
      scaleM2,
      systemCode,
      includeDeflection,
      calculation,
      status = 'DRAFT',
      termsAndConditions,
    } = body;

    if (!quoteNumber || !projectName || !clientName || !scaleM2 || !systemCode) {
      return NextResponse.json(
        { error: 'Missing required quotation fields' },
        { status: 400 }
      );
    }

    const system = await prisma.knaufSystem.findUnique({
      where: { code: systemCode },
    });

    if (!system) {
      return NextResponse.json({ error: 'Selected Knauf System not found' }, { status: 404 });
    }

    const allItems = [
      ...(calculation?.baseItems || []),
      ...(calculation?.deflectionItems || []),
    ];

    // Generate unique quoteNumber if collision or blank
    let finalQuoteNumber = quoteNumber;
    const existing = await prisma.quotation.findUnique({
      where: { quoteNumber: finalQuoteNumber },
    });
    if (existing) {
      finalQuoteNumber = `${quoteNumber}-${Date.now().toString().slice(-4)}`;
    }

    const createdQuote = await prisma.quotation.create({
      data: {
        quoteNumber: finalQuoteNumber,
        projectName,
        clientName,
        salesman: salesman || 'Ram',
        scaleM2: Number(scaleM2),
        systemId: system.id,
        includeDeflection: Boolean(includeDeflection),
        baseTotalAed: Number(calculation.baseTotalAed || 0),
        baseRatePerM2: Number(calculation.baseRatePerM2 || 0),
        deflectionTotalAed: calculation.deflectionTotalAed ? Number(calculation.deflectionTotalAed) : null,
        deflectionRatePerM2: calculation.deflectionRatePerM2 ? Number(calculation.deflectionRatePerM2) : null,
        grandTotalAed: Number(calculation.grandTotalAed || 0),
        grandRatePerM2: Number(calculation.grandRatePerM2 || 0),
        status,
        termsAndConditions: JSON.stringify(termsAndConditions || AL_NAMARIQ_TERMS),
        items: {
          create: allItems.map((it: any, idx: number) => ({
            productName: it.productName,
            factorPerM2: Number(it.factorPerM2),
            unit: it.unit,
            totalQuantity: Number(it.totalQuantity),
            unitPriceAed: Number(it.unitPriceAed),
            totalPriceAed: Number(it.totalPriceAed),
            isHeadDeflection: Boolean(it.isHeadDeflection),
            sortOrder: idx,
          })),
        },
      },
      include: {
        system: true,
        items: true,
      },
    });

    return NextResponse.json(createdQuote, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quotation' },
      { status: 500 }
    );
  }
}

