export const orderStatusLabel = (status) =>
  ({
    pending: 'Pending',
    confirmed: 'Processing',
    processing: 'Processing',
    shipped: 'To be delivered',
    completed: 'Completed',
    cancelled: 'Canceled',
    delayed: 'Delayed',
  })[status] || status
export const orderStatuses = [
  'pending',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'delayed',
]
export function statusOptions(status) {
  return (
    {
      pending: ['processing', 'shipped', 'cancelled', 'delayed'],
      confirmed: ['processing', 'shipped', 'cancelled', 'delayed'],
      processing: ['shipped', 'cancelled', 'delayed'],
      shipped: ['completed', 'cancelled', 'delayed'],
      delayed: ['processing', 'shipped', 'cancelled'],
    }[status] || []
  )
}
export function validateStock(stock, lowStockThreshold) {
  return Object.fromEntries(
    Object.entries({ stock, lowStockThreshold })
      .filter(
        ([, value]) =>
          !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)),
      )
      .map(([key]) => [
        key,
        'Enter a nonnegative whole number within the safe integer limit.',
      ]),
  )
}
export function validateDateRange(from, to) {
  const valid = (date) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  if ((from && !valid(from)) || (to && !valid(to)))
    return 'Enter valid UTC calendar dates.'
  if (
    from &&
    to &&
    (to < from || (Date.parse(to) - Date.parse(from)) / 86400000 > 365)
  )
    return 'Choose an ordered range of at most 366 UTC days.'
  return ''
}
export function chartPoints(rows, offset, count, max) {
  return rows
    .map(
      (row, i) =>
        `${24 + ((offset + i) / Math.max(1, count - 1)) * 352},${156 - (row.value / Math.max(1, max)) * 132}`,
    )
    .join(' ')
}
