export const orderCategories = [
  ['All orders', ''],
  ['Orders', 'pending'],
  ['Processing', 'processing'],
  ['To be delivered', 'shipped'],
  ['Completed', 'completed'],
  ['Canceled', 'cancelled'],
  ['Delayed', 'delayed'],
]

export function orderCategoryQuery(params, status) {
  const next = new URLSearchParams(params)
  if (status) next.set('status', status)
  else next.delete('status')
  next.set('page', '1')
  return next
}

export function orderTimeline(order) {
  if (order.statusHistory?.length) return order.statusHistory
  const events = order.createdAt ? [{ status: 'pending', at: order.createdAt }] : []
  if (order.status && order.status !== 'pending' && order.updatedAt)
    events.push({ status: order.status, at: order.updatedAt })
  return events
}

export function watchVisibleOrders(refresh, page = document, browser = window) {
  const visibleRefresh = () => {
    if (page.visibilityState === 'visible') refresh()
  }
  const timer = browser.setInterval(visibleRefresh, 30000)
  page.addEventListener('visibilitychange', visibleRefresh)
  browser.addEventListener('focus', visibleRefresh)
  return () => {
    browser.clearInterval(timer)
    page.removeEventListener('visibilitychange', visibleRefresh)
    browser.removeEventListener('focus', visibleRefresh)
  }
}
