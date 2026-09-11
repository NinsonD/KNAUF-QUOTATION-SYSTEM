import { KnaufSystemDefinition, CalculationResult, CalculatedItem } from './types';

export function calculateQuotation(
  system: KnaufSystemDefinition,
  scaleM2: number,
  unitPrices: Record<string, number>,
  includeDeflection: boolean = false,
  customItems?: { base?: CalculatedItem[]; deflection?: CalculatedItem[] }
): CalculationResult {
  const safeScale = scaleM2 > 0 ? scaleM2 : 1;

  // If custom items are provided from the interactive grid, recalculate based on their factors/quantities & prices
  let baseItems: CalculatedItem[];
  if (customItems?.base && customItems.base.length > 0) {
    baseItems = customItems.base.map((item) => {
      const totalQuantity = Number((safeScale * item.factorPerM2).toFixed(3));
      const unitPriceAed = item.unitPriceAed ?? unitPrices[item.productName] ?? 0;
      const totalPriceAed = Number((totalQuantity * unitPriceAed).toFixed(2));
      return {
        ...item,
        totalQuantity,
        unitPriceAed,
        totalPriceAed,
        isHeadDeflection: false,
      };
    });
  } else {
    baseItems = system.baseMaterials.map((mat) => {
      const totalQuantity = Number((safeScale * mat.factorPerM2).toFixed(3));
      const unitPriceAed = unitPrices[mat.productName] ?? 0;
      const totalPriceAed = Number((totalQuantity * unitPriceAed).toFixed(2));
      return {
        productName: mat.productName,
        factorPerM2: mat.factorPerM2,
        unit: mat.unit,
        totalQuantity,
        unitPriceAed,
        totalPriceAed,
        isHeadDeflection: false,
      };
    });
  }

  const baseTotalAed = Number(
    baseItems.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
  );
  const baseRatePerM2 = Number((baseTotalAed / safeScale).toFixed(2));

  // Head Deflection Items
  let deflectionItems: CalculatedItem[] = [];
  if (includeDeflection && system.supportsDeflection) {
    if (customItems?.deflection && customItems.deflection.length > 0) {
      deflectionItems = customItems.deflection.map((item) => {
        const totalQuantity = Number((safeScale * item.factorPerM2).toFixed(3));
        const unitPriceAed = item.unitPriceAed ?? unitPrices[item.productName] ?? 0;
        const totalPriceAed = Number((totalQuantity * unitPriceAed).toFixed(2));
        return {
          ...item,
          totalQuantity,
          unitPriceAed,
          totalPriceAed,
          isHeadDeflection: true,
        };
      });
    } else if (system.deflectionMaterials) {
      deflectionItems = system.deflectionMaterials.map((mat) => {
        const totalQuantity = Number((safeScale * mat.factorPerM2).toFixed(3));
        const unitPriceAed = unitPrices[mat.productName] ?? 0;
        const totalPriceAed = Number((totalQuantity * unitPriceAed).toFixed(2));
        return {
          productName: mat.productName,
          factorPerM2: mat.factorPerM2,
          unit: mat.unit,
          totalQuantity,
          unitPriceAed,
          totalPriceAed,
          isHeadDeflection: true,
        };
      });
    }
  }

  const deflectionTotalAed = Number(
    deflectionItems.reduce((acc, it) => acc + it.totalPriceAed, 0).toFixed(2)
  );
  const deflectionRatePerM2 = Number((deflectionTotalAed / safeScale).toFixed(2));

  const grandTotalAed = Number((baseTotalAed + deflectionTotalAed).toFixed(2));
  const grandRatePerM2 = Number((grandTotalAed / safeScale).toFixed(2));

  return {
    scaleM2: safeScale,
    baseItems,
    deflectionItems,
    baseTotalAed,
    baseRatePerM2,
    deflectionTotalAed,
    deflectionRatePerM2,
    grandTotalAed,
    grandRatePerM2,
  };
}

