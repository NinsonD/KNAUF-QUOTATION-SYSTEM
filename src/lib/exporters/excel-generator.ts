import ExcelJS from 'exceljs';
import { CalculationResult, QuoteMetaData, KnaufSystemDefinition } from '../engine/types';

export const AL_NAMARIQ_TERMS = [
  '1) Above consumption is based on theoretical calculation. The material requirement is based on the standard Knauf system proposed and does not include wastage or overlaps. It is the responsibility of the customer to verify actual quantity against BOQ, final drawings and site conditions before placing orders. Al Namariq will not be liable for any variations required for the project.',
  '2) Material will be supplied as per bundle/packaging multiple in full trailer load only.',
  '3) Non standard materials leadtime is approx 3-4 weeks upon receipt of confirmed order.',
  '4) Merchandise or imported goods will take 6-8 weeks.',
  '5) Delivery schedule is a must to plan supply and initiate production.',
  '6) The technical proposal for this project will be submitted upon confirmation.',
  '7) Standard sales terms & conditions apply.'
];

export async function generateAlNamariqExcel(
  meta: QuoteMetaData,
  system: KnaufSystemDefinition,
  calc: CalculationResult
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(meta.quoteNumber || 'Quotation');

  // Page Setup
  ws.views = [{ showGridLines: true }];
  ws.columns = [
    { width: 55 }, // A: Product Name
    { width: 12 }, // B
    { width: 12 }, // C
    { width: 12 }, // D
    { width: 12 }, // E
    { width: 16 }, // F: Material Req / m²
    { width: 10 }, // G: Unit
    { width: 22 }, // H: Total Project Qty
    { width: 18 }, // I: Unit Price (AED)
    { width: 20 }, // J: Total Price (AED)
  ];

  // Company Header
  ws.mergeCells('A5:J5');
  ws.getCell('A5').value = 'Al Namariq Building Material Trading Co. LLC';
  ws.getCell('A5').font = { size: 14, bold: true, color: { argb: 'FF002060' } };

  ws.mergeCells('A6:J6');
  ws.getCell('A6').value = 'P.O. 25569, Sharjah. Ph:(06) 5328033, Fax:(06) 5328302';
  ws.getCell('A6').font = { size: 10, italic: true };

  ws.mergeCells('A8:J8');
  const qCell = ws.getCell('A8');
  qCell.value = 'QUOTATION';
  qCell.font = { size: 13, bold: true };
  qCell.alignment = { horizontal: 'center' };

  // Project Info Metadata Grid
  ws.getCell('A9').value = 'Project Name:';
  ws.getCell('C9').value = meta.projectName;
  ws.getCell('F9').value = 'Client:';
  ws.getCell('H9').value = meta.clientName;

  ws.getCell('A10').value = 'Product Specified:';
  ws.getCell('C10').value = system.name;
  ws.getCell('F10').value = 'Scale of Project:';
  ws.getCell('H10').value = calc.scaleM2;
  ws.getCell('I10').value = 'M²';

  ws.getCell('A11').value = 'Salesman:';
  ws.getCell('C11').value = meta.salesman;
  ws.getCell('F11').value = 'QTN No:';
  ws.getCell('H11').value = meta.quoteNumber;

  ['A9', 'F9', 'A10', 'F10', 'A11', 'F11'].forEach((coord) => {
    ws.getCell(coord).font = { bold: true };
  });

  // Table Headers
  const headerRow = 13;
  ws.getCell(`A${headerRow}`).value = 'PRODUCT NAME';
  ws.getCell(`F${headerRow}`).value = 'MATERIAL REQUIREMENT FOR 1 m²';
  ws.getCell(`G${headerRow}`).value = 'UNIT';
  ws.getCell(`H${headerRow}`).value = 'TOTAL PROJECT QTY.';
  ws.getCell(`I${headerRow}`).value = 'UNIT PRICE (AED)';
  ws.getCell(`J${headerRow}`).value = 'TOTAL PRICE (AED)';

  ['A', 'F', 'G', 'H', 'I', 'J'].forEach((col) => {
    const c = ws.getCell(`${col}${headerRow}`);
    c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    c.border = { bottom: { style: 'thin' }, top: { style: 'thin' } };
  });

  let currentRow = 14;
  const startRowBase = currentRow;

  // Render Base Items
  calc.baseItems.forEach((item) => {
    ws.getCell(`A${currentRow}`).value = item.productName;
    ws.getCell(`F${currentRow}`).value = item.factorPerM2;
    ws.getCell(`G${currentRow}`).value = item.unit;
    ws.getCell(`H${currentRow}`).value = { formula: `H10*F${currentRow}`, result: item.totalQuantity };
    ws.getCell(`I${currentRow}`).value = item.unitPriceAed;
    ws.getCell(`J${currentRow}`).value = { formula: `H${currentRow}*I${currentRow}`, result: item.totalPriceAed };

    ws.getCell(`F${currentRow}`).numFmt = '#,##0.0000';
    ws.getCell(`H${currentRow}`).numFmt = '#,##0.000';
    ws.getCell(`I${currentRow}`).numFmt = '#,##0.000';
    ws.getCell(`J${currentRow}`).numFmt = '#,##0.00';
    currentRow++;
  });
  const endRowBase = currentRow - 1;

  // Base Total & Rate/m²
  currentRow++;
  const baseTotalRow = currentRow;
  ws.getCell(`I${baseTotalRow}`).value = 'TOTAL (AED)';
  ws.getCell(`I${baseTotalRow}`).font = { bold: true };
  ws.getCell(`J${baseTotalRow}`).value = { formula: `SUM(J${startRowBase}:J${endRowBase})`, result: calc.baseTotalAed };
  ws.getCell(`J${baseTotalRow}`).font = { bold: true };
  ws.getCell(`J${baseTotalRow}`).numFmt = '#,##0.00';

  currentRow++;
  const baseRateRow = currentRow;
  ws.getCell(`I${baseRateRow}`).value = 'RATE / m²';
  ws.getCell(`I${baseRateRow}`).font = { bold: true };
  ws.getCell(`J${baseRateRow}`).value = { formula: `J${baseTotalRow}/H10`, result: calc.baseRatePerM2 };
  ws.getCell(`J${baseRateRow}`).font = { bold: true };
  ws.getCell(`J${baseRateRow}`).numFmt = '#,##0.00';

  // Render Deflection Section if included
  if (calc.deflectionItems.length > 0) {
    currentRow += 2;
    ws.getCell(`A${currentRow}`).value = 'Head Deflection Components';
    ws.getCell(`A${currentRow}`).font = { bold: true, italic: true };
    currentRow++;
    const startDefRow = currentRow;

    calc.deflectionItems.forEach((item) => {
      ws.getCell(`A${currentRow}`).value = item.productName;
      ws.getCell(`F${currentRow}`).value = item.factorPerM2;
      ws.getCell(`G${currentRow}`).value = item.unit;
      ws.getCell(`H${currentRow}`).value = { formula: `H10*F${currentRow}`, result: item.totalQuantity };
      ws.getCell(`I${currentRow}`).value = item.unitPriceAed;
      ws.getCell(`J${currentRow}`).value = { formula: `H${currentRow}*I${currentRow}`, result: item.totalPriceAed };
      ws.getCell(`F${currentRow}`).numFmt = '#,##0.0000';
      ws.getCell(`H${currentRow}`).numFmt = '#,##0.000';
      ws.getCell(`I${currentRow}`).numFmt = '#,##0.000';
      ws.getCell(`J${currentRow}`).numFmt = '#,##0.00';
      currentRow++;
    });
    const endDefRow = currentRow - 1;

    currentRow++;
    const defTotalRow = currentRow;
    ws.getCell(`I${defTotalRow}`).value = 'DEFLECTION TOTAL (AED)';
    ws.getCell(`I${defTotalRow}`).font = { bold: true };
    ws.getCell(`J${defTotalRow}`).value = { formula: `SUM(J${startDefRow}:J${endDefRow})`, result: calc.deflectionTotalAed };
    ws.getCell(`J${defTotalRow}`).font = { bold: true };
    ws.getCell(`J${defTotalRow}`).numFmt = '#,##0.00';

    currentRow++;
    const grandRow = currentRow;
    ws.getCell(`I${grandRow}`).value = 'GRAND TOTAL (AED)';
    ws.getCell(`I${grandRow}`).font = { bold: true, size: 12 };
    ws.getCell(`J${grandRow}`).value = { formula: `J${baseTotalRow}+J${defTotalRow}`, result: calc.grandTotalAed };
    ws.getCell(`J${grandRow}`).font = { bold: true, size: 12 };
    ws.getCell(`J${grandRow}`).numFmt = '#,##0.00';

    currentRow++;
    const grandRateRow = currentRow;
    ws.getCell(`I${grandRateRow}`).value = 'GRAND RATE / m²';
    ws.getCell(`I${grandRateRow}`).font = { bold: true };
    ws.getCell(`J${grandRateRow}`).value = { formula: `J${grandRow}/H10`, result: calc.grandRatePerM2 };
    ws.getCell(`J${grandRateRow}`).font = { bold: true };
    ws.getCell(`J${grandRateRow}`).numFmt = '#,##0.00';
  }

  // Terms & Conditions
  currentRow += 2;
  ws.getCell(`A${currentRow}`).value = 'Term & Conditions:';
  ws.getCell(`A${currentRow}`).font = { bold: true };
  currentRow++;

  AL_NAMARIQ_TERMS.forEach((term) => {
    ws.getCell(`A${currentRow}`).value = term;
    ws.getCell(`A${currentRow}`).font = { size: 9 };
    currentRow++;
  });

  // Signatures block
  currentRow += 2;
  ws.getCell(`A${currentRow}`).value = 'Prepared by:  _____________________';
  ws.getCell(`F${currentRow}`).value = 'Authorized by: _____________________';
  ws.getCell(`A${currentRow}`).font = { bold: true };
  ws.getCell(`F${currentRow}`).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

