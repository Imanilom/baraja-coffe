export function convertToBaseUnit(quantity, unit) {
  switch (unit) {
    case 'kg': return quantity * 1000;
    case 'grams': return quantity;
    case 'liters': return quantity * 1000;
    case 'ml': return quantity;
    case 'pieces': return quantity;
    default: throw new Error(`Unknown unit: ${unit}`);
  }
}