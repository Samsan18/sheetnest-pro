import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { DXFData } from "@/types/optimizer";
import Model3DViewer from "./Model3DViewer";

interface DXFViewerProps {
  data: DXFData;
}

const DXFViewer = ({ data }: DXFViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // If it's a 3D model, render the 3D viewer instead
  if (data.is3D && data.modelData) {
    return <Model3DViewer modelData={data.modelData} fileName={data.fileName} />;
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling to fit all entities
    const { minX, maxX, minY, maxY } = data.bounds;
    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 50;
    const scaleX = (canvas.width - padding * 2) / width;
    const scaleY = (canvas.height - padding * 2) / height;
    const scale = Math.min(scaleX, scaleY) * zoom;

    // Center the drawing
    const offsetX = (canvas.width - width * scale) / 2 - minX * scale + pan.x;
    const offsetY = (canvas.height - height * scale) / 2 - minY * scale + pan.y;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw entities
    data.entities.forEach(entity => {
      if (entity.type === 'CIRCLE' && entity.center && entity.radius) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          entity.center.x * scale + offsetX,
          canvas.height - (entity.center.y * scale + offsetY),
          entity.radius * scale,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (entity.points && entity.points.length > 1) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          entity.points[0].x * scale + offsetX,
          canvas.height - (entity.points[0].y * scale + offsetY)
        );
        for (let i = 1; i < entity.points.length; i++) {
          ctx.lineTo(
            entity.points[i].x * scale + offsetX,
            canvas.height - (entity.points[i].y * scale + offsetY)
          );
        }
        if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
          ctx.closePath();
        }
        ctx.stroke();
      }
    });

  }, [data, zoom, pan]);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.5));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">DXF Preview</h3>
          <p className="text-sm text-muted-foreground">{data.fileName}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleFitView}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="border border-border rounded-lg overflow-hidden bg-secondary">
        <canvas 
          ref={canvasRef} 
          className="w-full h-[500px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Entities:</span>
          <span className="font-semibold ml-2">{data.entities.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Area:</span>
          <span className="font-semibold ml-2">{data.totalArea.toFixed(2)} mm²</span>
        </div>
      </div>
    </Card>
  );
};

export default DXFViewer;
