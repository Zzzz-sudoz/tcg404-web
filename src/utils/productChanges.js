const fields = ['name', 'sku', 'game', 'setName', 'cardNumber', 'rarity', 'condition', 'slug', 'description', 'imageUrl']
const numbers = ['price', 'stock', 'lowStockThreshold']

export function productHasChanges(initial, values) {
  return fields.some(key => String(initial[key] ?? '') !== String(values[key] ?? '')) ||
    numbers.some(key => {
      const before = String(initial[key] ?? '')
      const after = String(values[key] ?? '')
      return before !== after && (!before.trim() || !after.trim() || Number(before) !== Number(after))
    }) ||
    Boolean(initial.isFeatured) !== Boolean(values.isFeatured) ||
    (initial.isActive !== false) !== (values.isActive !== false)
}
