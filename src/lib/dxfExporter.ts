import { NestedPart } from "@/types/optimizer";

export function exportNestedLayoutAsDXF(
  sheets: NestedPart[][],
  sheetWidth: number,
  sheetHeight: number,
  fileName: string = "nested_layout"
): void {
  let dxfContent = "";
  
  // DXF Header
  dxfContent += "0\nSECTION\n2\nHEADER\n";
  dxfContent += "9\n$ACADVER\n1\nAC1015\n"; // AutoCAD 2000 format
  dxfContent += "9\n$INSUNITS\n70\n4\n"; // Millimeters
  dxfContent += "0\nENDSEC\n";
  
  // Tables Section
  dxfContent += "0\nSECTION\n2\nTABLES\n";
  dxfContent += "0\nTABLE\n2\nLTYPE\n70\n1\n";
  dxfContent += "0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n";
  dxfContent += "0\nENDTAB\n";
  
  // Layers
  dxfContent += "0\nTABLE\n2\nLAYER\n70\n2\n";
  dxfContent += "0\nLAYER\n2\nSHEET_BORDER\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  dxfContent += "0\nLAYER\n2\nPARTS\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxfContent += "0\nENDTAB\n";
  dxfContent += "0\nENDSEC\n";
  
  // Entities Section
  dxfContent += "0\nSECTION\n2\nENTITIES\n";
  
  sheets.forEach((sheet, sheetIndex) => {
    const offsetX = sheetIndex * (sheetWidth + 100); // Space sheets horizontally
    
    // Draw sheet border
    dxfContent += "0\nLWPOLYLINE\n8\nSHEET_BORDER\n90\n4\n70\n1\n";
    dxfContent += `10\n${offsetX}\n20\n0\n`;
    dxfContent += `10\n${offsetX + sheetWidth}\n20\n0\n`;
    dxfContent += `10\n${offsetX + sheetWidth}\n20\n${sheetHeight}\n`;
    dxfContent += `10\n${offsetX}\n20\n${sheetHeight}\n`;
    
    // Draw each part
    sheet.forEach((part) => {
      const partWidth = part.rotation === 90 || part.rotation === 270 
        ? part.dxfData.height 
        : part.dxfData.width;
      const partHeight = part.rotation === 90 || part.rotation === 270 
        ? part.dxfData.width 
        : part.dxfData.height;
      
      const x = offsetX + part.x;
      const y = part.y;
      
      // Draw part outline as rectangle
      dxfContent += "0\nLWPOLYLINE\n8\nPARTS\n90\n4\n70\n1\n";
      dxfContent += `10\n${x}\n20\n${y}\n`;
      dxfContent += `10\n${x + partWidth}\n20\n${y}\n`;
      dxfContent += `10\n${x + partWidth}\n20\n${y + partHeight}\n`;
      dxfContent += `10\n${x}\n20\n${y + partHeight}\n`;
      
      // Add text label for part
      dxfContent += "0\nTEXT\n8\nPARTS\n";
      dxfContent += `10\n${x + partWidth / 2}\n20\n${y + partHeight / 2}\n40\n5\n`;
      dxfContent += `1\nPart ${part.fileIndex + 1}\n`;
    });
  });
  
  dxfContent += "0\nENDSEC\n";
  dxfContent += "0\nEOF\n";
  
  // Create and download file
  const blob = new Blob([dxfContent], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}_${Date.now()}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
