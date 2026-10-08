export default function SavedReference({ product }) {
  const reference = product.marketReference
  if (!reference) return null
  const date = reference.updatedAt ? new Date(reference.updatedAt) : null
  return (
    <div className="import-notice">
      <strong>
        Saved market reference: {reference.price} {reference.currency}
      </strong>
      <p>
        {reference.condition && `Reference condition: ${reference.condition}. `}
        {reference.finish && `Reference finish: ${reference.finish}. `}
        {reference.source ? `Source: ${reference.source}. ` : ''}
        {date && !Number.isNaN(date.getTime())
          ? `Provider date: ${date.toLocaleDateString('en-PH')}. `
          : 'Provider date unavailable. '}
        This snapshot is separate from the PHP selling price. No automatic
        refresh.
      </p>
    </div>
  )
}
