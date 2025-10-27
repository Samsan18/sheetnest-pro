import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NestingConfig } from "@/utils/nestingAlgorithm";

interface AdvancedConfigProps {
  config: NestingConfig;
  onChange: (config: NestingConfig) => void;
}

const AdvancedConfig = ({ config, onChange }: AdvancedConfigProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Advanced Nesting Configuration</h3>
      
      <div className="space-y-6">
        {/* Kerf Compensation */}
        <div>
          <Label htmlFor="kerf">Kerf Width (mm)</Label>
          <Input
            id="kerf"
            type="number"
            step="0.1"
            value={config.kerfWidth}
            onChange={(e) =>
              onChange({ ...config, kerfWidth: parseFloat(e.target.value) || 0 })
            }
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Tool width compensation for laser/plasma cutting
          </p>
        </div>

        {/* Global Clearance */}
        <div>
          <Label htmlFor="clearance">Minimum Clearance (mm)</Label>
          <Input
            id="clearance"
            type="number"
            step="0.5"
            value={config.globalClearance}
            onChange={(e) =>
              onChange({ ...config, globalClearance: parseFloat(e.target.value) || 0 })
            }
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Minimum spacing between parts
          </p>
        </div>

        {/* Rotation Step */}
        <div>
          <Label>Rotation Step: {config.rotationStep}°</Label>
          <Slider
            value={[config.rotationStep]}
            onValueChange={(value) =>
              onChange({ ...config, rotationStep: value[0] })
            }
            min={5}
            max={90}
            step={5}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Angle increment for testing part rotations
          </p>
        </div>

        {/* Common Line Cutting */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="commonline">Common Line Cutting</Label>
            <p className="text-sm text-muted-foreground">
              Allow parts to share cutting edges
            </p>
          </div>
          <Switch
            id="commonline"
            checked={config.commonLineCutting}
            onCheckedChange={(checked) =>
              onChange({ ...config, commonLineCutting: checked })
            }
          />
        </div>

        {/* Max Iterations */}
        <div>
          <Label htmlFor="iterations">Max Iterations</Label>
          <Input
            id="iterations"
            type="number"
            value={config.maxIterations}
            onChange={(e) =>
              onChange({ ...config, maxIterations: parseInt(e.target.value) || 1000 })
            }
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Maximum optimization attempts per part
          </p>
        </div>

        {/* Nesting Strategy */}
        <div>
          <Label>Nesting Strategy</Label>
          <Select defaultValue="ffdh">
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ffdh">First Fit Decreasing Height</SelectItem>
              <SelectItem value="bfd">Best Fit Decreasing</SelectItem>
              <SelectItem value="nfd">Next Fit Decreasing</SelectItem>
              <SelectItem value="guillotine">Guillotine</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            Algorithm used for part placement optimization
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AdvancedConfig;
