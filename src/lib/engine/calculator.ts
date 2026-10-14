import { KnaufSystemDefinition, CalculationResult, CalculatedItem } from './types';
import { resolveReferenceSystem } from './reference';

export function calculateQuotation(
  system: KnaufSystemDefinition,
  scaleM2: number,
  unitPrices: Record<string, number>,
  includeDeflection = false,
  customItems?: { base?: CalculatedItem[]; deflection?: CalculatedItem[] },
  technicalParameters: Record<string, number> = {},
): CalculationResult {
  if (!Number.isFinite(scaleM2) || scaleM2 <= 0) throw new Error('Area must be greater than zero.');
  const resolved = resolveReferenceSystem(system, scaleM2, includeDeflection, technicalParameters);
  const calculateItems = (section: 'base' | 'deflection'): CalculatedItem[] => {
    const head = section === 'deflection';
    const definitions = head ? resolved.deflectionMaterials ?? [] : resolved.baseMaterials;
    return (customItems?.[section] ?? definitions).map(item => {
      const reference = definitions.find(definition => definition.productName === item.productName);
      const factor = 'factorOverridden' in item && item.factorOverridden === false && reference ? reference.factorPerM2 : item.factorPerM2;
      const price = 'unitPriceAed' in item ? Number(item.unitPriceAed) : unitPrices[item.productName] ?? 0;
      if (!item.productName.trim() || !Number.isFinite(item.factorPerM2) || item.factorPerM2 < 0 || !Number.isFinite(price) || price < 0) {
        throw new Error('Material factors and rates must be valid non-negative numbers.');
      }
      // Excel's display formats do not round its stored quantities or line amounts.
      const totalQuantity = scaleM2 * factor;
      return { ...item, factorPerM2: factor, factorOverridden: 'factorOverridden' in item ? Boolean(item.factorOverridden) : false, totalQuantity, unitPriceAed: price, totalPriceAed: totalQuantity * price, isHeadDeflection: head };
    });
  };
  const baseItems = calculateItems('base');
  const deflectionItems = includeDeflection && system.supportsDeflection ? calculateItems('deflection') : [];
  const baseTotalAed = baseItems.reduce((sum, item) => sum + item.totalPriceAed, 0);
  const deflectionTotalAed = deflectionItems.reduce((sum, item) => sum + item.totalPriceAed, 0);
  const grandTotalAed = baseTotalAed + deflectionTotalAed;
  return { technicalParameters, includeDeflection, scaleM2, baseItems, deflectionItems, baseTotalAed, baseRatePerM2: baseTotalAed / scaleM2, deflectionTotalAed, deflectionRatePerM2: deflectionTotalAed / scaleM2, grandTotalAed, grandRatePerM2: grandTotalAed / scaleM2 };
}

export function emptyCalculation(): CalculationResult {
  return { scaleM2: 0, baseItems: [], deflectionItems: [], baseTotalAed: 0, baseRatePerM2: 0, deflectionTotalAed: 0, deflectionRatePerM2: 0, grandTotalAed: 0, grandRatePerM2: 0 };
}
