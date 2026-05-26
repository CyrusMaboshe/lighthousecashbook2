# Implementation Plan: Four Major Features

## Overview
This document outlines the implementation plan for four major features requested for the Lighthouse Media cash flow keeper application.

## Feature 1: Admin CRUD Operations for Transactions
**Status:** ✅ Partially Implemented (Create & Read exist)
**Remaining Work:** Add Update & Delete functionality

### Changes Required:
1. **useTransactions Hook** (`src/hooks/useTransactions.tsx`)
   - ✅ Already has `updateTransaction` and `deleteTransaction` functions
   - Need to verify admin-only permissions

2. **GlassTransactionsView** (`src/components/glass-ui/GlassTransactionsView.tsx`)
   - Add Edit and Delete buttons for admin users
   - Add confirmation dialog for delete operations
   - Add edit modal/dialog for updating transactions
   - Pass `updateTransaction` and `deleteTransaction` from parent

3. **GlassMainApp** (`src/components/glass-ui/GlassMainApp.tsx`)
   - Already passes `updateTransaction` and `deleteTransaction` to child components
   - Verify admin role checks are in place

### Implementation Steps:
1. Update GlassTransactionsView to show Edit/Delete buttons for admins
2. Create TransactionEditDialog component
3. Add delete confirmation dialog
4. Test CRUD operations with admin account

---

## Feature 2: Update App Title to "Lighthouse Media"
**Status:** ❌ Not Implemented
**Scope:** Simple text replacement

### Files to Update:
1. **GlassHeader.tsx** - Line 28: "Smart Savings" → "Lighthouse Media"
2. **GlassBottomNav.tsx** - Line 60: "Smart Savings" → "Lighthouse Media"
3. **UnifiedLoginForm.tsx** - Multiple references to "Smart Savings"
4. **GlassProfileView.tsx** - Line 95: App version text
5. **Other components** - Search and replace all "Smart Savings" references

### Implementation Steps:
1. Search all files for "Smart Savings"
2. Replace with "Lighthouse Media" maintaining exact styling
3. Update logo initial from "S" to "L" or "LM"

---

## Feature 3: Persist Global Balance Lock & User-Level Hide
**Status:** ❌ Not Implemented
**Complexity:** High - Requires backend state management

### Current State:
- Balance visibility is stored in component state (useState)
- Resets on page refresh/logout
- Located in: SavingsView.tsx, CashvaultManagement.tsx

### Required Changes:

#### 3.1 Database Schema
Create new table: `user_preferences`
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### 3.2 New Hook: useBalanceVisibility
- Fetch user's balance visibility preference from Supabase
- Update preference when toggled
- Cache in React state for performance

#### 3.3 Update Components:
- **SavingsView.tsx** - Use new hook instead of useState
- **CashvaultManagement.tsx** - Use new hook instead of useState
- **GlassHomeView.tsx** - Add balance visibility toggle if needed

### Implementation Steps:
1. Create database migration for user_preferences table
2. Create useBalanceVisibility hook
3. Update SavingsView to use persistent state
4. Update CashvaultManagement to use persistent state
5. Test persistence across logout/login

---

## Feature 4: Fix Savings Layout & Restore PDF Export
**Status:** ⚠️ Partially Broken
**Issues:** Layout scaling, missing PDF export

### 4.1 Layout Fixes (SavingsView.tsx)
**Current Issues:**
- Transaction cards may be oversized
- Potential alignment issues

**Changes Required:**
- Review and adjust card sizing classes
- Fix any misaligned elements
- Ensure responsive scaling
- Test on mobile and desktop

### 4.2 PDF Export Restoration
**Current State:**
- No PDF export button visible in Savings tab
- Need to add export functionality

**Implementation:**
1. Create SavingsPDFExport component
2. Add "Export to PDF" button in SavingsView header
3. Use existing PDF export utilities (check `utils/pdfExport.ts`)
4. Format savings transactions for PDF output

### Files to Modify:
1. **SavingsView.tsx**
   - Add PDF export button
   - Adjust card/layout sizing
   - Fix alignment issues

2. **utils/pdfExport.ts** (if exists)
   - Add savings-specific export function
   - Or create new savings PDF export utility

### Implementation Steps:
1. Audit SavingsView layout and fix scaling issues
2. Create PDF export function for savings
3. Add Export button to SavingsView
4. Test PDF generation with sample data

---

## Execution Order
1. **Feature 2** (App Title) - Quickest, no risk
2. **Feature 1** (Admin CRUD) - Medium complexity, high value
3. **Feature 4** (Savings Layout & PDF) - Medium complexity
4. **Feature 3** (Persistent Balance Lock) - Highest complexity, requires DB changes

---

## Testing Checklist
- [ ] Admin can edit any transaction
- [ ] Admin can delete any transaction with confirmation
- [ ] App title shows "Lighthouse Media" everywhere
- [ ] Balance visibility persists across sessions
- [ ] Each user has independent balance visibility
- [ ] Savings layout displays correctly on all screen sizes
- [ ] PDF export works for savings transactions
- [ ] All existing functionality remains intact
