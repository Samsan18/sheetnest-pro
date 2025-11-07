import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DXFData } from "@/types/optimizer";
// @ts-ignore - dxf-parser types not available
import DxfParser from "dxf-parser";

interface FileUploadProps {
  onFilesProcessed: (data: DXFData[]) => void;
}

const FileUpload = ({ onFilesProcessed }: FileUploadProps) => {
  const [processing, setProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<DXFData[]>([]);

  const processDXFFile = useCallback(async (file: File): Promise<DXFData | null> => {
    setProcessing(true);
    try {
      const text = await file.text();
      const parser = new DxfParser();
      const dxf = parser.parseSync(text);

      if (!dxf) {
        throw new Error("Failed to parse DXF file");
      }

      // Extract entities and calculate areas
      const entities = dxf.entities || [];
      let totalArea = 0;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      const processedEntities = entities.map((entity: any) => {
        const processed: any = { type: entity.type };

        // Update bounds
        const updateBounds = (x: number, y: number) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        };

        // Process different entity types
        if (entity.type === 'CIRCLE') {
          processed.center = { x: entity.center.x, y: entity.center.y };
          processed.radius = entity.radius;
          processed.area = Math.PI * entity.radius * entity.radius;
          totalArea += processed.area;
          updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
          updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
        } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
          processed.points = entity.vertices.map((v: any) => ({ x: v.x, y: v.y }));
          // Simple polygon area calculation (Shoelace formula)
          if (processed.points.length > 2) {
            let area = 0;
            for (let i = 0; i < processed.points.length; i++) {
              const j = (i + 1) % processed.points.length;
              area += processed.points[i].x * processed.points[j].y;
              area -= processed.points[j].x * processed.points[i].y;
              updateBounds(processed.points[i].x, processed.points[i].y);
            }
            processed.area = Math.abs(area / 2);
            totalArea += processed.area;
          }
        } else if (entity.type === 'LINE') {
          processed.points = [
            { x: entity.vertices[0].x, y: entity.vertices[0].y },
            { x: entity.vertices[1].x, y: entity.vertices[1].y }
          ];
          processed.points.forEach((p: any) => updateBounds(p.x, p.y));
        }

        return processed;
      });

      const width = maxX - minX;
      const height = maxY - minY;

      const dxfData: DXFData = {
        fileName: file.name,
        entities: processedEntities,
        totalArea,
        bounds: { minX, maxX, minY, maxY },
        width,
        height
      };

      console.log('=== DXF FILE PROCESSED ===');
      console.log('File Name:', file.name);
      console.log('Dimensions:', width, 'x', height, 'mm');
      console.log('Entities Found:', processedEntities.length);
      console.log('Total Area Calculated:', totalArea, 'mm²');
      console.log('=========================');

      return dxfData;
    } catch (error) {
      console.error("Error processing DXF:", error);
      toast.error(`Failed to process ${file.name}`);
      return null;
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setProcessing(true);
    const results: DXFData[] = [];
    
    for (const file of acceptedFiles) {
      if (file.name.toLowerCase().endsWith('.dxf')) {
        const result = await processDXFFile(file);
        if (result) results.push(result);
      } else {
        toast.error(`${file.name} is not a .dxf file`);
      }
    }
    
    setProcessing(false);
    
    if (results.length > 0) {
      setProcessedFiles(results);
      toast.success(`Successfully processed ${results.length} DXF file(s)`);
      onFilesProcessed(results);
    }
  }, [processDXFFile, onFilesProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/dxf': ['.dxf'] },
    multiple: true,
    maxFiles: 10
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Upload DXF File</h2>
        <p className="text-muted-foreground">
          Upload your 2D DXF CAD file to begin optimization
        </p>
      </div>

      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        } ${processing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {processing ? (
            <>
              <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium">Processing DXF file...</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive ? 'Drop DXF file here' : 'Drag & drop DXF file'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Supports .dxf format (up to 10 files)</span>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="bg-card/50 border-border p-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold">File Requirements</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 2D DXF format (R12 or newer)</li>
              <li>• Closed polylines and circles supported</li>
              <li>• Maximum file size: 50MB</li>
              <li>• Clean geometry recommended for accurate calculations</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FileUpload;
