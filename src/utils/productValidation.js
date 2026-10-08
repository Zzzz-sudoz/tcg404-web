const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
export function validateProduct(values, products, editingId = null) {
  const errors = {}
  const product = { ...values }
  for (const key of ['name', 'game', 'setName', 'rarity', 'condition', 'sku']) {
    product[key] = String(values[key] || '').trim()
    if (!product[key]) errors[key] = 'This field is required.'
  }
  if (!['pokemon', 'one-piece', 'magic'].includes(product.game))
    errors.game = 'Choose a supported game.'
  product.slug = slugify(values.slug || values.name)
  if (!product.slug) errors.slug = 'Enter a valid name or slug.'
  if (
    products.some(
      (p) =>
        p.id !== editingId && p.sku.toLowerCase() === product.sku.toLowerCase(),
    )
  )
    errors.sku = 'This SKU already exists.'
  if (products.some((p) => p.id !== editingId && p.slug === product.slug))
    errors.slug = 'This URL slug already exists.'
  for (const key of ['price', 'stock', 'lowStockThreshold']) {
    product[key] = Number(values[key])
    if (
      values[key] === '' ||
      values[key] == null ||
      !Number.isFinite(product[key]) ||
      product[key] < 0 ||
      (key !== 'price' && !Number.isInteger(product[key]))
    )
      errors[key] =
        key === 'price'
          ? 'Enter a non-negative selling price.'
          : 'Enter a non-negative whole number.'
  }
  product.imageUrl = String(values.imageUrl || '').trim()
  if (
    product.imageUrl &&
    !/^https:\/\/[^\s]+$/.test(product.imageUrl) &&
    !/^\/(?!\/)[\w/.-]+$/.test(product.imageUrl)
  )
    errors.imageUrl = 'Use an HTTPS URL or a local asset path.'
  product.gameName = {
    pokemon: 'Pokémon',
    'one-piece': 'One Piece',
    magic: 'Magic: The Gathering',
  }[product.game]
  return { product, errors }
}
