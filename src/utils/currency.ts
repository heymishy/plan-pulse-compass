export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
) => {
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
