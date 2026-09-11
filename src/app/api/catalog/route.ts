import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import knaufSystemsData from '@/data/knauf-systems.json';
import defaultPricesData from '@/data/default-prices.json';

export async function GET() {
  try {
    let systems = await prisma.knaufSystem.findMany({
      include: {
        materials: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });

    if (!systems || systems.length === 0) {
      systems = knaufSystemsData as any;
    }

    let prices = await prisma.masterProductPrice.findMany({
      orderBy: { productName: 'asc' },
    });

    // Format prices as key-value map as well as list
    const pricesMap: Record<string, number> = {};
    if (prices && prices.length > 0) {
      for (const p of prices) {
        pricesMap[p.productName] = p.defaultPriceAed;
      }
    } else {
      Object.assign(pricesMap, defaultPricesData);
    }

    return NextResponse.json({
      systems,
      prices: pricesMap,
      rawPrices: prices,
    });
  } catch (error: any) {
    console.error('Failed to get catalog:', error);
    return NextResponse.json({
      systems: knaufSystemsData,
      prices: defaultPricesData,
      error: error.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName, unit, priceAed } = body;

    if (!productName || priceAed === undefined) {
      return NextResponse.json({ error: 'productName and priceAed required' }, { status: 400 });
    }

    const updated = await prisma.masterProductPrice.upsert({
      where: { productName },
      update: {
        defaultPriceAed: Number(priceAed),
        ...(unit ? { unit } : {}),
      },
      create: {
        productName,
        defaultPriceAed: Number(priceAed),
        unit: unit || 'pcs',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update price:', error);
    return NextResponse.json({ error: error.message || 'Failed to update price' }, { status: 500 });
  }
}

