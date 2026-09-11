import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Failed to get quote:', error);
    return NextResponse.json({ error: 'Failed to retrieve quotation' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      quoteNumber,
      projectName,
      clientName,
      salesman,
      scaleM2,
      includeDeflection,
      calculation,
      status,
      termsAndConditions,
    } = body;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Delete existing items and recreate if new calculation passed
    if (calculation?.baseItems) {
      await prisma.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      const allItems = [
        ...(calculation.baseItems || []),
        ...(calculation.deflectionItems || []),
      ];

      await prisma.quotationItem.createMany({
        data: allItems.map((it: any, idx: number) => ({
          quotationId: id,
          productName: it.productName,
          factorPerM2: Number(it.factorPerM2),
          unit: it.unit,
          totalQuantity: Number(it.totalQuantity),
          unitPriceAed: Number(it.unitPriceAed),
          totalPriceAed: Number(it.totalPriceAed),
          isHeadDeflection: Boolean(it.isHeadDeflection),
          sortOrder: idx,
        })),
      });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        quoteNumber: quoteNumber ?? existing.quoteNumber,
        projectName: projectName ?? existing.projectName,
        clientName: clientName ?? existing.clientName,
        salesman: salesman ?? existing.salesman,
        scaleM2: scaleM2 !== undefined ? Number(scaleM2) : existing.scaleM2,
        includeDeflection:
          includeDeflection !== undefined ? Boolean(includeDeflection) : existing.includeDeflection,
        baseTotalAed: calculation?.baseTotalAed ?? existing.baseTotalAed,
        baseRatePerM2: calculation?.baseRatePerM2 ?? existing.baseRatePerM2,
        deflectionTotalAed:
          calculation?.deflectionTotalAed !== undefined
            ? Number(calculation.deflectionTotalAed)
            : existing.deflectionTotalAed,
        deflectionRatePerM2:
          calculation?.deflectionRatePerM2 !== undefined
            ? Number(calculation.deflectionRatePerM2)
            : existing.deflectionRatePerM2,
        grandTotalAed: calculation?.grandTotalAed ?? existing.grandTotalAed,
        grandRatePerM2: calculation?.grandRatePerM2 ?? existing.grandRatePerM2,
        status: status ?? existing.status,
        termsAndConditions: termsAndConditions
          ? JSON.stringify(termsAndConditions)
          : existing.termsAndConditions,
      },
      include: {
        system: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update quote:', error);
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.quotation.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete quote:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}

