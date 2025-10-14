import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { CalculationResults, DXFData, SheetSize } from "@/types/optimizer";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ResultsDisplayProps {
  results: CalculationResults;
  dxfData: DXFData;
  sheetSize: SheetSize;
  onReset: () => void;
}

const ResultsDisplay = ({ results, dxfData, sheetSize, onReset }: ResultsDisplayProps) => {
  const getEfficiencyColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getEfficiencyIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle2 className="h-5 w-5 text-success" />;
    return <AlertTriangle className="h-5 w-5 text-warning" />;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("SheetNest Optimizer - Results Report", 20, 20);
      
      // File info
      doc.setFontSize(12);
      doc.text(`DXF File: ${dxfData.fileName}`, 20, 35);
      doc.text(`Material: ${sheetSize.material || 'Not specified'}`, 20, 42);
      doc.text(`Sheet Size: ${sheetSize.name || `${sheetSize.width} x ${sheetSize.height} mm`}`, 20, 49);
      if (sheetSize.thickness) {
        doc.text(`Thickness: ${sheetSize.thickness} ${sheetSize.unit || 'mm'}`, 20, 56);
      }
      doc.text(`Quantity: ${sheetSize.quantity || 1} pieces`, 20, 63);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
      
      // Results
      doc.setFontSize(16);
      doc.text("Calculation Results", 20, 86);
      
      doc.setFontSize(12);
      doc.text(`Sheet Area: ${results.sheetArea.toLocaleString()} mm²`, 20, 101);
      doc.text(`Total Part Area: ${results.totalPartArea.toLocaleString()} mm²`, 20, 108);
      doc.text(`Material Usage: ${results.usagePercentage.toFixed(2)}%`, 20, 115);
      doc.text(`Material Waste: ${results.wastePercentage.toFixed(2)}%`, 20, 122);
      doc.text(`Waste Area: ${results.wasteArea.toLocaleString()} mm²`, 20, 129);
      doc.text(`Sheets Required: ${results.sheetsRequired}`, 20, 136);
      
      if (results.totalCost) {
        doc.text(`Total Cost: $${results.totalCost.toFixed(2)}`, 20, 143);
        doc.text(`Cost per Part: $${results.costPerPart?.toFixed(2)}`, 20, 150);
      }
      
      // Entity details
      doc.setFontSize(16);
      doc.text("Part Details", 20, 166);
      
      doc.setFontSize(12);
      doc.text(`Total Entities: ${dxfData.entities.length}`, 20, 181);
      
      // Save
      doc.save(`sheetnest-report-${Date.now()}.pdf`);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Optimization Results</h2>
          <p className="text-muted-foreground">{dxfData.fileName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            New Calculation
          </Button>
          <Button onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Material Usage</span>
            {getEfficiencyIcon(results.usagePercentage)}
          </div>
          <div className={`text-4xl font-bold ${getEfficiencyColor(results.usagePercentage)}`}>
            {results.usagePercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {results.usagePercentage >= 80 ? "Excellent efficiency" : 
             results.usagePercentage >= 60 ? "Good efficiency" : 
             "Consider optimization"}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Material Waste</span>
          </div>
          <div className="text-4xl font-bold text-accent">
            {results.wastePercentage.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {results.wasteArea.toLocaleString()} mm² wasted
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Sheets Required</span>
          </div>
          <div className="text-4xl font-bold">
            {results.sheetsRequired}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {sheetSize.name || `${sheetSize.width} x ${sheetSize.height} mm`}
          </p>
        </Card>

        {results.totalCost && (
          <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Cost</span>
            </div>
            <div className="text-4xl font-bold text-success">
              ${results.totalCost.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ${results.costPerPart?.toFixed(2)} per part
            </p>
          </Card>
        )}
      </div>

      {/* Detailed Information */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Material Specifications</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Material Type</span>
              <span className="font-semibold">{sheetSize.material || "Not specified"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sheet Size</span>
              <span className="font-semibold">{sheetSize.width.toFixed(2)} × {sheetSize.height.toFixed(2)} mm</span>
            </div>
            {sheetSize.thickness && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thickness</span>
                <span className="font-semibold">{sheetSize.thickness} {sheetSize.unit || 'mm'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sheet Area</span>
              <span className="font-semibold">{results.sheetArea.toLocaleString()} mm²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sheet Type</span>
              <span className="font-semibold">{sheetSize.name || "Custom"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Production Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parts Needed</span>
              <span className="font-semibold">{sheetSize.quantity || 1} pieces</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Single Part Area</span>
              <span className="font-semibold">{dxfData.totalArea.toLocaleString()} mm²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Parts Area</span>
              <span className="font-semibold">{results.totalPartArea.toLocaleString()} mm²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sheets Required</span>
              <span className="font-semibold text-primary">{results.sheetsRequired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entities Count</span>
              <span className="font-semibold">{dxfData.entities.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Waste Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waste Area</span>
              <span className="font-semibold">{results.wasteArea.toLocaleString()} mm²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waste Percentage</span>
              <span className="font-semibold text-accent">{results.wastePercentage.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usable Area</span>
              <span className="font-semibold">{results.totalPartArea.toLocaleString()} mm²</span>
            </div>
            {results.totalCost && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-semibold text-success">${results.totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per Part</span>
                  <span className="font-semibold">${results.costPerPart?.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">DXF File</span>
              <span className="font-semibold truncate max-w-[150px]" title={dxfData.fileName}>
                {dxfData.fileName}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6 bg-card/50">
        <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
        <ul className="space-y-2 text-sm">
          {results.usagePercentage < 60 && (
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <span>
                Low material usage detected. Consider using a smaller sheet size or combining 
                multiple parts on one sheet to improve efficiency.
              </span>
            </li>
          )}
          {results.sheetsRequired > 1 && (
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Multiple sheets required. Nesting optimization could help reduce the total 
                number of sheets needed.
              </span>
            </li>
          )}
          {results.usagePercentage >= 80 && (
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span>
                Excellent material efficiency! This configuration makes optimal use of the 
                available sheet material.
              </span>
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
