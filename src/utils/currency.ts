// Map currency symbols to ISO 4217 currency codes
const currencySymbolToCode: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  '₽': 'RUB',
  '¢': 'USD', // Cents
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  INR: 'INR',
  RUB: 'RUB',
};

export const formatCurrency = (
  amount: number,
  currencySymbolOrCode = '$',
  locale = 'en-US'
) => {
  // Convert currency symbol to ISO 4217 code
  const currency = currencySymbolToCode[currencySymbolOrCode] || 'USD';

  // Handle invalid amounts
  if (
    !isFinite(amount) ||
    isNaN(amount) ||
    amount === null ||
    amount === undefined
  ) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
