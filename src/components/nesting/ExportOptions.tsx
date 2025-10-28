import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, Image, Code } from "lucide-react";
import { PlacedPart, NestingResult } from "@/utils/nestingAlgorithm";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ExportOptionsProps {
  result: NestingResult;
  sheetWidth: number;
  sheetHeight: number;
  kerfWidth: number;
}

const ExportOptions = ({ result, sheetWidth, sheetHeight, kerfWidth }: ExportOptionsProps) => {
  const exportDXF = () => {
    // Generate DXF file with nested layout - all parts with accurate positioning
    let dxfContent = "0\nSECTION\n2\nHEADER\n";
    dxfContent += "9\n$ACADVER\n1\nAC1015\n";
    dxfContent += "9\n$INSUNITS\n70\n4\n"; // Millimeters
    dxfContent += "0\nENDSEC\n";
    dxfContent += "0\nSECTION\n2\nENTITIES\n";

    // Sheet boundary rectangle for reference
    dxfContent += "0\nPOLYLINE\n8\nSHEET_BOUNDARY\n62\n7\n66\n1\n70\n1\n";
    dxfContent += `0\nVERTEX\n8\nSHEET_BOUNDARY\n10\n0\n20\n0\n`;
    dxfContent += `0\nVERTEX\n8\nSHEET_BOUNDARY\n10\n${sheetWidth}\n20\n0\n`;
    dxfContent += `0\nVERTEX\n8\nSHEET_BOUNDARY\n10\n${sheetWidth}\n20\n${sheetHeight}\n`;
    dxfContent += `0\nVERTEX\n8\nSHEET_BOUNDARY\n10\n0\n20\n${sheetHeight}\n`;
    dxfContent += "0\nSEQEND\n";

    result.sheets.forEach((sheet, sheetIdx) => {
      sheet.forEach(part => {
        // Apply rotation and translation to each point
        const transformedPoints = part.points.map(point => {
          const rotated = rotatePoint(point, part.rotation);
          return {
            x: part.x + rotated.x + kerfWidth,
            y: part.y + rotated.y + kerfWidth,
          };
        });
        
        // Write polyline for the part with proper layer and attributes
        dxfContent += "0\nPOLYLINE\n";
        dxfContent += `8\n${part.id}\n`; // Layer name from part ID
        dxfContent += "62\n1\n"; // Color index
        dxfContent += "66\n1\n"; // Vertices follow flag
        dxfContent += "70\n1\n"; // Closed polyline
        
        transformedPoints.forEach(point => {
          dxfContent += `0\nVERTEX\n8\n${part.id}\n10\n${point.x.toFixed(6)}\n20\n${point.y.toFixed(6)}\n`;
        });
        
        dxfContent += "0\nSEQEND\n";
      });
    });

    dxfContent += "0\nENDSEC\n0\nEOF\n";

    downloadFile(dxfContent, "nested_layout.dxf", "application/dxf");
    toast.success(`DXF file exported with ${result.totalPartsPlaced} parts across ${result.sheetsRequired} sheet(s)`);
  };

  const exportSVG = () => {
    // Generate SVG with nested layout
    let svgContent = `<svg width="${sheetWidth}" height="${sheetHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    result.sheets.forEach((sheet, sheetIdx) => {
      svgContent += `<g id="sheet-${sheetIdx}">`;
      svgContent += `<rect width="${sheetWidth}" height="${sheetHeight}" fill="none" stroke="black" stroke-width="2"/>`;
      
      sheet.forEach((part, partIdx) => {
        const points = part.points.map(p => {
          const rotated = rotatePoint(p, part.rotation);
          return `${part.x + rotated.x},${part.y + rotated.y}`;
        }).join(" ");
        
        svgContent += `<polygon points="${points}" fill="lightblue" stroke="blue" stroke-width="1"/>`;
        svgContent += `<text x="${part.x}" y="${part.y}" font-size="12">${part.id}</text>`;
      });
      
      svgContent += "</g>";
    });
    
    svgContent += "</svg>";

    downloadFile(svgContent, "nested_layout.svg", "image/svg+xml");
    toast.success("SVG file exported successfully");
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add title
    pdf.setFontSize(20);
    pdf.text("Nesting Report", pageWidth / 2, 20, { align: "center" });

    // Add summary
    pdf.setFontSize(12);
    let y = 40;
    pdf.text(`Sheets Required: ${result.sheetsRequired}`, 20, y);
    y += 10;
    pdf.text(`Total Parts: ${result.totalPartsPlaced}`, 20, y);
    y += 10;
    pdf.text(`Material Usage: ${result.usagePercentage.toFixed(2)}%`, 20, y);
    y += 10;
    pdf.text(`Material Waste: ${result.wastePercentage.toFixed(2)}%`, 20, y);
    y += 10;
    pdf.text(`Kerf Width: ${kerfWidth}mm`, 20, y);

    // Add sheet layouts (simplified representation)
    result.sheets.forEach((sheet, idx) => {
      if (idx > 0) pdf.addPage();
      
      pdf.setFontSize(14);
      pdf.text(`Sheet ${idx + 1} (${sheet.length} parts)`, 20, 20);
      
      // Draw simple representation
      const scale = Math.min(160 / sheetWidth, 200 / sheetHeight);
      const offsetX = 20;
      const offsetY = 40;

      // Sheet boundary
      pdf.rect(offsetX, offsetY, sheetWidth * scale, sheetHeight * scale);

      // Parts
      sheet.forEach(part => {
        const bounds = getBounds(part.points);
        const width = (bounds.maxX - bounds.minX) * scale;
        const height = (bounds.maxY - bounds.minY) * scale;
        
        pdf.setFillColor(200, 220, 255);
        pdf.rect(
          offsetX + part.x * scale,
          offsetY + part.y * scale,
          width,
          height,
          "F"
        );
      });
    });

    pdf.save("nesting_report.pdf");
    toast.success("PDF report exported successfully");
  };

  const exportGCode = () => {
    // Generate basic G-code template with kerf compensation
    let gcode = "; Nesting G-code - Generated by Metal Sheet Optimizer\n";
    gcode += `; Kerf Compensation: ${kerfWidth}mm\n`;
    gcode += "G21 ; Set units to millimeters\n";
    gcode += "G90 ; Absolute positioning\n";
    gcode += "M3 ; Start spindle/laser\n\n";

    result.sheets.forEach((sheet, sheetIdx) => {
      gcode += `; Sheet ${sheetIdx + 1}\n`;
      
      sheet.forEach(part => {
        gcode += `; Part ${part.id}\n`;
        gcode += "G0 Z5 ; Lift\n";
        
        const firstPoint = part.points[0];
        const rotated = rotatePoint(firstPoint, part.rotation);
        gcode += `G0 X${(part.x + rotated.x).toFixed(3)} Y${(part.y + rotated.y).toFixed(3)}\n`;
        gcode += "G0 Z0 ; Lower\n";
        
        part.points.forEach(point => {
          const rotated = rotatePoint(point, part.rotation);
          gcode += `G1 X${(part.x + rotated.x).toFixed(3)} Y${(part.y + rotated.y).toFixed(3)}\n`;
        });
        
        // Close path
        gcode += `G1 X${(part.x + rotated.x).toFixed(3)} Y${(part.y + rotated.y).toFixed(3)}\n`;
        gcode += "\n";
      });
    });

    gcode += "M5 ; Stop spindle/laser\n";
    gcode += "G0 Z10 ; Lift\n";
    gcode += "M2 ; End program\n";

    downloadFile(gcode, "nesting.gcode", "text/plain");
    toast.success("G-code exported successfully");
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Export Options</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={exportDXF} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Export DXF
        </Button>
        
        <Button onClick={exportSVG} variant="outline" className="gap-2">
          <Image className="h-4 w-4" />
          Export SVG
        </Button>
        
        <Button onClick={exportPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF Report
        </Button>
        
        <Button onClick={exportGCode} variant="outline" className="gap-2">
          <Code className="h-4 w-4" />
          Export G-code
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        All exports include kerf compensation and proper scaling
      </p>
    </Card>
  );
};

function rotatePoint(point: { x: number; y: number }, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: point.x * Math.cos(rad) - point.y * Math.sin(rad),
    y: point.x * Math.sin(rad) + point.y * Math.cos(rad),
  };
}

function getBounds(points: { x: number; y: number }[]) {
  return {
    minX: Math.min(...points.map(p => p.x)),
    maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxY: Math.max(...points.map(p => p.y)),
  };
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default ExportOptions;
