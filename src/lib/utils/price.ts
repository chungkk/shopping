/**
 * Convert Euro amount to cents (integer)
 * @param euros - Price in euros (e.g., 1.99)
 * @returns Price in cents (e.g., 199)
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convert cents to Euro amount
 * @param cents - Price in cents (e.g., 199)
 * @returns Price in euros (e.g., 1.99)
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Format price in cents to German Euro format
 * @param cents - Price in cents (e.g., 199)
 * @returns Formatted price string (e.g., "1,99 €")
 */
export function formatPrice(cents: number): string {
  const euros = centsToEuros(cents);
  return euros.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
}

/**
 * Format price for Vietnamese display (German format but clear)
 * @param cents - Price in cents
 * @returns Formatted price (e.g., "1,99 €")
 */
export function formatPriceVi(cents: number): string {
  return formatPrice(cents);
}

/**
 * Parse German price string to cents
 * @param priceText - Price string (e.g., "1,99 €", "1.99€", "1,99")
 * @returns Price in cents or null if parsing fails
 */
export function parsePriceText(priceText: string): number | null {
  if (!priceText) return null;

  // Remove currency symbols and whitespace
  let cleaned = priceText.replace(/[€\s]/g, '').trim();

  // Handle German format (comma as decimal separator)
  // Also handle cases with thousand separator (e.g., "1.299,99")
  if (cleaned.includes(',')) {
    // Remove thousand separators (dots before comma)
    cleaned = cleaned.replace(/\.(?=.*,)/g, '');
    // Replace comma with dot for parsing
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;

  return eurosToCents(parsed);
}

/**
 * Calculate discount percentage
 * @param originalPrice - Original price in cents
 * @param currentPrice - Current/sale price in cents
 * @returns Discount percentage (0-100) or null if invalid
 */
export function calculateDiscount(
  originalPrice: number | null,
  currentPrice: number
): number | null {
  if (!originalPrice || originalPrice <= currentPrice) return null;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Format unit price text
 * @param unitPrice - Price per unit in cents
 * @param unitType - Unit type (kg, liter, etc.)
 * @returns Formatted unit price (e.g., "2,99 € / 1 kg")
 */
export function formatUnitPrice(
  unitPrice: number,
  unitType: 'piece' | 'kg' | 'liter' | '100g' | '100ml'
): string {
  const unitLabels: Record<string, string> = {
    piece: 'Stück',
    kg: '1 kg',
    liter: '1 l',
    '100g': '100 g',
    '100ml': '100 ml',
  };

  return `${formatPrice(unitPrice)} / ${unitLabels[unitType] || unitType}`;
}

/**
 * Parse unit price text to extract price and unit type
 * @param unitPriceText - Unit price text (e.g., "2,99 € / 1 kg")
 * @returns Object with unitPrice (cents) and unitType, or null
 */
export function parseUnitPriceText(
  unitPriceText: string
): { unitPrice: number; unitType: string } | null {
  if (!unitPriceText) return null;

  const match = unitPriceText.match(/([0-9.,]+)\s*€?\s*\/\s*(.+)/);
  if (!match) return null;

  const unitPrice = parsePriceText(match[1]);
  if (unitPrice === null) return null;

  const unitText = match[2].toLowerCase().trim();
  let unitType = 'piece';

  if (unitText.includes('kg')) unitType = 'kg';
  else if (unitText.includes('l') && !unitText.includes('ml')) unitType = 'liter';
  else if (unitText.includes('100 g') || unitText.includes('100g')) unitType = '100g';
  else if (unitText.includes('100 ml') || unitText.includes('100ml')) unitType = '100ml';

  return { unitPrice, unitType };
}
