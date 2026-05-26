# Super Admin Comprehensive Export Feature

## Overview
This feature provides super admin users with the ability to export comprehensive reports containing all companies' data, transactions, and analytics in a single PDF document.

## Features

### 1. Comprehensive Multi-Company Report
- **All Companies Data**: Complete list of all companies with their status and creation dates
- **Executive Summary**: Total statistics across all companies including:
  - Total number of companies
  - Total transactions across all companies
  - Total cash in/out amounts
  - Net balance across all companies
  - Total pictures uploaded
- **Company-wise Breakdown**: Individual statistics for each company
- **Detailed Transaction History**: Up to 100 most recent transactions with full details

### 2. Flexible Time Periods
- **All Time Report**: Complete historical data from all companies
- **Yearly Report**: Data for a specific year across all companies
- **Monthly Report**: Data for a specific month and year across all companies

### 3. Export Options
The super admin can choose from:
- `exportSuperAdminAllTimeReport()` - All historical data
- `exportSuperAdminYearlyReport(year)` - Specific year data
- `exportSuperAdminMonthlyReport(year, month)` - Specific month data
- `exportSuperAdminComprehensiveReport(period, year?, month?)` - Generic function

## Implementation Details

### Files Created/Modified
1. **`src/utils/superAdminComprehensiveExport.ts`** - Main export utility functions
2. **`src/components/export/SuperAdminExportOptions.tsx`** - UI component for super admin exports
3. **`src/components/export/ExportCenter.tsx`** - Updated to include super admin options

### Database Tables Used
- `mt_companies` - Company information
- `mt_company_transactions` - All transaction data across companies
- Multi-tenant authentication tables for user verification

### Security
- Only users with `super_admin` role can access these export functions
- Uses `useMultiTenantAuth()` hook to verify super admin status
- Database queries respect RLS policies for super admin access

## Usage

### For Super Admin Users
1. Navigate to the Export Center
2. Go to the "System" tab
3. Scroll down to "Super Admin Comprehensive Exports" section
4. Select desired time period (All Time, Yearly, or Monthly)
5. Choose specific year/month if applicable
6. Click "Export Comprehensive Report"

### Report Contents
The generated PDF includes:
1. **Title Page** with report period and generation timestamp
2. **Executive Summary** with key statistics
3. **Companies Overview** table with all companies
4. **Company-wise Breakdown** with individual company statistics
5. **Detailed Transaction History** (first 100 transactions)
6. **Professional formatting** with Lighthouse Media branding

### File Naming Convention
```
SuperAdmin_Comprehensive_Report_[Period]_[Date].pdf
```

Examples:
- `SuperAdmin_Comprehensive_Report_All_Time_2025-01-29.pdf`
- `SuperAdmin_Comprehensive_Report_Year_2024_2025-01-29.pdf`
- `SuperAdmin_Comprehensive_Report_January_2024_2025-01-29.pdf`

## Technical Implementation

### Key Functions
```typescript
// Main export function
exportSuperAdminComprehensiveReport(
  period: 'monthly' | 'yearly' | 'all-time',
  year?: number,
  month?: number
): Promise<void>

// Convenience functions
exportSuperAdminAllTimeReport(): Promise<void>
exportSuperAdminYearlyReport(year: number): Promise<void>
exportSuperAdminMonthlyReport(year: number, month: number): Promise<void>
```

### Data Processing
1. Fetches all active companies from `mt_companies`
2. Queries `mt_company_transactions` with appropriate date filters
3. Calculates comprehensive statistics across all companies
4. Groups transactions by company for detailed breakdown
5. Generates professional PDF with multiple sections

### Error Handling
- Comprehensive try-catch blocks with detailed error logging
- User-friendly error messages via toast notifications
- Graceful handling of missing data or database errors

## Benefits for Super Admin Users
1. **Complete Oversight**: View all company data in one comprehensive report
2. **Time-based Analysis**: Compare performance across different time periods
3. **Professional Reporting**: Generate formal reports for stakeholders
4. **Data Export**: Offline access to complete system data
5. **Audit Trail**: Complete transaction history across all companies

## Future Enhancements
- Export to Excel format
- Email delivery of reports
- Scheduled automatic report generation
- Custom date range selection
- Additional analytics and charts
- Company comparison metrics
