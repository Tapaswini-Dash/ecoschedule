export function formatWasteType(value) {
  if (value === 'wet_and_dry') return 'Wet + dry'
  return String(value || 'Other').replaceAll('_', ' ')
}
