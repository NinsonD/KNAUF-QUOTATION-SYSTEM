import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import systemsData from '../src/data/knauf-systems.json';
import scenarios from './workbook-scenarios.json';
import { calculateQuotation } from '../src/lib/engine/calculator';
import { getTechnicalInputs } from '../src/lib/engine/reference';
import { generateAlNamariqExcel } from '../src/lib/exporters/excel-generator';
import { generateAlNamariqPDF } from '../src/lib/exporters/pdf-generator';
import type { KnaufSystemDefinition } from '../src/lib/engine/types';
const systems=systemsData as KnaufSystemDefinition[];
function near(actual:number,expected:number,label:string){assert.ok(Math.abs(actual-expected)<=1e-8*Math.max(1,Math.abs(expected)),`${label}: ${actual} != ${expected}`);}
async function main(){
 let lines=0;
 for(const scenario of scenarios){
  const system=systems.find(s=>s.code===scenario.systemCode)!;
  const prices=Object.fromEntries(scenario.items.map(item=>[item.name,12.3456]));
  const calc=calculateQuotation(system,scenario.area,prices,scenario.includeDeflection);
  const items=[...calc.baseItems,...calc.deflectionItems];assert.equal(items.length,scenario.items.length,scenario.sheet);
  scenario.items.forEach((expected,index)=>{const actual=items[index];assert.equal(actual.productName,expected.name);assert.equal(actual.unit,expected.unit);assert.equal(actual.isHeadDeflection,expected.head);near(actual.factorPerM2,expected.factor,`${scenario.sheet} factor`);near(actual.totalQuantity,scenario.area*expected.factor,`${scenario.sheet} quantity`);near(actual.totalPriceAed,scenario.area*expected.factor*12.3456,`${scenario.sheet} cost`);lines++;});
  const total=scenario.items.reduce((sum,item)=>sum+scenario.area*item.factor*12.3456,0);near(calc.grandTotalAed,total,'Grand total includes all rows, including insulation');near(calc.grandRatePerM2,total/scenario.area,'Rate denominator is area');
 }
 const kw=systems.find(s=>s.code==='KW111')!;
 const technical=getTechnicalInputs('KW111',false);const height=technical.find(input=>input.label.includes('Height'))!.key;const spacing=technical.find(input=>input.label.includes('Spacing'))!.key;
 const changed=calculateQuotation(kw,100,{},false,undefined,{[height]:4,[spacing]:0.4});near(changed.baseItems.find(i=>i.productName.includes('CW '))!.totalQuantity,258,'Height/spacing changes');
 const ceiling=systems.find(s=>s.code==='KC_B001')!;const furring=getTechnicalInputs(ceiling.code,false).find(i=>i.label.includes('Furring'))!.key;near(calculateQuotation(ceiling,100,{},false,undefined,{[furring]:0.5}).baseItems.find(i=>i.productName.includes('Furring'))!.totalQuantity,200,'Ceiling spacing');
 for(const area of [0,-1,NaN,Infinity])assert.throws(()=>calculateQuotation(kw,area,{}));
 const prices=Object.fromEntries(scenarios.find(s=>s.systemCode==='KW111'&&s.includeDeflection)!.items.map(item=>[item.name,12.3456]));
 const calc=calculateQuotation(kw,250.75,prices,true);
 const edited=calc.baseItems.map(item=>({...item,unitPriceAed:2}));
 const resized=calculateQuotation(kw,1000,{},true,{base:edited,deflection:calc.deflectionItems});near(resized.baseItems.find(i=>i.productName.includes('CW '))!.totalQuantity,1672.6666666666667,'Rates do not freeze geometry');
 assert.equal(calculateQuotation(kw,100,{},true,{base:[],deflection:[]}).grandTotalAed,0);
 const meta={quoteNumber:'ANM/2026/459',projectName:'Workbook regression',clientName:'Verification',salesman:'Estimator',date:'14/10/2026'};
 const buffer=await generateAlNamariqExcel(meta,kw,calc);const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer as never);assert.equal(wb.worksheets.length,2);assert.ok(wb.worksheets[0].name.includes('_'));let formulaRows=0;
 wb.worksheets[0].eachRow(row=>{const amount=row.getCell(10).value;if(amount&&typeof amount==='object'&&'formula' in amount&&typeof row.getCell(9).value==='number'){const qty=row.getCell(8).value as ExcelJS.CellFormulaValue;near(Number(amount.result),Number(qty.result)*Number(row.getCell(9).value),'Excel cached amount');formulaRows++;}});
 assert.ok(formulaRows>=14);assert.ok(wb.worksheets[0].getCell('F15').formula?.includes('Technical Inputs'));
 mkdirSync('tmp',{recursive:true});
 writeFileSync('tmp/workbook-corrected.xlsx',buffer);writeFileSync('tmp/workbook-corrected.pdf',await generateAlNamariqPDF(meta,kw,calc));
 console.log(`${scenarios.length} workbook scenarios and ${lines} material rows match the independently evaluated source. Geometry, pricing, validation, and export regressions passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
