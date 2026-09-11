import { NextRequest, NextResponse } from 'next/server';
import { generateAlNamariqPDF } from '@/lib/exporters/pdf-generator';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meta, system, calculation, download } = body;

    if (!meta || !system || !calculation) {
      return NextResponse.json({ error: 'Missing calculation or metadata' }, { status: 400 });
    }

    let logoBuffer: Buffer | undefined;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo', 'logo.png');
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      }
    } catch (e) {
      console.warn('Could not read logo', e);
    }

    const pdfBytes = await generateAlNamariqPDF(meta, system, calculation, logoBuffer);
    const safeQuoteNumber = (meta.quoteNumber || 'ANM-Quotation').replace(/[^a-zA-Z0-9_-]/g, '_');

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeQuoteNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Instant PDF export error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}

