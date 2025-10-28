import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import FileUpload from "@/components/optimizer/FileUpload";
import DXFViewer from "@/components/optimizer/DXFViewer";
import SheetConfig from "@/components/optimizer/SheetConfig";
import ValidationWarnings from "@/components/optimizer/ValidationWarnings";
import { DXFData, SheetSize, CalculationResults, DXFPart } from "@/types/optimizer";
import InteractiveCanvas from "@/components/nesting/InteractiveCanvas";
import ExportOptions from "@/components/nesting/ExportOptions";
import { nestParts, NestingPart, NestingResult } from "@/utils/nestingAlgorithm";
import { Card } from "@/components/ui/card";

const Optimizer = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dxfFiles, setDxfFiles] = useState<DXFData[]>([]);
  const [allParts, setAllParts] = useState<DXFPart[]>([]);
  const [sheetSize, setSheetSize] = useState<SheetSize | null>(null);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);

  const handleFilesProcessed = (data: DXFData[]) => {
    setDxfFiles(data);
    // Extract all parts from all files
    const parts: DXFPart[] = [];
    data.forEach(file => {
      parts.push(...file.parts);
    });
    setAllParts(parts);
    setStep(2);
  };

  const handleSheetConfigured = (sheet: SheetSize) => {
    setSheetSize(sheet);
    if (allParts.length > 0) {
      performNesting(allParts, sheet);
    }
    setStep(3);
  };

  const performNesting = (parts: DXFPart[], sheet: SheetSize) => {
    // Convert DXFParts to NestingParts
    const nestingParts: NestingPart[] = parts.map(part => ({
      id: part.id,
      points: part.points,
      area: part.area,
      quantity: 1, // Each extracted part is already individual
      rotation: 0,
      rotationLimit: 360, // Allow free rotation for optimal nesting
    }));

    // Perform nesting
    const result = nestParts(nestingParts, {
      width: sheet.width,
      height: sheet.height,
    }, {
      kerfWidth: 0.5, // Default kerf width in mm
      globalClearance: 2, // 2mm clearance between parts
      rotationStep: 15, // Test rotations every 15 degrees
      commonLineCutting: false,
      maxIterations: 1000,
    });

    console.log('=== NESTING RESULTS ===');
    console.log('Total Files:', dxfFiles.length);
    console.log('Total Parts:', parts.length);
    console.log('Sheets Required:', result.sheetsRequired);
    console.log('Parts Placed:', result.totalPartsPlaced);
    console.log('Usage:', result.usagePercentage.toFixed(2), '%');
    console.log('Waste:', result.wastePercentage.toFixed(2), '%');
    console.log('======================');

    setNestingResult(result);
  };

  const handleReset = () => {
    setStep(1);
    setDxfFiles([]);
    setAllParts([]);
    setSheetSize(null);
    setNestingResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={step >= 1 ? 'text-foreground' : 'text-muted-foreground'}>Upload</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={step >= 2 ? 'text-foreground' : 'text-muted-foreground'}>Configure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
              <span className={step >= 3 ? 'text-foreground' : 'text-muted-foreground'}>Results</span>
            </div>
          </div>
          {step > 1 && (
            <Button variant="outline" onClick={handleReset}>
              Start Over
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {step === 1 && <FileUpload onFilesProcessed={handleFilesProcessed} />}
        
        {step === 2 && dxfFiles.length > 0 && (
          <div className="space-y-6">
            {dxfFiles.map((file, idx) => (
              <ValidationWarnings 
                key={idx}
                issues={file.validationIssues} 
                fileName={file.fileName}
              />
            ))}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Files Summary</h3>
              <p className="text-muted-foreground mb-2">
                {dxfFiles.length} file{dxfFiles.length > 1 ? 's' : ''} uploaded with {allParts.length} total parts
              </p>
              <ul className="space-y-1 text-sm">
                {dxfFiles.map((file, idx) => (
                  <li key={idx}>
                    • {file.fileName}: {file.parts.length} part{file.parts.length !== 1 ? 's' : ''}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="grid lg:grid-cols-2 gap-8">
              <DXFViewer data={dxfFiles[0]} />
              <SheetConfig onConfigured={handleSheetConfigured} />
            </div>
          </div>
        )}
        
        {step === 3 && nestingResult && sheetSize && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Nesting Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sheets Required</p>
                  <p className="text-2xl font-bold">{nestingResult.sheetsRequired}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parts Placed</p>
                  <p className="text-2xl font-bold">{nestingResult.totalPartsPlaced}/{allParts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Material Usage</p>
                  <p className="text-2xl font-bold text-green-600">{nestingResult.usagePercentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Material Waste</p>
                  <p className="text-2xl font-bold text-orange-600">{nestingResult.wastePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            {nestingResult.sheets.map((sheet, idx) => (
              <Card key={idx} className="p-6">
                <h3 className="text-xl font-semibold mb-4">Sheet {idx + 1} ({sheet.length} parts)</h3>
                <InteractiveCanvas
                  sheet={sheet}
                  sheetWidth={sheetSize.width}
                  sheetHeight={sheetSize.height}
                  kerfWidth={0.5}
                  showKerf={true}
                  showGrain={false}
                  showLabels={true}
                />
              </Card>
            ))}

            <ExportOptions
              result={nestingResult}
              sheetWidth={sheetSize.width}
              sheetHeight={sheetSize.height}
              kerfWidth={0.5}
            />

            <div className="flex justify-center">
              <Button onClick={handleReset} size="lg">
                Start New Nesting
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Optimizer;
