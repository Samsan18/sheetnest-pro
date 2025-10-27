// Industrial-grade nesting algorithm with rotation, kerf, and grain constraints

export interface NestingPart {
  id: string;
  points: { x: number; y: number }[];
  area: number;
  quantity: number;
  rotation: number;
  rotationLimit?: number; // 0 = no rotation, 90 = only 0/90/180/270, 360 = free rotation
  grainDirection?: number; // Angle in degrees for grain/fiber direction
  lockToGrain?: boolean; // Must follow grain direction
  noFlip?: boolean;
  minSpacing?: number; // Minimum spacing around this part
}

export interface SheetDef {
  width: number;
  height: number;
  grainVector?: { angle: number }; // Sheet grain direction
}

export interface NestingConfig {
  kerfWidth: number; // Kerf compensation in mm
  globalClearance: number; // Minimum space between parts
  rotationStep: number; // Degree increment for rotation testing (e.g., 15)
  commonLineCutting: boolean; // Allow parts to share edges
  maxIterations: number;
}

export interface PlacedPart extends NestingPart {
  x: number;
  y: number;
  sheetIndex: number;
}

export interface NestingResult {
  sheets: PlacedPart[][];
  sheetsRequired: number;
  totalPartsPlaced: number;
  totalUsedArea: number;
  totalWasteArea: number;
  usagePercentage: number;
  wastePercentage: number;
  unplacedParts: NestingPart[];
}

// Fast rectangle-based nesting using First Fit Decreasing Height (FFDH) algorithm
export function nestParts(
  parts: NestingPart[],
  sheet: SheetDef,
  config: NestingConfig
): NestingResult {
  const sheets: PlacedPart[][] = [[]];
  const unplaced: NestingPart[] = [];
  
  // Expand all parts by quantity
  const expandedParts: NestingPart[] = [];
  parts.forEach(part => {
    for (let i = 0; i < part.quantity; i++) {
      expandedParts.push({ ...part, id: `${part.id}_${i}` });
    }
  });

  // Sort parts by area (largest first) for better packing
  const sortedParts = [...expandedParts].sort((a, b) => b.area - a.area);

  // Process each part
  for (const part of sortedParts) {
    let placed = false;
    const bounds = getBounds(part.points);
    const partWidth = bounds.maxX - bounds.minX + 2 * config.kerfWidth;
    const partHeight = bounds.maxY - bounds.minY + 2 * config.kerfWidth;

    // Try to place in existing sheets
    for (let sheetIdx = 0; sheetIdx < sheets.length; sheetIdx++) {
      const placement = findPlacementInSheet(
        part,
        sheets[sheetIdx],
        sheet,
        config,
        partWidth,
        partHeight
      );

      if (placement) {
        sheets[sheetIdx].push(placement);
        placed = true;
        break;
      }
    }

    // If not placed, try new sheet
    if (!placed) {
      const placement = findPlacementInSheet(
        part,
        [],
        sheet,
        config,
        partWidth,
        partHeight
      );

      if (placement) {
        sheets.push([placement]);
        placed = true;
      } else {
        unplaced.push(part);
      }
    }
  }

  // Calculate results
  const sheetArea = sheet.width * sheet.height;
  const totalUsedArea = sheets.reduce(
    (sum, sheetParts) =>
      sum + sheetParts.reduce((partSum, p) => partSum + p.area, 0),
    0
  );
  const totalAvailableArea = sheets.length * sheetArea;
  const totalWasteArea = totalAvailableArea - totalUsedArea;

  return {
    sheets,
    sheetsRequired: sheets.length,
    totalPartsPlaced: sheets.reduce((sum, s) => sum + s.length, 0),
    totalUsedArea,
    totalWasteArea,
    usagePercentage: (totalUsedArea / totalAvailableArea) * 100,
    wastePercentage: (totalWasteArea / totalAvailableArea) * 100,
    unplacedParts: unplaced,
  };
}

