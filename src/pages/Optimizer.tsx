import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import FileUpload from "@/components/optimizer/FileUpload";
import DXFViewer from "@/components/optimizer/DXFViewer";
import SheetConfig from "@/components/optimizer/SheetConfig";
import ResultsDisplay from "@/components/optimizer/ResultsDisplay";
import { DXFData, SheetSize, CalculationResults } from "@/types/optimizer";

const Optimizer = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dxfData, setDxfData] = useState<DXFData | null>(null);
  const [sheetSize, setSheetSize] = useState<SheetSize | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleFileProcessed = (data: DXFData) => {
    setDxfData(data);
    setStep(2);
  };

  const handleSheetConfigured = (sheet: SheetSize) => {
    setSheetSize(sheet);
    if (dxfData) {
      calculateResults(dxfData, sheet);
    }
    setStep(3);
  };

  const calculateResults = (dxf: DXFData, sheet: SheetSize) => {
    const sheetArea = sheet.width * sheet.height;
    const quantity = sheet.quantity || 1;
    const totalPartArea = dxf.totalArea * quantity;
    const usagePercentage = (totalPartArea / sheetArea) * 100;
    const wastePercentage = usagePercentage > 100 ? 0 : 100 - usagePercentage;
    const sheetsRequired = Math.ceil(totalPartArea / sheetArea);
    const wasteArea = sheetsRequired * sheetArea - totalPartArea;
    
    const totalCost = sheet.costPerSheet ? sheet.costPerSheet * sheetsRequired : undefined;
    const costPerPart = totalCost ? totalCost / quantity : undefined;

    setResults({
      sheetArea,
      totalPartArea,
      usagePercentage,
      wastePercentage,
      sheetsRequired,
      wasteArea,
      totalCost,
      costPerPart,
    });
  };

  const handleReset = () => {
    setStep(1);
    setDxfData(null);
    setSheetSize(null);
    setResults(null);
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
        {step === 1 && <FileUpload onFileProcessed={handleFileProcessed} />}
        
        {step === 2 && dxfData && (
          <div className="grid lg:grid-cols-2 gap-8">
            <DXFViewer data={dxfData} />
            <SheetConfig onConfigured={handleSheetConfigured} />
          </div>
        )}
        
        {step === 3 && results && dxfData && sheetSize && (
          <ResultsDisplay 
            results={results} 
            dxfData={dxfData} 
            sheetSize={sheetSize}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
};

export default Optimizer;
