import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Polyline, Text, Group, Line } from "fabric";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Eye, EyeOff } from "lucide-react";
import { PlacedPart } from "@/utils/nestingAlgorithm";

interface InteractiveCanvasProps {
  sheet: PlacedPart[];
  sheetWidth: number;
  sheetHeight: number;
  kerfWidth: number;
  showKerf: boolean;
  showGrain: boolean;
  showLabels: boolean;
}

const InteractiveCanvas = ({
  sheet,
  sheetWidth,
  sheetHeight,
  kerfWidth,
  showKerf,
  showGrain,
  showLabels,
}: InteractiveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Clear canvas
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#f8f9fa";

    // Calculate scale to fit sheet in canvas
    const scaleX = 750 / sheetWidth;
    const scaleY = 550 / sheetHeight;
    const scale = Math.min(scaleX, scaleY) * zoom;

    // Draw sheet boundary
    const sheetRect = new Rect({
      left: 25,
      top: 25,
      width: sheetWidth * scale,
      height: sheetHeight * scale,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      selectable: false,
    });
    fabricCanvas.add(sheetRect);

    // Draw parts
    sheet.forEach((part, idx) => {
      const partGroup: any[] = [];

      // Transform points considering rotation and kerf
      const rotatedPoints = rotatePoints(part.points, part.rotation);
      const scaledPoints = rotatedPoints.map(p => ({
        x: (part.x + p.x) * scale + 25,
        y: (part.y + p.y) * scale + 25,
      }));

      // Draw part outline
      const partPoly = new Polyline(scaledPoints, {
        fill: `hsl(${(idx * 137) % 360}, 70%, 85%)`,
        stroke: `hsl(${(idx * 137) % 360}, 70%, 50%)`,
        strokeWidth: 2,
        selectable: false,
      });
      partGroup.push(partPoly);

      // Draw kerf overlay if enabled
      if (showKerf && kerfWidth > 0) {
        const kerfOutline = scaledPoints.map(p => ({
          x: p.x + kerfWidth * scale,
          y: p.y + kerfWidth * scale,
        }));
        const kerfPoly = new Polyline(kerfOutline, {
          fill: "transparent",
          stroke: "#ff0000",
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
        });
        partGroup.push(kerfPoly);
      }

      // Draw grain arrow if enabled
      if (showGrain && part.grainDirection !== undefined) {
        const centerX = (part.x + sheetWidth / 2) * scale + 25;
        const centerY = (part.y + sheetHeight / 2) * scale + 25;
        const angle = (part.grainDirection * Math.PI) / 180;
        const arrowLength = 30;

        const arrow = new Line(
          [
            centerX,
            centerY,
            centerX + Math.cos(angle) * arrowLength,
            centerY + Math.sin(angle) * arrowLength,
          ],
          {
            stroke: "#0000ff",
            strokeWidth: 2,
            selectable: false,
          }
        );
        partGroup.push(arrow);
      }

      // Draw label if enabled
      if (showLabels) {
        const bounds = getBounds(rotatedPoints);
        const centerX = (part.x + (bounds.maxX + bounds.minX) / 2) * scale + 25;
        const centerY = (part.y + (bounds.maxY + bounds.minY) / 2) * scale + 25;

        const label = new Text(part.id.split("_")[0], {
          left: centerX,
          top: centerY,
          fontSize: 12 * zoom,
          fill: "#000000",
          originX: "center",
          originY: "center",
          selectable: false,
        });
        partGroup.push(label);
      }

      const group = new Group(partGroup, { selectable: false });
      fabricCanvas.add(group);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, sheet, sheetWidth, sheetHeight, zoom, kerfWidth, showKerf, showGrain, showLabels]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleFitView = () => setZoom(1);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleZoomIn} size="sm" variant="outline">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button onClick={handleZoomOut} size="sm" variant="outline">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button onClick={handleFitView} size="sm" variant="outline">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden shadow-lg">
        <canvas ref={canvasRef} />
      </div>

      <div className="text-sm text-muted-foreground">
        Zoom: {(zoom * 100).toFixed(0)}% | Parts: {sheet.length}
      </div>
    </div>
  );
};

function rotatePoints(points: { x: number; y: number }[], angle: number) {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return points.map(p => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));
}

function getBounds(points: { x: number; y: number }[]) {
  return {
    minX: Math.min(...points.map(p => p.x)),
    maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxY: Math.max(...points.map(p => p.y)),
  };
}

export default InteractiveCanvas;
