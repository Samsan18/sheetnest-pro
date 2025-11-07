import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import FileUpload from "@/components/optimizer/FileUpload";
import DXFViewer from "@/components/optimizer/DXFViewer";
import SheetConfig from "@/components/optimizer/SheetConfig";
import ResultsDisplay from "@/components/optimizer/ResultsDisplay";
import NestingPreview from "@/components/optimizer/NestingPreview";
import { DXFData, SheetSize, CalculationResults } from "@/types/optimizer";
import { nestParts } from "@/lib/nestingAlgorithm";

const Optimizer = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dxfFiles, setDxfFiles] = useState<DXFData[]>([]);
  const [sheetSize, setSheetSize] = useState<SheetSize | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [currentSheetView, setCurrentSheetView] = useState(0);

  const handleFilesProcessed = (data: DXFData[]) => {
    setDxfFiles(data);
    setStep(2);
  };

  const handleSheetConfigured = (sheet: SheetSize) => {
    setSheetSize(sheet);
    if (dxfFiles.length > 0) {
      calculateResults(dxfFiles, sheet);
    }
    setStep(3);
  };

  const calculateResults = (files: DXFData[], sheet: SheetSize) => {
    const sheetArea = sheet.width * sheet.height;
    
    // Perform nesting
    const nestedSheets = nestParts(files, sheet.width, sheet.height, {
      spacing: 5,
      rotationSteps: [0, 90, 180, 270],
      maxIterations: 100
    });
    
    const sheetsRequired = nestedSheets.length;
    const totalParts = files.length;
    
    // Calculate total part area
    const totalPartArea = files.reduce((sum, file) => sum + file.totalArea, 0);
    
    // Total available area
    const totalAvailableArea = sheetsRequired * sheetArea;
    
    // Calculate waste
    const wasteArea = totalAvailableArea - totalPartArea;
    const usagePercentage = (totalPartArea / totalAvailableArea) * 100;
    const wastePercentage = (wasteArea / totalAvailableArea) * 100;
    
    const totalCost = sheet.costPerSheet ? sheet.costPerSheet * sheetsRequired : undefined;
    const costPerPart = totalCost && totalParts > 0 ? totalCost / totalParts : undefined;

    console.log('=== NESTING RESULTS ===');
    console.log('Total DXF Files:', totalParts);
    console.log('Total Part Area:', totalPartArea.toFixed(2), 'mm²');
    console.log('Sheet Size:', sheet.width, 'x', sheet.height, 'mm');
    console.log('Sheets Required:', sheetsRequired);
    console.log('Material Usage:', usagePercentage.toFixed(2), '%');
    console.log('Material Waste:', wastePercentage.toFixed(2), '%');
    console.log('======================');

    setResults({
      sheetArea,
      totalPartArea,
      usagePercentage,
      wastePercentage,
      sheetsRequired,
      wasteArea,
      totalCost,
      costPerPart,
      nestedParts: nestedSheets,
      totalParts
    });
  };

  const handleReset = () => {
    setStep(1);
    setDxfFiles([]);
    setSheetSize(null);
    setResults(null);
    setCurrentSheetView(0);
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
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Configure Sheet Size</h2>
              <p className="text-muted-foreground">
                {dxfFiles.length} DXF file(s) loaded - Select material and sheet size
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              {dxfFiles[0] && <DXFViewer data={dxfFiles[0]} />}
              <SheetConfig onConfigured={handleSheetConfigured} />
            </div>
          </div>
        )}
        
        {step === 3 && results && sheetSize && (
          <div className="space-y-6">
            <ResultsDisplay 
              results={results} 
              dxfData={dxfFiles[0]} 
              sheetSize={sheetSize}
              onReset={handleReset}
            />
            <NestingPreview
              sheets={results.nestedParts}
              sheetWidth={sheetSize.width}
              sheetHeight={sheetSize.height}
              currentSheet={currentSheetView}
            />
            <div className="flex justify-center gap-2">
              {results.nestedParts.map((_, index) => (
                <Button
                  key={index}
                  variant={currentSheetView === index ? "default" : "outline"}
                  onClick={() => setCurrentSheetView(index)}
                >
                  Sheet {index + 1}
                </Button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Optimizer;
