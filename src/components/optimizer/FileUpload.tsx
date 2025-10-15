import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DXFData } from "@/types/optimizer";
// @ts-ignore - dxf-parser types not available
import DxfParser from "dxf-parser";
import { parseSTEPFile, calculateModelArea, calculateModelBounds } from "@/utils/cadParser";

interface FileUploadProps {
  onFileProcessed: (data: DXFData) => void;
}

const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const [processing, setProcessing] = useState(false);

  const processSTEPFile = useCallback(async (file: File) => {
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const modelData = await parseSTEPFile(arrayBuffer);
      
      if (!modelData.success) {
        throw new Error("Failed to parse STEP file");
      }

      const totalArea = calculateModelArea(modelData);
      const bounds = calculateModelBounds(modelData);

      const dxfData: DXFData = {
        fileName: file.name,
        entities: [],
        totalArea,
        bounds: {
          minX: bounds.minX,
          maxX: bounds.maxX,
          minY: bounds.minY,
          maxY: bounds.maxY,
        },
        is3D: true,
        modelData,
      };

      console.log('=== 3D MODEL PROCESSED ===');
      console.log('File Name:', file.name);
      console.log('Face Count:', modelData.faceCount);
      console.log('Total Surface Area:', totalArea.toFixed(2), 'mm²');
      console.log('Bounds:', bounds);
      console.log('=========================');

      toast.success(`3D model processed! Surface area: ${totalArea.toFixed(2)} mm²`);
      onFileProcessed(dxfData);
    } catch (error) {
      console.error("Error processing 3D model:", error);
      toast.error("Failed to process 3D model file. Please ensure it's a valid STEP file.");
    } finally {
      setProcessing(false);
    }
  }, [onFileProcessed]);

  const processDXFFile = useCallback(async (file: File) => {
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

      const dxfData: DXFData = {
        fileName: file.name,
        entities: processedEntities,
        totalArea,
        bounds: { minX, maxX, minY, maxY }
      };

      console.log('=== DXF FILE PROCESSED ===');
      console.log('File Name:', file.name);
      console.log('Entities Found:', processedEntities.length);
      console.log('Total Area Calculated:', totalArea, 'mm²');
      console.log('Bounds:', { minX, maxX, minY, maxY });
      console.log('=========================');

      toast.success(`DXF file processed successfully! Found ${processedEntities.length} entities with ${totalArea.toFixed(2)} mm² total area.`);
      onFileProcessed(dxfData);
    } catch (error) {
      console.error("Error processing DXF:", error);
      toast.error("Failed to process DXF file. Please ensure it's a valid 2D DXF file.");
    } finally {
      setProcessing(false);
    }
  }, [onFileProcessed]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.dxf')) {
        processDXFFile(file);
      } else if (fileName.endsWith('.step') || fileName.endsWith('.stp')) {
        processSTEPFile(file);
      } else if (fileName.endsWith('.dwg')) {
        toast.error("DWG format detected. Please convert to DXF format for processing.");
      } else if (fileName.endsWith('.iges') || fileName.endsWith('.igs')) {
        toast.error("IGES format coming soon. Please use STEP or DXF format.");
      } else if (fileName.endsWith('.sldprt')) {
        toast.error("SLDPRT format detected. Please export as STEP from SolidWorks.");
      } else if (fileName.endsWith('.x_t')) {
        toast.error("Parasolid format detected. Please convert to STEP format.");
      } else if (fileName.endsWith('.pdf')) {
        toast.error("PDF format detected. Please convert to DXF format for processing.");
      } else {
        toast.error("Unsupported file format. Please upload DXF or STEP files.");
      }
    }
  }, [processDXFFile, processSTEPFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/dxf': ['.dxf'],
      'application/dwg': ['.dwg'],
      'application/step': ['.step', '.stp'],
      'application/iges': ['.iges', '.igs'],
      'application/pdf': ['.pdf'],
      'application/octet-stream': ['.sldprt', '.x_t']
    },
    multiple: false
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Upload CAD File</h2>
        <p className="text-muted-foreground">
          Upload your CAD file to begin optimization
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
                  {isDragActive ? 'Drop CAD file here' : 'Drag & drop CAD file'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>3D CAD: .step, .stp, .x_t, .iges, .igs, .sldprt</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>2D Drawing: .dwg, .dxf, .pdf</span>
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
              <li>• <strong>2D Files:</strong> DXF format (R12 or newer) - polylines and circles</li>
              <li>• <strong>3D Files:</strong> STEP format (.step, .stp) - fully supported</li>
              <li>• Other formats require conversion to DXF or STEP</li>
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
