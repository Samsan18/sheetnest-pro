import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetSize } from "@/types/optimizer";
import { ArrowRight } from "lucide-react";

interface SheetConfigProps {
  onConfigured: (sheet: SheetSize) => void;
}

const STANDARD_SHEETS: SheetSize[] = [
  { name: "4' x 8' (1220 x 2440 mm)", width: 1220, height: 2440 },
  { name: "4' x 10' (1220 x 3050 mm)", width: 1220, height: 3050 },
  { name: "5' x 10' (1525 x 3050 mm)", width: 1525, height: 3050 },
  { name: "4' x 12' (1220 x 3660 mm)", width: 1220, height: 3660 },
  { name: "5' x 12' (1525 x 3660 mm)", width: 1525, height: 3660 },
  { name: "6' x 12' (1830 x 3660 mm)", width: 1830, height: 3660 },
];

const SheetConfig = ({ onConfigured }: SheetConfigProps) => {
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedStandard, setSelectedStandard] = useState<SheetSize | null>(null);

  const handleStandardSelect = (sheet: SheetSize) => {
    setSelectedStandard(sheet);
  };

  const handleCustomSubmit = () => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    const qty = parseInt(quantity);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      alert("Please enter valid positive numbers for width and height");
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive number for quantity");
      return;
    }

    onConfigured({
      width,
      height,
      quantity: qty,
      name: `Custom ${width} x ${height} mm`
    });
  };

  const handleStandardSubmit = () => {
    const qty = parseInt(quantity);
    
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive number for quantity");
      return;
    }

    if (selectedStandard) {
      onConfigured({
        ...selectedStandard,
        quantity: qty
      });
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Sheet Size</h3>
        <p className="text-sm text-muted-foreground">
          Select a standard sheet size or enter custom dimensions
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Number of Pieces Needed</Label>
        <Input
          id="quantity"
          type="number"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          step="1"
        />
      </div>

      <Tabs defaultValue="standard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standard">Standard Sizes</TabsTrigger>
          <TabsTrigger value="custom">Custom Size</TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-4 mt-4">
          <div className="grid gap-3">
            {STANDARD_SHEETS.map((sheet, index) => (
              <Button
                key={index}
                variant={selectedStandard === sheet ? "default" : "outline"}
                className="justify-start text-left h-auto py-3"
                onClick={() => handleStandardSelect(sheet)}
              >
                <div>
                  <div className="font-semibold">{sheet.name}</div>
                  <div className="text-sm opacity-80">
                    {sheet.width} mm × {sheet.height} mm
                  </div>
                </div>
              </Button>
            ))}
          </div>
          <Button 
            className="w-full gap-2" 
            onClick={handleStandardSubmit}
            disabled={!selectedStandard}
          >
            Continue with Selected Size
            <ArrowRight className="h-4 w-4" />
          </Button>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                placeholder="Enter width in millimeters"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                min="1"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="Enter height in millimeters"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                min="1"
                step="0.1"
              />
            </div>
          </div>
          <Button 
            className="w-full gap-2" 
            onClick={handleCustomSubmit}
            disabled={!customWidth || !customHeight}
          >
            Continue with Custom Size
            <ArrowRight className="h-4 w-4" />
          </Button>
        </TabsContent>
      </Tabs>

      <Card className="bg-card/50 border-border p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Standard sheet sizes are common in metal fabrication. 
          Custom sizes are useful for specialized applications or non-standard materials.
        </p>
      </Card>
    </Card>
  );
};

export default SheetConfig;
