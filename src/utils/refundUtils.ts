/**
 * Refund Financial Logic Utilities
 *
 * Refund transactions must behave as deductions/reversals in all financial calculations.
 * Any cash-in transaction whose category is identified as a refund should REDUCE inflow
 * totals rather than inflate them.
 *
 * Covered refund category names (case-insensitive, substring match):
 *   - Refund
 *   - Refunded
 *   - System Refund
 *   - Refund Cash-Out
 *   - Any category containing the word "refund"
 */

import { Transaction } from '@/hooks/useTransactions';

/**
 * Returns true if the given category name represents a refund/reversal transaction.
 * Matches exact names and substrings (case-insensitive).
 */
export const isRefundCategory = (categoryName: string | null | undefined): boolean => {
  const c = (categoryName || '').toLowerCase().trim();
  return c.includes('refund');
};

/**
 * Calculates the effective (refund-adjusted) cash-in total from a list of transactions.
 *
 * For any cash-in transaction flagged as a refund category, its amount is SUBTRACTED
 * from the running total rather than added (acting as a reversal of inflow).
 *
 * Formula:
 *   effectiveCashIn = sum(normal cash-in amounts) - sum(refund cash-in amounts)
 */
export const getEffectiveCashIn = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.type === 'cash-in')
    .reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return isRefundCategory(t.category_name)
        ? sum - amount   // refund → deduction
        : sum + amount;  // normal cash-in → addition
    }, 0);
};

/**
 * Calculates the refund-adjusted cash-in total for a specific subset of transactions.
 * Equivalent to getEffectiveCashIn but accepts pre-filtered transactions.
 */
export const calcAdjustedCashIn = (cashInTransactions: Transaction[]): number => {
  return cashInTransactions.reduce((sum, t) => {
    const amount = Number(t.amount) || 0;
    return isRefundCategory(t.category_name)
      ? sum - amount
      : sum + amount;
  }, 0);
};
