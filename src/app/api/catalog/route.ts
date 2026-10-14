import { requireApiUser } from '@/lib/auth/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import knaufSystemsData from '@/data/knauf-systems.json';
import { getQuotationPrices } from '@/lib/engine/prices';

export async function GET() {
 const access = await requireApiUser(); if (access instanceof NextResponse) return access;
 try { return NextResponse.json({systems:knaufSystemsData,prices:await getQuotationPrices()}); }
 catch { return NextResponse.json({error:'The database is unavailable. Please try again.'},{status:503}); }
}
export async function POST(req: NextRequest) {
 const access = await requireApiUser(req); if (access instanceof NextResponse) return access;
  try {
    const { canManagePrices } = await import('@/lib/auth/permissions');
    const user = access;

    if (!user || !canManagePrices(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only Administrator can modify master material prices.' },
        { status: 403 }
      );
    }

    const body = z.object({productName:z.string().trim().min(1).max(500),unit:z.string().trim().min(1).max(30).optional(),priceAed:z.coerce.number().finite().nonnegative()}).parse(await req.json());
    const { productName, unit, priceAed } = body;

    if (!productName || priceAed === undefined) {
      return NextResponse.json({ error: 'productName and priceAed required' }, { status: 400 });
    }

    const updated = await prisma.masterProductPrice.upsert({
      where: { productName },
      update: {
        defaultPriceAed: priceAed,
        ...(unit ? { unit } : {}),
      },
      create: {
        productName,
        defaultPriceAed: priceAed,
        unit: unit || 'pcs',
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {

    return NextResponse.json({ error: error instanceof z.ZodError ? 'Enter a valid material and non-negative rate.' : 'Could not update material price.' }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
