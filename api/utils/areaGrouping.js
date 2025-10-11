export const getAreaGroup = (tableNumber) => {
  if (!tableNumber) return null;
  const code = String(tableNumber).trim().charAt(0).toUpperCase();// Extract first character ex: "A1" -> "A"

  if (code >= 'A' && code <= 'I') return 'group_1';
  if (code >= 'J' && code <= 'O') return 'group_2';
  if (code >= 'S' && code <= 'Z') return 'group_3';

  return null;
};
