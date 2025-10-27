import { Card } from "@/components/ui/card";
import { AlertTriangle, FileWarning, CheckCircle2 } from "lucide-react";

interface ValidationWarningsProps {
  issues?: string[];
  fileName: string;
}

const ValidationWarnings = ({ issues, fileName }: ValidationWarningsProps) => {
  if (!issues || issues.length === 0) {
    return (
      <Card className="bg-green-500/10 border-green-500/20 p-4">
        <div className="flex gap-3 items-start">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-500">File Validated Successfully</p>
            <p className="text-sm text-muted-foreground mt-1">
              {fileName} has been processed and is ready for optimization
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-destructive/10 border-destructive/20 p-4">
      <div className="flex gap-3 items-start">
        <FileWarning className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-destructive mb-2">File Validation Issues Detected</p>
          <p className="text-sm text-muted-foreground mb-3">
            The following issues were found in <strong>{fileName}</strong>:
          </p>
          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-card rounded-md border border-border">
            <p className="text-sm font-medium mb-2">Recommended Actions:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• For DXF files: Ensure you have closed polylines or circles</li>
              <li>• For 3D files: Verify the file isn't corrupted and contains valid geometry</li>
              <li>• Try exporting from your CAD software with different settings</li>
              <li>• Check that units are set correctly in your CAD file</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ValidationWarnings;
