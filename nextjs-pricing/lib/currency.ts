interface FXRates {
  base: string;
  timestamp: string;
  rates: Record<string, number>;
  note: string;
}

/**
 * Convert amount from base currency to target currency
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: FXRates
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = rates.rates[fromCurrency];
  const toRate = rates.rates[toCurrency];

  if (!fromRate || !toRate) {
    console.warn(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
    return amount;
  }

  // Convert to base currency first, then to target currency
  const baseAmount = amount / fromRate;
  const convertedAmount = baseAmount * toRate;

  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format currency amount with proper locale and symbol
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch (error) {
    console.warn(`Failed to format currency ${currency}:`, error);
    return `${currency} ${Math.round(amount)}`;
  }
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  return symbols[currency] || currency;
}

/**
 * Get appropriate locale for currency
 */
export function getLocaleForCurrency(currency: string): string {
  const locales: Record<string, string> = {
    USD: 'en-US',
    EUR: 'en-GB', // Use UK English for EUR to avoid comma confusion
    GBP: 'en-GB'
  };

  return locales[currency] || 'en-US';
}

/**
 * Format price with period suffix (e.g., "/month")
 */
export function formatPriceWithPeriod(
  amount: number,
  currency: string,
  period: 'month' | 'year'
): string {
  const formattedAmount = formatCurrency(amount, currency);
  return `${formattedAmount}/${period}`;
}

/**
 * Calculate yearly price with discount
 */
export function calculateYearlyPrice(monthlyPrice: number, monthsDiscount: number = 2): number {
  return monthlyPrice * (12 - monthsDiscount);
}

/**
 * Format savings text for yearly plans
 */
export function formatYearlySavings(monthlyPrice: number, yearlyPrice: number, currency: string): string {
  const monthlyCost = yearlyPrice / 12;
  const savings = monthlyPrice - monthlyCost;
  const savingsPercentage = Math.round((savings / monthlyPrice) * 100);

  return `Save ${formatCurrency(savings * 12, currency)} (${savingsPercentage}%) annually`;
}