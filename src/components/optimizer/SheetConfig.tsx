import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SheetSize, Unit, MaterialType } from "@/types/optimizer";
import { ArrowRight, Ruler } from "lucide-react";

interface SheetConfigProps {
  onConfigured: (sheet: SheetSize) => void;
}

const STANDARD_SHEETS: SheetSize[] = [
  { name: "4' × 8' (Most Common)", width: 1219, height: 2438 },
  { name: "5' × 10' (Large Format)", width: 1524, height: 3048 },
  { name: "4' × 10' (1220 × 3050 mm)", width: 1220, height: 3050 },
  { name: "4' × 12' (1220 × 3660 mm)", width: 1220, height: 3660 },
  { name: "5' × 12' (1525 × 3660 mm)", width: 1525, height: 3660 },
  { name: "6' × 12' (1830 × 3660 mm)", width: 1830, height: 3660 },
];

const MATERIALS: MaterialType[] = [
  'Mild Steel',
  'Stainless Steel 304',
  'Stainless Steel 316',
  'Aluminum 5052',
  'Aluminum 6061',
  'Copper',
  'Brass',
  'Galvanized Steel',
  'Cold Rolled Steel',
  'Hot Rolled Steel',
];

const UNIT_CONVERSION_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  ft: 304.8,
  m: 1000,
};

const SheetConfig = ({ onConfigured }: SheetConfigProps) => {
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedStandard, setSelectedStandard] = useState<SheetSize | null>(null);
  const [unit, setUnit] = useState<Unit>("mm");
  const [material, setMaterial] = useState<MaterialType>("Mild Steel");
  const [thickness, setThickness] = useState("");
  const [costPerSheet, setCostPerSheet] = useState("");

  const handleStandardSelect = (sheet: SheetSize) => {
    setSelectedStandard(sheet);
  };

  const convertToMM = (value: number, fromUnit: Unit): number => {
    return value * UNIT_CONVERSION_TO_MM[fromUnit];
  };

  const handleCustomSubmit = () => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    const qty = parseInt(quantity);
    const thick = parseFloat(thickness);
    const cost = parseFloat(costPerSheet);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      alert("Please enter valid positive numbers for width and height");
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive number for quantity");
      return;
    }

    const widthMM = convertToMM(width, unit);
    const heightMM = convertToMM(height, unit);

    onConfigured({
      width: widthMM,
      height: heightMM,
      quantity: qty,
      unit,
      material,
      thickness: !isNaN(thick) ? thick : undefined,
      costPerSheet: !isNaN(cost) ? cost : undefined,
      name: `Custom ${width} x ${height} ${unit}`
    });
  };

  const handleStandardSubmit = () => {
    const qty = parseInt(quantity);
    const thick = parseFloat(thickness);
    const cost = parseFloat(costPerSheet);
    
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive number for quantity");
      return;
    }

    if (selectedStandard) {
      onConfigured({
        ...selectedStandard,
        quantity: qty,
        unit: 'mm',
        material,
        thickness: !isNaN(thick) ? thick : undefined,
        costPerSheet: !isNaN(cost) ? cost : undefined,
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

      {/* Material and Common Settings */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Material Type</Label>
            <Select value={material} onValueChange={(value) => setMaterial(value as MaterialType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIALS.map((mat) => (
                  <SelectItem key={mat} value={mat}>
                    {mat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thickness">Thickness ({unit})</Label>
            <Input
              id="thickness"
              type="number"
              placeholder="Optional"
              value={thickness}
              onChange={(e) => setThickness(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Needed</Label>
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

          <div className="space-y-2">
            <Label htmlFor="cost">Cost per Sheet (₹)</Label>
            <Input
              id="cost"
              type="number"
              placeholder="e.g., 2500"
              value={costPerSheet}
              onChange={(e) => setCostPerSheet(e.target.value)}
              min="0"
              step="1"
            />
          </div>
        </div>
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
                className="justify-start text-left h-auto py-4 transition-all hover:scale-[1.02]"
                onClick={() => handleStandardSelect(sheet)}
              >
                <div className="w-full">
                  <div className="font-semibold flex items-center justify-between">
                    {sheet.name}
                    {index < 2 && (
                      <span className="text-xs bg-primary/20 px-2 py-1 rounded">Popular</span>
                    )}
                  </div>
                  <div className="text-sm opacity-80 mt-1">
                    {sheet.width} mm × {sheet.height} mm • {((sheet.width * sheet.height) / 1000000).toFixed(2)} m²
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
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(value) => setUnit(value as Unit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">Millimeters (mm)</SelectItem>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                  <SelectItem value="inch">Inches (in)</SelectItem>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                  <SelectItem value="m">Meters (m)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width ({unit})</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder={`Enter width`}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  min="1"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height ({unit})</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder={`Enter height`}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  min="1"
                  step="0.1"
                />
              </div>
            </div>

            {/* Preview Box */}
            {customWidth && customHeight && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Dimensions Preview</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">X (Width)</div>
                    <div className="font-semibold">{customWidth} {unit}</div>
                    <div className="text-xs text-muted-foreground">
                      {convertToMM(parseFloat(customWidth), unit).toFixed(2)} mm
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Y (Height)</div>
                    <div className="font-semibold">{customHeight} {unit}</div>
                    <div className="text-xs text-muted-foreground">
                      {convertToMM(parseFloat(customHeight), unit).toFixed(2)} mm
                    </div>
                  </div>
                </div>
              </Card>
            )}
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
