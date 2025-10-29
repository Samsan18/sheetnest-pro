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
import AdvancedConfig from "@/components/nesting/AdvancedConfig";
import CostCalculator from "@/components/nesting/CostCalculator";
import { nestParts, NestingPart, NestingResult } from "@/utils/nestingAlgorithm";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Optimizer = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dxfFiles, setDxfFiles] = useState<DXFData[]>([]);
  const [allParts, setAllParts] = useState<DXFPart[]>([]);
  const [sheetSize, setSheetSize] = useState<SheetSize | null>(null);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);
  const [nestingConfig, setNestingConfig] = useState({
    kerfWidth: 0.5,
    globalClearance: 2,
    rotationStep: 15,
    commonLineCutting: false,
    maxIterations: 1000,
  });

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

    // Perform nesting with user-configured settings
    const result = nestParts(nestingParts, {
      width: sheet.width,
      height: sheet.height,
    }, nestingConfig);

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
            
            <Tabs defaultValue="sheet" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sheet">Sheet Configuration</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sheet" className="mt-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  <DXFViewer data={dxfFiles[0]} />
                  <SheetConfig onConfigured={handleSheetConfigured} />
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-6">
                <div className="max-w-2xl mx-auto">
                  <AdvancedConfig config={nestingConfig} onChange={setNestingConfig} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {step === 3 && nestingResult && sheetSize && (
          <div className="space-y-6">
            {/* Summary Header */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <h2 className="text-2xl font-bold mb-4">Nesting Results</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sheets Required</p>
                    <p className="text-3xl font-bold text-primary">{nestingResult.sheetsRequired}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parts Placed</p>
                    <p className="text-3xl font-bold">{nestingResult.totalPartsPlaced}/{allParts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Material Usage</p>
                    <p className="text-3xl font-bold text-green-600">{nestingResult.usagePercentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Material Waste</p>
                    <p className="text-3xl font-bold text-orange-600">{nestingResult.wastePercentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <p className="text-sm">
                    <strong>Sheet Size:</strong> {sheetSize.name || `${sheetSize.width} × ${sheetSize.height} mm`}
                  </p>
                  {sheetSize.material && (
                    <p className="text-sm mt-1">
                      <strong>Material:</strong> {sheetSize.material} {sheetSize.thickness && `(${sheetSize.thickness}mm)`}
                    </p>
                  )}
                </div>
              </Card>

              <CostCalculator 
                result={nestingResult} 
                sheetWidth={sheetSize.width} 
                sheetHeight={sheetSize.height} 
              />
            </div>

            {/* Sheet Visualizations */}
            <div className="space-y-6">
              {nestingResult.sheets.map((sheet, idx) => (
                <Card key={idx} className="p-6 bg-card/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">
                      Sheet {idx + 1} of {nestingResult.sheetsRequired}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {sheet.length} parts • {((sheet.reduce((sum, p) => sum + p.area, 0) / (sheetSize.width * sheetSize.height)) * 100).toFixed(1)}% utilized
                    </div>
                  </div>
                  <InteractiveCanvas
                    sheet={sheet}
                    sheetWidth={sheetSize.width}
                    sheetHeight={sheetSize.height}
                    kerfWidth={nestingConfig.kerfWidth}
                    showKerf={true}
                    showGrain={false}
                    showLabels={true}
                  />
                </Card>
              ))}
            </div>

            <ExportOptions
              result={nestingResult}
              sheetWidth={sheetSize.width}
              sheetHeight={sheetSize.height}
              kerfWidth={nestingConfig.kerfWidth}
            />

            <div className="flex justify-center gap-4">
              <Button onClick={handleReset} size="lg" variant="outline">
                Start New Nesting
              </Button>
              <Button onClick={() => setStep(2)} size="lg" variant="secondary">
                Adjust Settings
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Optimizer;
