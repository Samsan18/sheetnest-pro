# Metal Sheet Analyzer - Complete Documentation

## Overview

Metal Sheet Analyzer is a production-ready web application designed for fabrication shops, metal manufacturers, and engineers to analyze DXF (2D CAD) files, optimize material utilization, and generate production-ready cutting layouts.

## Key Features

### 1. Multi-File DXF Processing
- Upload up to 10 DXF files simultaneously
- Supports DXF R12 format and newer
- Automatic geometry extraction (polylines, circles, arcs, lines)
- Real-time file validation and error handling

### 2. Intelligent Nesting Algorithm
- Advanced bottom-left bin packing strategy
- Automatic part rotation (0°, 90°, 180°, 270°)
- Configurable spacing between parts (default: 5mm)
- Multi-sheet optimization when parts don't fit on single sheet

### 3. Material Analysis
- **Total Part Area Calculation**: Accurate area computation using Shoelace formula for polygons
- **Material Usage Percentage**: Shows how efficiently the sheet is utilized
- **Waste Percentage**: Calculates material waste for cost analysis
- **Sheet Requirements**: Automatically calculates number of sheets needed

### 4. Visual Preview System
- Interactive DXF viewer with zoom and pan controls
- Real-time nesting layout visualization
- Color-coded parts for easy identification
- Sheet-by-sheet navigation for multi-sheet layouts

### 5. Export Capabilities
- **PDF Reports**: Comprehensive analysis reports with all calculations
- **Excel Spreadsheets**: Detailed data export with summary and nesting details
- **DXF Files**: Export optimized layouts ready for laser cutting

### 6. Professional Configuration
- Standard sheet sizes (4×8 ft, 5×10 ft)
- Custom sheet dimensions with unit conversion (mm, cm, inch, ft, m)
- Material type selection (Stainless Steel, Aluminum, Mild Steel, etc.)
- Thickness specification
- Cost per sheet calculation

## Technical Architecture

### Frontend Stack
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server

### Key Libraries
- **dxf-parser** - DXF file parsing
- **jsPDF** - PDF generation
- **xlsx** - Excel file generation
- **lucide-react** - Icon system
- **react-dropzone** - File upload handling
- **sonner** - Toast notifications

### File Structure
```
src/
├── components/
│   ├── optimizer/
│   │   ├── FileUpload.tsx       # Multi-file upload with drag-drop
│   │   ├── DXFViewer.tsx        # Interactive DXF preview
│   │   ├── SheetConfig.tsx      # Sheet size and material config
│   │   ├── ResultsDisplay.tsx   # Calculation results & exports
│   │   └── NestingPreview.tsx   # Visual nesting layout
│   └── ui/                      # Shadcn UI components
├── lib/
│   ├── nestingAlgorithm.ts      # Core nesting logic
│   ├── dxfExporter.ts           # DXF export functionality
│   └── utils.ts                 # Utility functions
├── pages/
│   ├── Index.tsx                # Landing page
│   ├── Optimizer.tsx            # Main optimizer workflow
│   └── NotFound.tsx             # 404 page
└── types/
    └── optimizer.ts              # TypeScript interfaces

```

## User Workflow

### Step 1: Upload DXF Files
1. Navigate to the optimizer page
2. Drag and drop DXF files or click to browse
3. Upload 1-10 DXF files (max 50MB each)
4. System automatically processes and validates files

### Step 2: Configure Sheet Size
1. Choose standard sheet size (4×8 ft or 5×10 ft)
   - OR enter custom dimensions
2. Select material type (e.g., Stainless Steel AISI 304)
3. Specify thickness (e.g., 1.5mm)
4. Set quantity and optional cost per sheet
5. Click "Calculate" to process

### Step 3: View Results
The system displays:
- **Material Usage %**: Efficiency of sheet utilization
- **Material Waste %**: Percentage of unused material
- **Sheets Required**: Total number of sheets needed
- **Total Cost**: If cost per sheet was provided
- **Visual Nesting Layout**: Interactive preview of part placement

### Step 4: Export Results
Choose from three export options:
- **PDF**: Complete analysis report
- **Excel**: Detailed spreadsheet with nesting data
- **DXF**: Production-ready layout for laser cutting

## Algorithm Details

### Nesting Strategy
The application uses a **bottom-left heuristic** approach:

1. **Part Sorting**: Parts are sorted by area (largest first) for optimal packing
2. **Position Generation**: Grid-based position candidates with 20mm step size
3. **Collision Detection**: Rectangle-based overlap checking with configurable spacing
4. **Rotation Testing**: Each part is tested at 0°, 90°, 180°, 270° rotations
5. **Multi-Sheet Handling**: Automatically creates new sheets when current is full

