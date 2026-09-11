import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { CalculationResult, QuoteMetaData, KnaufSystemDefinition } from '../engine/types';
import { AL_NAMARIQ_TERMS } from './excel-generator';
import fs from 'fs';
import path from 'path';

// Official Al Namariq Color Palette
const COLOR_BLUE = rgb(0 / 255, 72 / 255, 142 / 255); // #00488e
const COLOR_NAVY = rgb(0 / 255, 45 / 255, 90 / 255); // #002d5a
const COLOR_ORANGE = rgb(248 / 255, 108 / 255, 41 / 255); // #f86c29
const COLOR_EMERALD = rgb(16 / 255, 120 / 255, 80 / 255);
const COLOR_LIGHT_BLUE = rgb(240 / 255, 246 / 255, 253 / 255);
const COLOR_LIGHT_EMERALD = rgb(240 / 255, 253 / 255, 244 / 255);
const COLOR_ZEBRA = rgb(248 / 255, 250 / 255, 252 / 255);
const COLOR_TEXT_DARK = rgb(15 / 255, 23 / 255, 42 / 255); // slate-900
const COLOR_TEXT_MUTED = rgb(100 / 255, 116 / 255, 139 / 255); // slate-500
const COLOR_BORDER = rgb(203 / 255, 213 / 255, 225 / 255); // slate-300
const COLOR_WHITE = rgb(1, 1, 1);

// Page Geometry (Standard A4 in points: 595.28 x 841.89)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 523.28

