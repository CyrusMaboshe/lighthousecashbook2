# AI Prompt Template for PDF Export Implementation

## Use this exact prompt to implement PDF export for any tab/component:

---

**PROMPT:**

I want you to implement PDF export functionality for the **[TAB_NAME]** tab that exports the visualization/tables exactly as they appear on screen. Use the EXACT same settings and configuration as the Progress Visualization export.

**Requirements:**

1. **Use the Universal Export Settings:** Import and use `src/utils/universalChartExport.ts` which contains the EXACT settings from Progress Visualization export:
   - HTML2Canvas settings: `backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true`
   - PDF settings: `jsPDF('p', 'mm', 'a4')` with 20mm margins
   - Typography: Title (16pt, helvetica, bold), Subtitle (10pt), Body (12pt, bold)
   - Layout: Center alignment, specific spacing (10px after title, 15px after subtitle, 20px between elements)

2. **Implementation Steps:**
   - Add React refs to all visual elements you want to export (charts, tables, visualizations)
   - Import `exportElementsToPDF` from `src/utils/universalChartExport.ts`
   - Create an export handler function that calls `exportElementsToPDF` with the refs
   - Add an "Export PDF" button with loading state
   - Add proper error handling and success toast notifications

3. **Code Pattern to Follow:**
   ```typescript
   import { exportElementsToPDF } from '@/utils/universalChartExport';
   
   const [isExporting, setIsExporting] = useState(false);
   const chartRef = useRef<HTMLDivElement>(null);
   const tableRef = useRef<HTMLDivElement>(null);
   
   const handleExportPDF = async () => {
     setIsExporting(true);
     try {
       await exportElementsToPDF(
         [chartRef.current, tableRef.current],
         '[TAB_NAME] Report',
         undefined, // Use default settings
         ['Chart Title', 'Table Title']
       );
       toast({ title: "Export Successful", description: "Report exported to PDF" });
     } catch (error) {
       toast({ title: "Export Failed", description: "Failed to export", variant: "destructive" });
     } finally {
       setIsExporting(false);
     }
   };
   ```

4. **Button Implementation:**
   ```tsx
   <Button
     onClick={handleExportPDF}
     disabled={isExporting}
     variant="outline"
     size="sm"
     className="flex items-center gap-2"
   >
     <Download className="w-4 h-4" />
     {isExporting ? 'Exporting...' : 'Export PDF'}
   </Button>
   ```

5. **Add refs to visual elements:**
   ```tsx
   <div ref={chartRef}>
     {/* Your chart/visualization component */}
   </div>
   
   <div ref={tableRef}>
     {/* Your table/data component */}
   </div>
   ```

**Replace [TAB_NAME] with the actual tab name you want to implement.**

This will create PDF exports that look EXACTLY like the Progress Visualization exports with the same quality, formatting, and layout.

---

## Example Usage:

"I want you to implement PDF export functionality for the **Customer Analytics** tab that exports the visualization/tables exactly as they appear on screen. Use the EXACT same settings and configuration as the Progress Visualization export."

## Settings Explanation:

The Progress Visualization export works perfectly because it uses:
- **html2canvas** with scale:2 for high-quality capture
- **White background** to ensure clean appearance
- **CORS and allowTaint** enabled for complete element capture
- **A4 portrait** format with 20mm margins
- **Helvetica font family** with proper sizing hierarchy
- **Center alignment** for titles and consistent spacing
- **Automatic page breaks** when content exceeds page height
- **PNG format** for crisp image quality in PDF

These exact settings ensure the exported PDF looks identical to what users see on screen.
