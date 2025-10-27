export interface DXFData {
  fileName: string;
  entities: DXFEntity[];
  totalArea: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  is3D?: boolean;
  modelData?: any; // 3D model data from STEP/IGES files
  validationIssues?: string[]; // Real-time validation feedback
}

export interface DXFEntity {
  type: string;
  points?: { x: number; y: number }[];
  center?: { x: number; y: number };
  radius?: number;
  area?: number;
}

export type Unit = 'mm' | 'cm' | 'inch' | 'ft' | 'm';

export type MaterialType = 
  | 'Mild Steel' 
  | 'Stainless Steel 304' 
  | 'Stainless Steel 316' 
  | 'Aluminum 5052' 
  | 'Aluminum 6061' 
  | 'Copper' 
  | 'Brass'
  | 'Galvanized Steel'
  | 'Cold Rolled Steel'
  | 'Hot Rolled Steel';

export interface SheetSize {
  width: number;
  height: number;
  name?: string;
  quantity?: number;
  unit?: Unit;
  material?: MaterialType;
  thickness?: number;
  costPerSheet?: number;
}

export interface CalculationResults {
  sheetArea: number;
  totalPartArea: number;
  usagePercentage: number;
  wastePercentage: number;
  sheetsRequired: number;
  totalCost?: number;
  costPerPart?: number;
  wasteArea: number;
}
