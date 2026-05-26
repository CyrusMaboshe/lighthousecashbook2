/**
 * User Analytics Validation Utilities
 * 
 * This module enforces the business rule that for regular users (non-admin),
 * total revenue must always equal total cash-in in all analytics calculations.
 */

export interface ValidationResult {
  isValid: boolean;
  totalRevenue: number;
  totalCashIn: number;
  difference: number;
  message?: string;
}

export interface UserAnalyticsContext {
  username?: string;
  component: string;
  period?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Validates that total revenue equals total cash-in for user analytics
 * @param totalRevenue - The calculated total revenue
 * @param totalCashIn - The calculated total cash-in
 * @param context - Context information for logging
 * @returns ValidationResult with validation status and details
 */
export function validateRevenueEqualsCashIn(
  totalRevenue: number,
  totalCashIn: number,
  context: UserAnalyticsContext
): ValidationResult {
  const difference = totalRevenue - totalCashIn;
  const isValid = Math.abs(difference) < 0.01; // Allow for floating point precision issues
  
  const result: ValidationResult = {
    isValid,
    totalRevenue,
    totalCashIn,
    difference
  };

  if (!isValid) {
    const errorMessage = `❌ USER ANALYTICS VALIDATION ERROR: Revenue does not equal Cash-In!`;
    console.error(errorMessage, {
      component: context.component,
      user: context.username,
      period: context.period,
      totalRevenue,
      totalCashIn,
      difference,
      ...context.additionalInfo
    });
    
    result.message = `Revenue (${totalRevenue.toFixed(2)}) ≠ Cash-In (${totalCashIn.toFixed(2)})`;
  } else {
    console.log(`✅ VALIDATION PASSED: Revenue equals Cash-In in ${context.component}`, {
      user: context.username,
      amount: totalRevenue.toFixed(2)
    });
  }

  return result;
}

/**
 * Enforces the business rule by ensuring revenue equals cash-in
 * @param cashInTransactions - Array of cash-in transactions
 * @param context - Context information for logging
 * @returns Object with enforced revenue and validation result
 */
export function enforceRevenueEqualsCashIn(
  cashInTransactions: Array<{ amount: number }>,
  context: UserAnalyticsContext
): { totalRevenue: number; totalCashIn: number; validation: ValidationResult } {
  const totalCashIn = cashInTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalRevenue = totalCashIn; // BUSINESS RULE: Revenue = Cash-In for users
  
  const validation = validateRevenueEqualsCashIn(totalRevenue, totalCashIn, context);
  
  return {
    totalRevenue,
    totalCashIn,
    validation
  };
}

/**
 * Creates a standardized error for revenue/cash-in mismatches
 * @param context - Context information
 * @param totalRevenue - The revenue amount
 * @param totalCashIn - The cash-in amount
 */
export function createValidationError(
  context: UserAnalyticsContext,
  totalRevenue: number,
  totalCashIn: number
): Error {
  const difference = totalRevenue - totalCashIn;
  return new Error(
    `User Analytics Validation Error in ${context.component}: ` +
    `Revenue (${totalRevenue.toFixed(2)}) does not equal Cash-In (${totalCashIn.toFixed(2)}). ` +
    `Difference: ${difference.toFixed(2)}`
  );
}

/**
 * Logs validation success for debugging
 * @param context - Context information
 * @param amount - The validated amount
 */
export function logValidationSuccess(context: UserAnalyticsContext, amount: number): void {
  console.log(`✅ ${context.component} validation passed`, {
    user: context.username,
    period: context.period,
    amount: amount.toFixed(2),
    timestamp: new Date().toISOString()
  });
}

/**
 * Type guard to check if a validation result indicates an error
 * @param validation - The validation result to check
 */
export function isValidationError(validation: ValidationResult): boolean {
  return !validation.isValid;
}

/**
 * Formats validation results for display in UI
 * @param validation - The validation result
 * @returns Formatted string for display
 */
export function formatValidationMessage(validation: ValidationResult): string {
  if (validation.isValid) {
    return `✅ Revenue = Cash-In: ZMW ${validation.totalRevenue.toFixed(2)}`;
  } else {
    return `❌ Mismatch: Revenue ZMW ${validation.totalRevenue.toFixed(2)} ≠ Cash-In ZMW ${validation.totalCashIn.toFixed(2)}`;
  }
}
