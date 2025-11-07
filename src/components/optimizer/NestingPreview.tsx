import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { NestedPart } from "@/types/optimizer";

interface NestingPreviewProps {
  sheets: NestedPart[][];
  sheetWidth: number;
  sheetHeight: number;
  currentSheet: number;
}

const NestingPreview = ({ sheets, sheetWidth, sheetHeight, currentSheet }: NestingPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || sheets.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply zoom and pan
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Calculate scale to fit sheet in canvas
    const padding = 40;
    const scaleX = (canvas.width - padding * 2) / sheetWidth;
    const scaleY = (canvas.height - padding * 2) / sheetHeight;
    const scale = Math.min(scaleX, scaleY);

    ctx.translate(padding, padding);
    ctx.scale(scale, scale);

    // Draw sheet background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, sheetWidth, sheetHeight);

    // Draw sheet border
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 3 / scale;
    ctx.strokeRect(0, 0, sheetWidth, sheetHeight);

    // Draw nested parts
    const currentParts = sheets[currentSheet] || [];
    const colors = [
      "#1e3a8a", "#7c3aed", "#db2777", "#ea580c", "#ca8a04",
      "#0891b2", "#0f766e", "#4338ca", "#be123c", "#c2410c"
    ];

    currentParts.forEach((part, index) => {
      const partWidth = part.rotation === 90 || part.rotation === 270 
        ? part.dxfData.height 
        : part.dxfData.width;
      const partHeight = part.rotation === 90 || part.rotation === 270 
        ? part.dxfData.width 
        : part.dxfData.height;

      // Draw part rectangle
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(part.x, part.y, partWidth, partHeight);

      // Draw part border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(part.x, part.y, partWidth, partHeight);

      // Draw part label
      ctx.fillStyle = "#ffffff";
      ctx.font = `${16 / scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelText = `${index + 1}`;
      ctx.fillText(labelText, part.x + partWidth / 2, part.y + partHeight / 2);
    });

    ctx.restore();
  }, [sheets, sheetWidth, sheetHeight, currentSheet, zoom, pan]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Sheet {currentSheet + 1} of {sheets.length}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitView}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full border border-border rounded-lg bg-background"
      />
      <div className="text-sm text-muted-foreground text-center">
        {sheets[currentSheet]?.length || 0} parts nested on this sheet
      </div>
    </Card>
  );
};

export default NestingPreview;
