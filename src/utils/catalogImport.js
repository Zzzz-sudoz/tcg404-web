import { validateProduct } from './productValidation.js'
export const catalogIdentity = (card) => `${card.source}:${card.externalId}`
export const importReviewErrors = (errors) =>
  errors.map((error) => ({
    ...error,
    identity: catalogIdentity(error),
    errors: error.fields || {},
  }))
export function prepareImports(selected, valuesByIdentity, existing) {
  const products = [],
    duplicates = [],
    errors = []
  const known = new Set(
    existing.filter((p) => p.externalId && p.source).map(catalogIdentity),
  )
  for (const card of selected) {
    const identity = catalogIdentity(card)
    if (known.has(identity)) {
      duplicates.push(identity)
      continue
    }
    known.add(identity)
    const values = valuesByIdentity[identity] || {}
    const result = validateProduct(
      {
        ...card,
        ...values,
        sku: values.sku || `IMP-${card.source}-${card.externalId}`,
        slug: values.slug || `${card.name || 'card'}-${card.externalId}`,
        lowStockThreshold: values.lowStockThreshold ?? 2,
        isActive: true,
        isNew: true,
      },
      [...existing, ...products],
    )
    if (Object.keys(result.errors).length) {
      errors.push({ identity, errors: result.errors })
      continue
    }
    products.push({
      ...result.product,
      id: `import-${identity}`,
      createdAt: new Date().toISOString(),
      marketReference:
        Number.isFinite(card.marketPrice) && card.marketCurrency
          ? {
              price: card.marketPrice,
              currency: card.marketCurrency,
              updatedAt: card.marketUpdatedAt || null,
            }
          : null,
    })
  }
  return { products, duplicates, errors }
}
