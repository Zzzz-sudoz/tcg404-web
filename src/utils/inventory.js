export function mergeInventory(current, items) {
  const merged = new Map(current.map((product) => [product.id, product]))
  for (const product of items)
    merged.set(product.id, { ...merged.get(product.id), ...product })
  return [...merged.values()]
}

export function reconcileStockDraft(draft, product) {
  if (draft?.seenRevision === product.revision) return draft
  if (draft?.dirty) return { ...draft, seenRevision: product.revision }
  return {
    stock: String(product.stock),
    lowStockThreshold: String(product.lowStockThreshold),
    note: '',
    revision: product.revision,
    seenRevision: product.revision,
    dirty: false,
  }
}