export async function generateAlNamariqPDF(
  meta: QuoteMetaData,
  system: KnaufSystemDefinition,
  calc: CalculationResult,
  customLogoBuffer?: Buffer | Uint8Array | ArrayBuffer
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed standard vector fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Load logo
  let logoImage: any = null;
  try {
    let logoData: Buffer | Uint8Array | ArrayBuffer | undefined = customLogoBuffer;
    if (!logoData && typeof window === 'undefined') {
      const defaultLogoPath = path.join(process.cwd(), 'public', 'logo', 'logo.png');
      if (fs.existsSync(defaultLogoPath)) {
        logoData = fs.readFileSync(defaultLogoPath);
      }
    }
    if (logoData) {
      const bytes = logoData instanceof Uint8Array ? logoData : new Uint8Array(logoData);
      logoImage = await pdfDoc.embedPng(bytes);
    }
  } catch (e) {
    console.warn('Could not embed logo in PDF:', e);
  }

  // Helper to create a new page
  function createPage(): { page: PDFPage; startY: number } {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page, startY: PAGE_HEIGHT - 36 };
  }

  let { page, startY: y } = createPage();

  // 1. HEADER SECTION
  const headerHeight = 65;
  // Logo
  if (logoImage) {
    const logoDims = logoImage.scale(0.35);
    const logoH = Math.min(logoDims.height, 46);
    const logoW = (logoDims.width * logoH) / logoDims.height;
    page.drawImage(logoImage, {
      x: MARGIN_X,
      y: y - logoH,
      width: logoW,
      height: logoH,
    });
  }

  // Company Name & Subtitles
  const textLeft = logoImage ? MARGIN_X + 130 : MARGIN_X;
  page.drawText('AL NAMARIQ BUILDING MATERIAL TRADING CO. LLC', {
    x: textLeft,
    y: y - 10,
    size: 11,
    font: fontBold,
    color: COLOR_BLUE,
  });
  page.drawText('Certified Knauf Dry Construction Systems Distributor', {
    x: textLeft,
    y: y - 22,
    size: 8,
    font: fontBold,
    color: COLOR_TEXT_DARK,
  });
  page.drawText('P.O. Box 25569, Industrial Area, Sharjah, UAE • Tel: +971 6 5328033 • Fax: +971 6 5328302', {
    x: textLeft,
    y: y - 33,
    size: 6.8,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });
  page.drawText('Email: sales@alnamariq.ae • Certified Knauf BoQ Engineering Platform', {
    x: textLeft,
    y: y - 43,
    size: 6.8,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });

  // Quotation Badge (Top Right)
  const badgeWidth = 145;
  const badgeHeight = 24;
  const badgeX = PAGE_WIDTH - MARGIN_X - badgeWidth;
  const badgeY = y - 24;

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: COLOR_BLUE,
  });
  page.drawText('COMMERCIAL QUOTATION', {
    x: badgeX + 12,
    y: badgeY + 8,
    size: 8.5,
    font: fontBold,
    color: COLOR_WHITE,
  });

  page.drawText(`Ref: ${meta.quoteNumber || 'ANM-2026'}`, {
    x: badgeX + 8,
    y: badgeY - 12,
    size: 8.5,
    font: fontBold,
    color: COLOR_ORANGE,
  });
  page.drawText(`Date: ${meta.date || new Date().toLocaleDateString('en-GB')}`, {
    x: badgeX + 8,
    y: badgeY - 22,
    size: 7.5,
    font: fontRegular,
    color: COLOR_TEXT_MUTED,
  });

  y -= headerHeight + 5;

  // Blue Divider
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 1.5,
    color: COLOR_BLUE,
  });

  y -= 10;

  // 2. PROJECT METADATA CARD (Two Column Grid)
  const metaBoxHeight = 52;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - metaBoxHeight,
    width: CONTENT_WIDTH,
    height: metaBoxHeight,
    color: COLOR_ZEBRA,
    borderColor: COLOR_BORDER,
    borderWidth: 0.8,
  });

  const col1X = MARGIN_X + 10;
  const col2X = MARGIN_X + CONTENT_WIDTH * 0.55;
  let metaY = y - 14;

  // Left column
  page.drawText('Project Name:', { x: col1X, y: metaY, size: 7.5, font: fontBold, color: COLOR_TEXT_MUTED });
  page.drawText(meta.projectName || 'Commercial Project', { x: col1X + 68, y: metaY, size: 8, font: fontBold, color: COLOR_TEXT_DARK });

  page.drawText('Client / Contractor:', { x: col1X, y: metaY - 12, size: 7.5, font: fontBold, color: COLOR_TEXT_MUTED });
  page.drawText(meta.clientName || 'Valued Client', { x: col1X + 68, y: metaY - 12, size: 8, font: fontBold, color: COLOR_TEXT_DARK });

  page.drawText('Product Specified:', { x: col1X, y: metaY - 24, size: 7.5, font: fontBold, color: COLOR_TEXT_MUTED });
  page.drawText(`${system.code} - ${system.name}`.slice(0, 38), { x: col1X + 68, y: metaY - 24, size: 8, font: fontBold, color: COLOR_BLUE });

  // Right column
  page.drawText('Quotation No:', { x: col2X, y: metaY, size: 7.5, font: fontBold, color: COLOR_TEXT_MUTED });
  page.drawText(meta.quoteNumber || 'ANM-2026', { x: col2X + 60, y: metaY, size: 8, font: fontBold, color: COLOR_BLUE });

  page.drawText('Project Scale:', { x: col2X, y: metaY - 12, size: 7.5, font: fontBold, color: COLOR_TEXT_MUTED });
  page.drawText(`${calc.scaleM2.toLocaleString()} M²`, { x: col2X + 60, y: metaY - 12, size: 8, font: fontBold, color: COLOR_TEXT_DARK });

  page.drawText('Sales Engineer:', { x: col2X, y: metaY - 24, size: 7.5, font: fontBold, color: COLOR_TEXT_MUTED });
  page.drawText(meta.salesman || 'Technical Sales', { x: col2X + 60, y: metaY - 24, size: 8, font: fontBold, color: COLOR_TEXT_DARK });

  y -= metaBoxHeight + 12;

  // 3. TABLE COLUMN DEFINITIONS
  const colWidths = [
    22,  // #
    222, // Description
    52,  // Factor / M²
    30,  // Unit
    62,  // Project Qty
    60,  // Unit Price
    75.28, // Total AED
  ];

  const colX = [
    MARGIN_X,
    MARGIN_X + colWidths[0],
    MARGIN_X + colWidths[0] + colWidths[1],
    MARGIN_X + colWidths[0] + colWidths[1] + colWidths[2],
    MARGIN_X + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    MARGIN_X + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
    MARGIN_X + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5],
  ];

  function drawTableHeader(targetPage: PDFPage, targetY: number): number {
    const thHeight = 18;
    targetPage.drawRectangle({
      x: MARGIN_X,
      y: targetY - thHeight,
      width: CONTENT_WIDTH,
      height: thHeight,
      color: COLOR_BLUE,
    });

    const headers = [
      '#',
      'MATERIAL DESCRIPTION & SPECIFICATION',
      'REQ / M²',
      'UNIT',
      'TOTAL QTY',
      'RATE (AED)',
      'TOTAL (AED)',
    ];

    headers.forEach((h, i) => {
      let hX = colX[i] + 4;
      if (i === 0) hX = colX[i] + 7;
      if (i === 2 || i === 4 || i === 5 || i === 6) {
        const textWidth = fontBold.widthOfTextAtSize(h, 6.8);
        hX = colX[i] + colWidths[i] - textWidth - 5;
      }
      if (i === 3) {
        hX = colX[i] + (colWidths[i] - fontBold.widthOfTextAtSize(h, 6.8)) / 2;
      }

      targetPage.drawText(h, {
        x: hX,
        y: targetY - 12,
        size: 6.8,
        font: fontBold,
        color: COLOR_WHITE,
      });
    });

    return targetY - thHeight;
  }

  y = drawTableHeader(page, y);

  // Check and handle page overflow
  function ensureSpace(neededHeight: number): void {
    if (y - neededHeight < 60) {
      // Add new page
      const next = createPage();
      page = next.page;
      y = next.startY;
      y = drawTableHeader(page, y);
    }
  }

  // Section Banner: Base Components
  ensureSpace(16);
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 15,
    width: CONTENT_WIDTH,
    height: 15,
    color: COLOR_LIGHT_BLUE,
    borderColor: COLOR_BORDER,
    borderWidth: 0.5,
  });
  page.drawText(`A. KNAUF STANDARD SYSTEM COMPONENTS (${calc.baseItems.length} ITEMS)`, {
    x: MARGIN_X + 6,
    y: y - 10.5,
    size: 7,
    font: fontBold,
    color: COLOR_BLUE,
  });
  y -= 15;

  // Render Base Items
  calc.baseItems.forEach((item, index) => {
    ensureSpace(14);
    const rowHeight = 14;
    const isZebra = index % 2 === 1;

    if (isZebra) {
      page.drawRectangle({
        x: MARGIN_X,
        y: y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: COLOR_ZEBRA,
      });
    }

    // Border line bottom
    page.drawLine({
      start: { x: MARGIN_X, y: y - rowHeight },
      end: { x: PAGE_WIDTH - MARGIN_X, y: y - rowHeight },
      thickness: 0.4,
      color: COLOR_BORDER,
    });

    // Column values
    // Index
    page.drawText(String(index + 1), {
      x: colX[0] + 6,
      y: y - 10,
      size: 7,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });

    // Description
    const maxDescChars = 48;
    const descText = item.productName.length > maxDescChars ? item.productName.slice(0, maxDescChars) + '...' : item.productName;
    page.drawText(descText, {
      x: colX[1] + 4,
      y: y - 10,
      size: 7.2,
      font: fontBold,
      color: COLOR_TEXT_DARK,
    });

    // Factor / m²
    const factorText = item.factorPerM2.toFixed(3);
    page.drawText(factorText, {
      x: colX[2] + colWidths[2] - fontRegular.widthOfTextAtSize(factorText, 7) - 4,
      y: y - 10,
      size: 7,
      font: fontRegular,
      color: COLOR_TEXT_DARK,
    });

    // Unit
    page.drawText(item.unit, {
      x: colX[3] + (colWidths[3] - fontRegular.widthOfTextAtSize(item.unit, 7)) / 2,
      y: y - 10,
      size: 7,
      font: fontRegular,
      color: COLOR_TEXT_DARK,
    });

    // Qty
    const qtyText = item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    page.drawText(qtyText, {
      x: colX[4] + colWidths[4] - fontBold.widthOfTextAtSize(qtyText, 7) - 4,
      y: y - 10,
      size: 7,
      font: fontBold,
      color: COLOR_TEXT_DARK,
    });

    // Rate
    const rateText = item.unitPriceAed.toFixed(3);
    page.drawText(rateText, {
      x: colX[5] + colWidths[5] - fontRegular.widthOfTextAtSize(rateText, 7) - 4,
      y: y - 10,
      size: 7,
      font: fontRegular,
      color: COLOR_TEXT_DARK,
    });

    // Total
    const totalText = item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    page.drawText(totalText, {
      x: colX[6] + colWidths[6] - fontBold.widthOfTextAtSize(totalText, 7.2) - 4,
      y: y - 10,
      size: 7.2,
      font: fontBold,
      color: COLOR_TEXT_DARK,
    });

    y -= rowHeight;
  });

  // Base Subtotal Row
  ensureSpace(16);
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 16,
    width: CONTENT_WIDTH,
    height: 16,
    color: COLOR_LIGHT_BLUE,
    borderColor: COLOR_BLUE,
    borderWidth: 0.6,
  });

  page.drawText('SUBTOTAL BASE SYSTEM ASSEMBLY:', {
    x: colX[1] + 4,
    y: y - 11,
    size: 7.2,
    font: fontBold,
    color: COLOR_BLUE,
  });

  const baseRateLabel = `Rate: AED ${calc.baseRatePerM2.toFixed(2)} / M²`;
  page.drawText(baseRateLabel, {
    x: colX[4] + colWidths[4] - fontBold.widthOfTextAtSize(baseRateLabel, 7) - 4,
    y: y - 11,
    size: 7,
    font: fontBold,
    color: COLOR_BLUE,
  });

  const baseTotalStr = `AED ${calc.baseTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  page.drawText(baseTotalStr, {
    x: colX[6] + colWidths[6] - fontBold.widthOfTextAtSize(baseTotalStr, 7.5) - 4,
    y: y - 11,
    size: 7.5,
    font: fontBold,
    color: COLOR_BLUE,
  });

  y -= 16;

  // Head Deflection Items (if present)
  if (calc.deflectionItems && calc.deflectionItems.length > 0) {
    ensureSpace(16);
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 15,
      width: CONTENT_WIDTH,
      height: 15,
      color: COLOR_LIGHT_EMERALD,
      borderColor: COLOR_EMERALD,
      borderWidth: 0.5,
    });
    page.drawText(`B. KNAUF HEAD DEFLECTION MOVEMENT JOINTS (${calc.deflectionItems.length} ITEMS)`, {
      x: MARGIN_X + 6,
      y: y - 10.5,
      size: 7,
      font: fontBold,
      color: COLOR_EMERALD,
    });
    y -= 15;

    calc.deflectionItems.forEach((item, index) => {
      ensureSpace(14);
      const rowHeight = 14;
      const isZebra = index % 2 === 1;

      if (isZebra) {
        page.drawRectangle({
          x: MARGIN_X,
          y: y - rowHeight,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: COLOR_ZEBRA,
        });
      }

      page.drawLine({
        start: { x: MARGIN_X, y: y - rowHeight },
        end: { x: PAGE_WIDTH - MARGIN_X, y: y - rowHeight },
        thickness: 0.4,
        color: COLOR_BORDER,
      });

      // Index
      page.drawText(String(calc.baseItems.length + index + 1), {
        x: colX[0] + 6,
        y: y - 10,
        size: 7,
        font: fontRegular,
        color: COLOR_TEXT_MUTED,
      });

      // Description
      const maxDescChars = 48;
      const descText = item.productName.length > maxDescChars ? item.productName.slice(0, maxDescChars) + '...' : item.productName;
      page.drawText(descText, {
        x: colX[1] + 4,
        y: y - 10,
        size: 7.2,
        font: fontBold,
        color: COLOR_TEXT_DARK,
      });

      // Factor
      const factorText = item.factorPerM2.toFixed(3);
      page.drawText(factorText, {
        x: colX[2] + colWidths[2] - fontRegular.widthOfTextAtSize(factorText, 7) - 4,
        y: y - 10,
        size: 7,
        font: fontRegular,
        color: COLOR_TEXT_DARK,
      });

      // Unit
      page.drawText(item.unit, {
        x: colX[3] + (colWidths[3] - fontRegular.widthOfTextAtSize(item.unit, 7)) / 2,
        y: y - 10,
        size: 7,
        font: fontRegular,
        color: COLOR_TEXT_DARK,
      });

      // Qty
      const qtyText = item.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page.drawText(qtyText, {
        x: colX[4] + colWidths[4] - fontBold.widthOfTextAtSize(qtyText, 7) - 4,
        y: y - 10,
        size: 7,
        font: fontBold,
        color: COLOR_TEXT_DARK,
      });

      // Rate
      const rateText = item.unitPriceAed.toFixed(3);
      page.drawText(rateText, {
        x: colX[5] + colWidths[5] - fontRegular.widthOfTextAtSize(rateText, 7) - 4,
        y: y - 10,
        size: 7,
        font: fontRegular,
        color: COLOR_TEXT_DARK,
      });

      // Total
      const totalText = item.totalPriceAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page.drawText(totalText, {
        x: colX[6] + colWidths[6] - fontBold.widthOfTextAtSize(totalText, 7.2) - 4,
        y: y - 10,
        size: 7.2,
        font: fontBold,
        color: COLOR_TEXT_DARK,
      });

      y -= rowHeight;
    });

    // Deflection Subtotal Row
    ensureSpace(16);
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 16,
      width: CONTENT_WIDTH,
      height: 16,
      color: COLOR_LIGHT_EMERALD,
      borderColor: COLOR_EMERALD,
      borderWidth: 0.6,
    });

    page.drawText('SUBTOTAL HEAD DEFLECTION MOVEMENT JOINTS:', {
      x: colX[1] + 4,
      y: y - 11,
      size: 7.2,
      font: fontBold,
      color: COLOR_EMERALD,
    });

    const defRateLabel = `Rate: AED ${(calc.deflectionRatePerM2 || 0).toFixed(2)} / M²`;
    page.drawText(defRateLabel, {
      x: colX[4] + colWidths[4] - fontBold.widthOfTextAtSize(defRateLabel, 7) - 4,
      y: y - 11,
      size: 7,
      font: fontBold,
      color: COLOR_EMERALD,
    });

    const defTotalStr = `AED ${(calc.deflectionTotalAed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    page.drawText(defTotalStr, {
      x: colX[6] + colWidths[6] - fontBold.widthOfTextAtSize(defTotalStr, 7.5) - 4,
      y: y - 11,
      size: 7.5,
      font: fontBold,
      color: COLOR_EMERALD,
    });

    y -= 16;
  }

  // 4. COMMERCIAL GRAND TOTALS (Corporate Blue & Deep Navy Banners)
  ensureSpace(38);
  const grandTotalH = 20;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - grandTotalH,
    width: CONTENT_WIDTH,
    height: grandTotalH,
    color: COLOR_BLUE,
  });

  page.drawText('TOTAL COMMERCIAL OFFER VALUE (EXCL. VAT):', {
    x: MARGIN_X + 8,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: COLOR_WHITE,
  });

  const grandTotalStr = `AED ${calc.grandTotalAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  page.drawText(grandTotalStr, {
    x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(grandTotalStr, 11) - 8,
    y: y - 14,
    size: 11,
    font: fontBold,
    color: COLOR_ORANGE,
  });

  y -= grandTotalH;

  // Rate Row
  const rateRowH = 16;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - rateRowH,
    width: CONTENT_WIDTH,
    height: rateRowH,
    color: COLOR_NAVY,
  });

  page.drawText('FINAL EFFECTIVE RATE PER M² (ALL-INCLUSIVE):', {
    x: MARGIN_X + 8,
    y: y - 11,
    size: 7.2,
    font: fontBold,
    color: rgb(191 / 255, 219 / 255, 254 / 255),
  });

  const rateStr = `AED ${calc.grandRatePerM2.toFixed(2)} / M² Standard Project Scale`;
  page.drawText(rateStr, {
    x: PAGE_WIDTH - MARGIN_X - fontBold.widthOfTextAtSize(rateStr, 8.5) - 8,
    y: y - 11.5,
    size: 8.5,
    font: fontBold,
    color: COLOR_WHITE,
  });

  y -= rateRowH + 12;

  // 5. OFFICIAL TERMS & CONDITIONS BOX
  ensureSpace(70);
  const termsBoxH = 68;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - termsBoxH,
    width: CONTENT_WIDTH,
    height: termsBoxH,
    color: COLOR_ZEBRA,
    borderColor: COLOR_BORDER,
    borderWidth: 0.6,
  });

  page.drawText('OFFICIAL COMMERCIAL TERMS & CONDITIONS:', {
    x: MARGIN_X + 8,
    y: y - 10,
    size: 6.8,
    font: fontBold,
    color: COLOR_BLUE,
  });

  let termY = y - 18;
  AL_NAMARIQ_TERMS.slice(0, 7).forEach((term, i) => {
    const cleanTerm = term.replace(/^[0-9]+\)\s*/, '');
    const termLine = `${i + 1}. ${cleanTerm.slice(0, 118)}`;
    page.drawText(termLine, {
      x: MARGIN_X + 8,
      y: termY,
      size: 5.6,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });
    termY -= 7.2;
  });

  y -= termsBoxH + 12;

  // 6. TRIPLE SIGNATURE & STAMP BLOCK
  ensureSpace(54);
  const sigColW = (CONTENT_WIDTH - 20) / 3;

  // Prepared by
  const sig1X = MARGIN_X;
  page.drawText('PREPARED BY:', { x: sig1X, y: y - 8, size: 6.8, font: fontBold, color: COLOR_BLUE });
  page.drawLine({ start: { x: sig1X, y: y - 32 }, end: { x: sig1X + sigColW, y: y - 32 }, thickness: 0.6, color: COLOR_BORDER });
  page.drawText(meta.salesman || 'Technical Sales Engineer', { x: sig1X, y: y - 41, size: 6.8, font: fontBold, color: COLOR_TEXT_DARK });
  page.drawText('Al Namariq Estimating Dept.', { x: sig1X, y: y - 49, size: 5.8, font: fontRegular, color: COLOR_TEXT_MUTED });

  // Authorized by
  const sig2X = MARGIN_X + sigColW + 10;
  page.drawText('AUTHORIZED BY:', { x: sig2X, y: y - 8, size: 6.8, font: fontBold, color: COLOR_BLUE });
  page.drawLine({ start: { x: sig2X, y: y - 32 }, end: { x: sig2X + sigColW, y: y - 32 }, thickness: 0.6, color: COLOR_BORDER });
  page.drawText('Commercial Directorate', { x: sig2X, y: y - 41, size: 6.8, font: fontBold, color: COLOR_TEXT_DARK });
  page.drawText('Al Namariq Sharjah Branch', { x: sig2X, y: y - 49, size: 5.8, font: fontRegular, color: COLOR_TEXT_MUTED });

  // Customer Acceptance
  const sig3X = MARGIN_X + (sigColW + 10) * 2;
  page.drawText('CUSTOMER ACCEPTANCE:', { x: sig3X, y: y - 8, size: 6.8, font: fontBold, color: COLOR_TEXT_DARK });
  page.drawLine({ start: { x: sig3X, y: y - 32 }, end: { x: sig3X + sigColW, y: y - 32 }, thickness: 0.6, color: COLOR_BORDER });
  page.drawText('Authorized Signatory & Stamp', { x: sig3X, y: y - 41, size: 6.8, font: fontBold, color: COLOR_TEXT_DARK });
  page.drawText('Date: ____ / ____ / 2026', { x: sig3X, y: y - 49, size: 5.8, font: fontRegular, color: COLOR_TEXT_MUTED });

  // 7. FOOTER WITH PAGE NUMBERS ON ALL PAGES
  const totalPages = pdfDoc.getPageCount();
  pdfDoc.getPages().forEach((p, idx) => {
    p.drawLine({
      start: { x: MARGIN_X, y: 24 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: 24 },
      thickness: 0.5,
      color: COLOR_BORDER,
    });
    p.drawText('Al Namariq Building Material Trading Co. LLC • Certified Knauf Quotation Engine (Sharjah, UAE)', {
      x: MARGIN_X,
      y: 14,
      size: 5.8,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });
    const pageNumText = `Page ${idx + 1} of ${totalPages}`;
    p.drawText(pageNumText, {
      x: PAGE_WIDTH - MARGIN_X - fontRegular.widthOfTextAtSize(pageNumText, 5.8),
      y: 14,
      size: 5.8,
      font: fontRegular,
      color: COLOR_TEXT_MUTED,
    });
  });

  return await pdfDoc.save();
}
