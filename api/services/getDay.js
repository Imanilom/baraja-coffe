export function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { weekday: 'long' }); // Output: 'Senin', 'Selasa', dll
}
