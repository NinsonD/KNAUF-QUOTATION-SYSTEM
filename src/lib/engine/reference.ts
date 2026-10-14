import referenceModels from '@/data/reference/knauf-models.json';
import type { KnaufSystemDefinition, MaterialRequirement } from './types';

export type Expression = number | { cell: string } | { op: string; args: Expression[] };
export interface TechnicalInput { key: string; label: string; defaultValue: number; }
export interface ReferenceMaterial extends MaterialRequirement { sourceCell: string; factorExpression?: Expression; }
export interface ReferenceModel { sheet: string; areaCell: string; cells: Record<string, Expression>; inputs: TechnicalInput[]; baseMaterials: ReferenceMaterial[]; deflectionMaterials: ReferenceMaterial[]; }
const models = referenceModels as unknown as Record<string, { base: ReferenceModel; head?: ReferenceModel }>;
export function getTechnicalInputs(code: string, includeDeflection: boolean): TechnicalInput[] {
  const model = models[code];
  return (includeDeflection ? model?.head ?? model?.base : model?.base)?.inputs ?? [];
}
export function resolveReferenceSystem(system: KnaufSystemDefinition, area: number, includeDeflection: boolean, parameters: Record<string, number> = {}): KnaufSystemDefinition {
  const variants = models[system.code];
  if (!variants) return system;
  const model = includeDeflection ? variants.head ?? variants.base : variants.base;
  const allowed = new Set(model.inputs.map(input => input.key));
  for (const [key, value] of Object.entries(parameters)) {
    if (!allowed.has(key)) continue;
    if (!Number.isFinite(value) || value <= 0) throw new Error('Technical dimensions and spacing must be greater than zero.');
  }
  const cache: Record<string, number> = { [model.areaCell]: area };
  const evaluate = (expression: Expression): number => {
    if (typeof expression === 'number') return expression;
    if ('cell' in expression) {
      if (cache[expression.cell] !== undefined) return cache[expression.cell];
      const override = allowed.has(expression.cell) ? parameters[expression.cell] : undefined;
      const definition = model.cells[expression.cell];
      if (definition === undefined) throw new Error('Missing reference calculation input.');
      const value = override ?? evaluate(definition);
      cache[expression.cell] = value;
      return value;
    }
    const [left, right] = expression.args.map(evaluate);
    switch (expression.op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': if (right === 0) throw new Error('A technical input cannot be zero.'); return left / right;
      case 'roundDown': return Math.trunc(left * 10 ** right) / 10 ** right;
      default: throw new Error('Unsupported reference calculation.');
    }
  };
  const material = (item: ReferenceMaterial): MaterialRequirement => {
    const factorPerM2 = item.factorExpression ? evaluate(item.factorExpression) : item.factorPerM2;
    if (!Number.isFinite(factorPerM2) || factorPerM2 < 0) throw new Error('Check the technical dimensions; they produce an invalid material quantity.');
    return { productName: item.productName, factorPerM2, unit: item.unit };
  };
  return { ...system, baseMaterials: model.baseMaterials.map(material), deflectionMaterials: model.deflectionMaterials.map(material) };
}

export function getReferenceModel(code: string, includeDeflection: boolean): ReferenceModel | undefined { const variants = models[code]; return includeDeflection ? variants?.head ?? variants?.base : variants?.base; }