### Area Calculation
- **Circles**: π × r²
- **Polygons**: Shoelace formula for accurate area of complex shapes
- **Lines**: Treated as boundaries (no area contribution)

### Performance Optimization
- Grid-based position search (20mm steps)
- Early termination on collision detection
- Efficient bounding box calculations
- Maximum 100 iterations per part placement

## Configuration Options

### Sheet Sizes (Standard)
| Size | Dimensions | Typical Use |
|------|-----------|-------------|
| 4×8 ft | 1219.2 × 2438.4 mm | Small to medium parts |
| 5×10 ft | 1524 × 3048 mm | Large parts, higher volume |

### Supported Materials
- Mild Steel
- Stainless Steel 304
- Stainless Steel 316
- Aluminum 5052
- Aluminum 6061
- Copper
- Brass
- Galvanized Steel
- Cold Rolled Steel
- Hot Rolled Steel

### Unit Conversions
- Millimeters (mm) - Base unit
- Centimeters (cm) - ×10
- Inches (inch) - ×25.4
- Feet (ft) - ×304.8
- Meters (m) - ×1000

## Export Format Details

### PDF Report Contents
- Project metadata (date, material, dimensions)
- Total parts count
- Sheet area and part area
- Usage and waste percentages
- Sheets required
- Cost analysis (if provided)

### Excel Spreadsheet Structure
**Sheet 1: Summary**
- Project information
- Analysis results
- Cost breakdown

**Sheet 2: Nesting Layout**
- Sheet number
- Part number
- Position (X, Y)
- Rotation angle
- Dimensions (width, height)

### DXF Export Format
- AutoCAD 2000 format (AC1015)
- Units: Millimeters
- Layers:
  - SHEET_BORDER (red) - Sheet outlines
  - PARTS (white) - Part boundaries
- Text labels for part identification
- Sheets spaced horizontally for clarity

## Deployment Instructions

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment Options

#### Option 1: Lovable Cloud
- Click "Publish" button in Lovable interface
- Automatic deployment to Lovable CDN
- Custom domain support available

#### Option 2: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option 3: Netlify
```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
# Or connect GitHub repo for automatic deployments
```

#### Option 4: Self-Hosted
```bash
# Build project
npm run build

# Serve dist/ folder with any static file server
# Example with serve:
npx serve -s dist -p 3000
```

### Environment Variables
No environment variables required for core functionality.

## Browser Support

- Chrome/Edge: Latest 2 versions ✓
- Firefox: Latest 2 versions ✓
- Safari: Latest 2 versions ✓
- Mobile browsers: iOS Safari 14+, Chrome Android 90+ ✓

## Performance Considerations

### File Size Limits
- Maximum file size: 50MB per DXF file
- Maximum files: 10 per upload session
- Recommended: Keep files under 10MB for optimal performance

### Large File Handling
For DXF files with >10,000 entities:
- Processing time may increase to 5-10 seconds
- Consider splitting into multiple smaller files
- Use "Clean" DXF files without unnecessary layers

### Browser Performance
- Canvas rendering optimized for smooth zoom/pan
- Grid rendering with requestAnimationFrame
- Efficient collision detection algorithms

## Troubleshooting

### Common Issues

**1. DXF File Not Processing**
- Ensure file is valid DXF format (R12 or newer)
- Check file size is under 50MB
- Verify file contains closed geometries

**2. Poor Nesting Results**
- Try enabling more rotation angles
- Increase spacing if parts are too close
- Consider using custom sheet size for better fit

**3. Export Not Working**
- Check browser pop-up blocker settings
- Ensure sufficient disk space for downloads
- Try different export format

**4. Visual Preview Issues**
- Refresh page and re-upload files
- Check browser console for errors
- Try different zoom level

## API Reference (Future Backend Integration)

The application is designed for easy backend integration:

### Suggested Endpoints
```
POST /api/optimize
Body: { dxfFiles: File[], sheetConfig: SheetConfig }
Response: { nestedLayout: NestedPart[][], results: CalculationResults }

GET /api/export/pdf
Query: { layoutId: string }
Response: PDF file download

GET /api/export/dxf
Query: { layoutId: string }
Response: DXF file download
```

## Future Enhancements

- [ ] Advanced nesting algorithms (genetic, simulated annealing)
- [ ] Real-time collaboration features
- [ ] Cloud storage integration
- [ ] Machine learning-based optimization
- [ ] CNC machine direct integration
- [ ] Material cost database
- [ ] Historical analysis and reporting
- [ ] Multi-user project management

## License

This project is provided as-is for production use in fabrication shops and manufacturing facilities.

## Support

For issues, feature requests, or questions:
1. Check this documentation
2. Review troubleshooting section
3. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Built with**: React, TypeScript, and modern web technologies
