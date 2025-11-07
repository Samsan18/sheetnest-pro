import { DXFData, NestedPart } from "@/types/optimizer";

export interface NestingConfig {
  spacing: number;
  rotationSteps: number[];
  maxIterations: number;
}

export function nestParts(
  dxfFiles: DXFData[],
  sheetWidth: number,
  sheetHeight: number,
  config: NestingConfig = { spacing: 5, rotationSteps: [0], maxIterations: 100 }
): NestedPart[][] {
  const sheets: NestedPart[][] = [];
  const partsToPlace = [...dxfFiles];
  
  // Sort parts by area (largest first) for better packing
  partsToPlace.sort((a, b) => b.totalArea - a.totalArea);
  
  let currentSheet: NestedPart[] = [];
  let fileIndex = 0;
  
  for (const part of partsToPlace) {
    let placed = false;
    
    // Try to place in current sheet
    for (const rotation of config.rotationSteps) {
      const position = findBestPosition(
        part,
        currentSheet,
        sheetWidth,
        sheetHeight,
        rotation,
        config.spacing
      );
      
      if (position) {
        currentSheet.push({
          dxfData: part,
          x: position.x,
          y: position.y,
          rotation,
          fileIndex: fileIndex++
        });
        placed = true;
        break;
      }
    }
    
    // If couldn't place in current sheet, start new sheet
    if (!placed) {
      if (currentSheet.length > 0) {
        sheets.push(currentSheet);
      }
      currentSheet = [];
      
      // Try to place in new sheet
      for (const rotation of config.rotationSteps) {
        const position = findBestPosition(
          part,
          currentSheet,
          sheetWidth,
          sheetHeight,
          rotation,
          config.spacing
        );
        
        if (position) {
          currentSheet.push({
            dxfData: part,
            x: position.x,
            y: position.y,
            rotation,
            fileIndex: fileIndex++
          });
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        console.warn(`Could not place part: ${part.fileName}`);
      }
    }
  }
  
  // Add last sheet if it has parts
  if (currentSheet.length > 0) {
    sheets.push(currentSheet);
  }
  
  return sheets;
}

function findBestPosition(
  part: DXFData,
  placedParts: NestedPart[],
  sheetWidth: number,
  sheetHeight: number,
  rotation: number,
  spacing: number
): { x: number; y: number } | null {
  const partWidth = rotation === 90 || rotation === 270 ? part.height : part.width;
  const partHeight = rotation === 90 || rotation === 270 ? part.width : part.height;
  
  // Try bottom-left placement strategy
  const positions = generatePositions(sheetWidth, sheetHeight, partWidth, partHeight, spacing);
  
  for (const pos of positions) {
    if (canPlaceAt(pos.x, pos.y, partWidth, partHeight, placedParts, sheetWidth, sheetHeight, spacing)) {
      return pos;
    }
  }
  
  return null;
}

function generatePositions(
  sheetWidth: number,
  sheetHeight: number,
  partWidth: number,
  partHeight: number,
  spacing: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const step = 20; // Grid step for position candidates
  
  // Generate grid positions from bottom-left
  for (let y = 0; y <= sheetHeight - partHeight; y += step) {
    for (let x = 0; x <= sheetWidth - partWidth; x += step) {
      positions.push({ x, y });
    }
  }
  
  return positions;
}

function canPlaceAt(
  x: number,
  y: number,
  width: number,
  height: number,
  placedParts: NestedPart[],
  sheetWidth: number,
  sheetHeight: number,
  spacing: number
): boolean {
  // Check sheet boundaries
  if (x < 0 || y < 0 || x + width > sheetWidth || y + height > sheetHeight) {
    return false;
  }
  
  // Check collision with placed parts
  for (const placed of placedParts) {
    const placedWidth = placed.rotation === 90 || placed.rotation === 270 
      ? placed.dxfData.height 
      : placed.dxfData.width;
    const placedHeight = placed.rotation === 90 || placed.rotation === 270 
      ? placed.dxfData.width 
      : placed.dxfData.height;
    
    // Check if rectangles overlap with spacing
    if (
      x < placed.x + placedWidth + spacing &&
      x + width + spacing > placed.x &&
      y < placed.y + placedHeight + spacing &&
      y + height + spacing > placed.y
    ) {
      return false;
    }
  }
  
  return true;
}