function findPlacementInSheet(
  part: NestingPart,
  existingParts: PlacedPart[],
  sheet: SheetDef,
  config: NestingConfig,
  partWidth: number,
  partHeight: number
): PlacedPart | null {
  // Try different rotations
  const rotations = getValidRotations(part, config.rotationStep);

  for (const rotation of rotations) {
    // Check grain constraints
    if (part.lockToGrain && sheet.grainVector) {
      const angleDiff = Math.abs(rotation - sheet.grainVector.angle);
      if (angleDiff > 5 && angleDiff < 355) continue; // Allow 5° tolerance
    }

    const rotatedBounds = getRotatedBounds(part.points, rotation);
    const width = rotatedBounds.maxX - rotatedBounds.minX + 2 * config.kerfWidth;
    const height = rotatedBounds.maxY - rotatedBounds.minY + 2 * config.kerfWidth;

    // Try to place using bottom-left heuristic
    for (let x = 0; x <= sheet.width - width; x += Math.max(1, config.rotationStep)) {
      for (let y = 0; y <= sheet.height - height; y += Math.max(1, config.rotationStep)) {
        const candidate: PlacedPart = {
          ...part,
          x,
          y,
          rotation,
          sheetIndex: 0,
        };

        if (isValidPlacement(candidate, existingParts, sheet, config, width, height)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

function getValidRotations(part: NestingPart, rotationStep: number): number[] {
  const rotationLimit = part.rotationLimit ?? 360;
  
  if (rotationLimit === 0) return [0];
  if (rotationLimit === 90) return [0, 90, 180, 270];
  
  const rotations: number[] = [];
  for (let angle = 0; angle < 360; angle += rotationStep) {
    rotations.push(angle);
  }
  return rotations;
}

function isValidPlacement(
  candidate: PlacedPart,
  existing: PlacedPart[],
  sheet: SheetDef,
  config: NestingConfig,
  width: number,
  height: number
): boolean {
  // Check sheet bounds
  if (
    candidate.x < 0 ||
    candidate.y < 0 ||
    candidate.x + width > sheet.width ||
    candidate.y + height > sheet.height
  ) {
    return false;
  }

  // Check collision with existing parts
  for (const other of existing) {
    const otherBounds = getRotatedBounds(other.points, other.rotation);
    const otherWidth = otherBounds.maxX - otherBounds.minX + 2 * config.kerfWidth;
    const otherHeight = otherBounds.maxY - otherBounds.minY + 2 * config.kerfWidth;

    const clearance = Math.max(
      config.globalClearance,
      candidate.minSpacing || 0,
      other.minSpacing || 0
    );

    // Simple rectangle collision with clearance
    const overlap =
      candidate.x < other.x + otherWidth + clearance &&
      candidate.x + width + clearance > other.x &&
      candidate.y < other.y + otherHeight + clearance &&
      candidate.y + height + clearance > other.y;

    if (overlap) return false;
  }

  return true;
}

function getBounds(points: { x: number; y: number }[]) {
  return {
    minX: Math.min(...points.map(p => p.x)),
    maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxY: Math.max(...points.map(p => p.y)),
  };
}

function getRotatedBounds(points: { x: number; y: number }[], angle: number) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotatedPoints = points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));

  return getBounds(rotatedPoints);
}

// Calculate cutting path length (simplified manhattan distance)
export function calculateCuttingPath(sheets: PlacedPart[][]): number {
  let totalDistance = 0;

  sheets.forEach(sheet => {
    if (sheet.length === 0) return;
    
    // Sort by position for path optimization
    const sorted = [...sheet].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 10) return a.x - b.x;
      return a.y - b.y;
    });

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    // Add perimeter of each part
    sorted.forEach(part => {
      for (let i = 0; i < part.points.length; i++) {
        const p1 = part.points[i];
        const p2 = part.points[(i + 1) % part.points.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
    });
  });

  return totalDistance;
}
