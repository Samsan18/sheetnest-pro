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
}

export interface DXFEntity {
  type: string;
  points?: { x: number; y: number }[];
  center?: { x: number; y: number };
  radius?: number;
  area?: number;
}

export interface SheetSize {
  width: number;
  height: number;
  name?: string;
}

export interface CalculationResults {
  sheetArea: number;
  totalPartArea: number;
  usagePercentage: number;
  wastePercentage: number;
  sheetsRequired: number;
}
