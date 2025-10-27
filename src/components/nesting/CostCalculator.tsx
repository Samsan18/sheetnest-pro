import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { NestingResult } from "@/utils/nestingAlgorithm";

interface CostCalculatorProps {
  result: NestingResult;
  sheetWidth: number;
  sheetHeight: number;
}

const CostCalculator = ({ result, sheetWidth, sheetHeight }: CostCalculatorProps) => {
  const [costPerSheet, setCostPerSheet] = useState(2500); // INR
  const [materialType, setMaterialType] = useState("mild-steel");
  const [thickness, setThickness] = useState(2);
  const [cuttingCostPerMeter, setCuttingCostPerMeter] = useState(50); // INR per meter

  const materialPrices: Record<string, number> = {
    "mild-steel": 2500,
    "stainless-304": 4500,
    "stainless-316": 5500,
    "aluminum-5052": 3200,
    "aluminum-6061": 3500,
    "copper": 8000,
    "brass": 6500,
  };

  const sheetArea = (sheetWidth * sheetHeight) / 1000000; // Convert to m²
  const adjustedCost = materialPrices[materialType] * sheetArea * (thickness / 2);
  
  const totalMaterialCost = result.sheetsRequired * adjustedCost;
  const totalCuttingCost = result.totalPartsPlaced * 0.5 * cuttingCostPerMeter; // Estimated
  const totalCost = totalMaterialCost + totalCuttingCost;
  const costPerPart = totalCost / result.totalPartsPlaced;
  const wasteRupees = (result.wastePercentage / 100) * totalMaterialCost;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>

      <div className="space-y-4 mb-6">
        <div>
          <Label>Material Type</Label>
          <Select value={materialType} onValueChange={setMaterialType}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mild-steel">Mild Steel</SelectItem>
              <SelectItem value="stainless-304">Stainless Steel 304</SelectItem>
              <SelectItem value="stainless-316">Stainless Steel 316</SelectItem>
              <SelectItem value="aluminum-5052">Aluminum 5052</SelectItem>
              <SelectItem value="aluminum-6061">Aluminum 6061</SelectItem>
              <SelectItem value="copper">Copper</SelectItem>
              <SelectItem value="brass">Brass</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Thickness (mm)</Label>
          <Input
            type="number"
            step="0.5"
            value={thickness}
            onChange={(e) => setThickness(parseFloat(e.target.value) || 2)}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Cutting Cost (₹/meter)</Label>
          <Input
            type="number"
            value={cuttingCostPerMeter}
            onChange={(e) => setCuttingCostPerMeter(parseFloat(e.target.value) || 50)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sheet Cost</span>
          <span className="font-semibold">₹{adjustedCost.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Sheets Required</span>
          <span className="font-semibold">{result.sheetsRequired}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Material Cost</span>
          <span className="font-semibold">₹{totalMaterialCost.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Est. Cutting Cost</span>
          <span className="font-semibold">₹{totalCuttingCost.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-destructive">
          <span>Material Waste Cost</span>
          <span className="font-semibold">₹{wasteRupees.toFixed(2)}</span>
        </div>

        <div className="flex justify-between border-t pt-3 text-lg">
          <span className="font-bold">Total Cost</span>
          <span className="font-bold">₹{totalCost.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Cost Per Part</span>
          <span className="font-semibold">₹{costPerPart.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        Prices are approximate and may vary based on market conditions
      </p>
    </Card>
  );
};

export default CostCalculator;
