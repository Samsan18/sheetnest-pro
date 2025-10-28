import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DXFData, DXFPart } from "@/types/optimizer";
// @ts-ignore - dxf-parser types not available
import DxfParser from "dxf-parser";
import { parse3DFile, calculateModelArea, calculateModelBounds } from "@/utils/cadParser";

interface FileUploadProps {
  onFilesProcessed: (data: DXFData[]) => void;
}

const FileUpload = ({ onFilesProcessed }: FileUploadProps) => {
  const [processing, setProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<DXFData[]>([]);

  const process3DFile = useCallback(async (file: File) => {
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const modelData = await parse3DFile(arrayBuffer, file.name);
      
      if (!modelData.success) {
        throw new Error("Failed to parse 3D CAD file");
      }

      const totalArea = calculateModelArea(modelData);
      const bounds = calculateModelBounds(modelData);

      // Validate 3D model data
      const validationIssues: string[] = [];
      
      if (modelData.faceCount === 0) {
        validationIssues.push("No faces detected in 3D model");
      }
      
      if (totalArea === 0) {
        validationIssues.push("Surface area calculated as 0 mm² - file may be empty or have invalid geometry");
      }
      
      if (modelData.meshes.length === 0) {
        validationIssues.push("No mesh data found in 3D model");
      }

      const dxfData: DXFData = {
        fileName: file.name,
        entities: [],
        parts: [], // 3D files don't have 2D parts
        totalArea,
        bounds: {
          minX: bounds.minX,
          maxX: bounds.maxX,
          minY: bounds.minY,
          maxY: bounds.maxY,
        },
        is3D: true,
        modelData,
        validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
      };

      console.log('=== 3D MODEL PROCESSED ===');
      console.log('File Name:', file.name);
      console.log('Face Count:', modelData.faceCount);
      console.log('Total Surface Area:', totalArea.toFixed(2), 'mm²');
      console.log('Bounds:', bounds);
      console.log('Validation Issues:', validationIssues);
      console.log('=========================');

      if (validationIssues.length > 0) {
        toast.error(`File processed with issues: ${validationIssues.join(', ')}`);
      } else {
        toast.success(`3D model processed! Surface area: ${totalArea.toFixed(2)} mm²`);
      }
      
      return dxfData;
    } catch (error) {
      console.error("Error processing 3D model:", error);
      toast.error("Failed to process 3D CAD file. Please check the file format and try again.");
      return null;
    }
  }, []);

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
      const extractedParts: DXFPart[] = [];
      let partCounter = 0;

      const processedEntities = entities.map((entity: any) => {
        const processed: any = { type: entity.type };

        // Update bounds
        const updateBounds = (x: number, y: number) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        };

        // Process different entity types and extract closed shapes as parts
        if (entity.type === 'CIRCLE') {
          processed.center = { x: entity.center.x, y: entity.center.y };
          processed.radius = entity.radius;
          processed.area = Math.PI * entity.radius * entity.radius;
          totalArea += processed.area;
          updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
          updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
          
          // Create circle points (approximate as polygon)
          const circlePoints: { x: number; y: number }[] = [];
          const segments = 32;
          for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            circlePoints.push({
              x: entity.center.x + entity.radius * Math.cos(angle),
              y: entity.center.y + entity.radius * Math.sin(angle),
            });
          }
          
          extractedParts.push({
            id: `${file.name.replace(/\.[^/.]+$/, "")}_part${partCounter++}`,
            points: circlePoints,
            area: processed.area,
            fileName: file.name,
            entityType: 'CIRCLE',
          });
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
            
            // Only add as part if it's a closed shape with area
            if (processed.area > 0) {
              extractedParts.push({
                id: `${file.name.replace(/\.[^/.]+$/, "")}_part${partCounter++}`,
                points: processed.points,
                area: processed.area,
                fileName: file.name,
                entityType: entity.type,
              });
            }
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

      // Validate DXF data
      const validationIssues: string[] = [];
      
      if (processedEntities.length === 0) {
        validationIssues.push("No entities found in DXF file");
      }
      
      if (totalArea === 0) {
        validationIssues.push("Total area calculated as 0 mm² - file may contain only lines or invalid closed shapes");
        validationIssues.push("Ensure your DXF contains closed polylines or circles for area calculation");
      }
      
      if (minX === Infinity || maxX === -Infinity) {
        validationIssues.push("Invalid bounds detected - file may be corrupted");
      }
      
      const hasAreaEntities = processedEntities.some(e => e.area && e.area > 0);
      if (processedEntities.length > 0 && !hasAreaEntities) {
        validationIssues.push("No entities with calculable area found (lines only)");
        validationIssues.push("Add closed polylines or circles to calculate material usage");
      }

      const dxfData: DXFData = {
        fileName: file.name,
        entities: processedEntities,
        parts: extractedParts,
        totalArea,
        bounds: { minX, maxX, minY, maxY },
        validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
      };

      console.log('=== DXF FILE PROCESSED ===');
      console.log('File Name:', file.name);
      console.log('Entities Found:', processedEntities.length);
      console.log('Parts Extracted:', extractedParts.length);
      console.log('Total Area Calculated:', totalArea, 'mm²');
      console.log('Bounds:', { minX, maxX, minY, maxY });
      console.log('Validation Issues:', validationIssues);
      console.log('=========================');

      if (validationIssues.length > 0) {
        toast.error(`File processed with issues - check validation warnings`);
      } else {
        toast.success(`DXF processed! Found ${extractedParts.length} parts with ${totalArea.toFixed(2)} mm² total area.`);
      }
      
      return dxfData;
    } catch (error) {
      console.error("Error processing DXF:", error);
      toast.error("Failed to process DXF file. Please ensure it's a valid 2D DXF file.");
      return null;
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (acceptedFiles.length > 10) {
      toast.error("Maximum 10 files allowed. Please select up to 10 DXF files.");
      return;
    }

    setProcessing(true);
    const allProcessedData: DXFData[] = [];
    
    try {
      for (const file of acceptedFiles) {
        const fileName = file.name.toLowerCase();
        
        let data: DXFData | null = null;
        
        if (fileName.endsWith('.dxf')) {
          data = await processDXFFile(file);
        } else if (fileName.endsWith('.step') || fileName.endsWith('.stp') || 
                   fileName.endsWith('.iges') || fileName.endsWith('.igs') ||
                   fileName.endsWith('.x_t') || fileName.endsWith('.sldprt')) {
          data = await process3DFile(file);
        } else if (fileName.endsWith('.dwg')) {
          toast.error(`${file.name}: DWG format not supported. Please convert to DXF.`);
        } else if (fileName.endsWith('.pdf')) {
          toast.error(`${file.name}: PDF format not supported. Please convert to DXF.`);
        } else {
          toast.error(`${file.name}: Unsupported file format.`);
        }
        
        if (data) {
          allProcessedData.push(data);
        }
      }
      
      if (allProcessedData.length > 0) {
        const totalParts = allProcessedData.reduce((sum, d) => sum + d.parts.length, 0);
        toast.success(`Processed ${allProcessedData.length} files with ${totalParts} total parts!`);
        onFilesProcessed(allProcessedData);
      } else {
        toast.error("No valid files were processed.");
      }
    } finally {
      setProcessing(false);
    }
  }, [processDXFFile, process3DFile, onFilesProcessed]);

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
    multiple: true,
    maxFiles: 10
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Upload DXF Files</h2>
        <p className="text-muted-foreground">
          Upload up to 10 DXF files for combined nesting optimization
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
              <p className="text-lg font-medium">Processing files...</p>
              <p className="text-sm text-muted-foreground">Extracting all closed shapes</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive ? 'Drop DXF files here' : 'Drag & drop DXF files'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (up to 10 files)
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
              <li>• <strong>3D Files:</strong> STEP, IGES, Parasolid, SolidWorks native files</li>
              <li>• Supported: .step, .stp, .iges, .igs, .x_t, .sldprt</li>
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
