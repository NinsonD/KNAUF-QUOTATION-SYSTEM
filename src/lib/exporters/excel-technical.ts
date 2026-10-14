import ExcelJS from 'exceljs';
import { getReferenceModel, type Expression } from '../engine/reference';
import type { CalculationResult, KnaufSystemDefinition } from '../engine/types';
export function addTechnicalCalculations(wb:ExcelJS.Workbook, document:ExcelJS.Worksheet, system:KnaufSystemDefinition, calculation:CalculationResult): Record<string,string> {
 const model=getReferenceModel(system.code,calculation.includeDeflection??calculation.deflectionItems.length>0);
 if(!model)return {};
 const technicalName = document.name === 'Technical Inputs' ? 'Model Inputs' : 'Technical Inputs';
 const technical=wb.addWorksheet(technicalName);technical.columns=[{width:40},{width:22}];
 technical.getCell('A1').value='Technical Inputs';technical.getCell('A1').font={bold:true,size:14};
 const keys=Object.keys(model.cells);const addresses=Object.fromEntries(keys.map((key,index)=>[key,`B${index+3}`]));
 const sheetName=document.name.replaceAll("'","''");
 function excel(expression:Expression):string{
  if(typeof expression==='number')return String(expression);
  if('cell' in expression)return `'Technical Inputs'!$${addresses[expression.cell].replace(/(\D+)(\d+)/,'$1$$$2')}`;
  if(expression.op==='roundDown')return `ROUNDDOWN(${excel(expression.args[0])},${excel(expression.args[1])})`;
  return `(${excel(expression.args[0])}${expression.op}${excel(expression.args[1])})`;
 }
 keys.forEach((key,index)=>{
  const row=index+3;const input=model.inputs.find(input=>input.key===key);const definition=model.cells[key];
  technical.getCell(`A${row}`).value=input?.label??(key===model.areaCell?'Project Area (m²)':`Derived ${key}`);
  technical.getCell(`B${row}`).value=key===model.areaCell?{formula:`'${sheetName}'!$H$10`,result:calculation.scaleM2}:input?(calculation.technicalParameters?.[key]??input.defaultValue):typeof definition==='number'?definition:{formula:excel(definition)};
  technical.getCell(`B${row}`).numFmt='0.000000';
  if(input)technical.getCell(`B${row}`).font={color:{argb:'FF00488E'}};
 });
 return Object.fromEntries([...model.baseMaterials,...model.deflectionMaterials].filter(material=>material.factorExpression).map(material=>[material.productName,excel(material.factorExpression!)]));
}
