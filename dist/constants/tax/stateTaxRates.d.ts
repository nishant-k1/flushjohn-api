/**
 * US State Sales Tax Rates
 * Single source of truth for state tax rates across the application
 * Rates are state-level base rates and may vary by locality
 *
 * Last Updated: 2025
 */
export declare const STATE_TAX_RATES: Record<string, number>;
/**
 * Get sales tax rate for a state
 */
export declare const getStateTaxRate: (state: string | null | undefined) => number;
//# sourceMappingURL=stateTaxRates.d.ts.map