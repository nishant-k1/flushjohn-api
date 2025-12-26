/**
 * US State Sales Tax Rates
 * Single source of truth for state tax rates across the application
 * Rates are state-level base rates and may vary by locality
 * 
 * Last Updated: 2025
 */

export const STATE_TAX_RATES = {
  TX: 8.25,
  CA: 7.25,
  FL: 6.0,
  NY: 8.0,
  PA: 6.0,
  IL: 6.25,
  OH: 5.75,
  GA: 4.0,
  NC: 4.75,
  MI: 6.0,
  NJ: 6.625,
  VA: 5.3,
  WA: 6.5,
  AZ: 5.6,
  MA: 6.25,
  TN: 7.0,
  IN: 7.0,
  MO: 4.225,
  MD: 6.0,
  WI: 5.0,
  CO: 2.9,
  MN: 6.875,
  SC: 6.0,
  AL: 4.0,
  LA: 4.45,
  KY: 6.0,
  OR: 0.0,
  OK: 4.5,
  CT: 6.35,
  UT: 6.1,
  IA: 6.0,
  NV: 6.85,
  AR: 6.5,
  MS: 7.0,
  KS: 6.5,
  NM: 5.125,
  NE: 5.5,
  WV: 6.0,
  ID: 6.0,
  HI: 4.0,
  NH: 0.0,
  ME: 5.5,
  MT: 0.0,
  RI: 7.0,
  DE: 0.0,
  SD: 4.5,
  ND: 5.0,
  AK: 0.0,
  VT: 6.0,
  WY: 4.0,
};

/**
 * Get sales tax rate for a state
 * @param {string} state - State code (e.g., "TX", "CA") or full state name
 * @returns {number} - Tax rate as percentage (default: 7.0)
 */
export const getStateTaxRate = (state) => {
  if (!state) return 7.0; // Default estimate
  const stateCode = state.toUpperCase().trim();
  return STATE_TAX_RATES[stateCode] || 7.0;
};

