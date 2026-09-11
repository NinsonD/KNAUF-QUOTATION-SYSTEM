export type SystemCategory = 'CEILING' | 'PARTITION' | 'SHAFT_WALL' | 'WALL_LINING';

export type QuoteStatus = 'DRAFT' | 'ISSUED' | 'APPROVED' | 'REVISED' | 'CANCELLED';

export interface MaterialRequirement {
  productName: string;
  factorPerM2: number;
  unit: string;
  isHeadDeflection?: boolean;
}

export interface KnaufSystemDefinition {
  code: string;
  name: string;
  category: SystemCategory;
  description?: string;
  supportsDeflection: boolean;
  baseMaterials: MaterialRequirement[];
  deflectionMaterials?: MaterialRequirement[];
}

export interface CalculatedItem {
  id?: string;
  productName: string;
  factorPerM2: number;
  unit: string;
  totalQuantity: number;
  unitPriceAed: number;
  totalPriceAed: number;
  isHeadDeflection: boolean;
}

export interface CalculationResult {
  scaleM2: number;
  baseItems: CalculatedItem[];
  deflectionItems: CalculatedItem[];
  baseTotalAed: number;
  baseRatePerM2: number;
  deflectionTotalAed: number;
  deflectionRatePerM2: number;
  grandTotalAed: number;
  grandRatePerM2: number;
}

export interface QuoteMetaData {
  id?: string;
  quoteNumber: string;
  projectName: string;
  clientName: string;
  salesman: string;
  date: string;
  status?: QuoteStatus;
}

export interface StoredQuotation {
  id: string;
  quoteNumber: string;
  projectName: string;
  clientName: string;
  salesman: string;
  scaleM2: number;
  systemCode: string;
  systemName: string;
  category: SystemCategory;
  includeDeflection: boolean;
  baseTotalAed: number;
  baseRatePerM2: number;
  deflectionTotalAed: number;
  deflectionRatePerM2: number;
  grandTotalAed: number;
  grandRatePerM2: number;
  status: QuoteStatus;
  items: CalculatedItem[];
  termsAndConditions: string[];
  createdAt: string;
  updatedAt: string;
}

