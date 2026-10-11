import {useRef,useState} from 'react'
import {api,apiError} from '../../utils/api'
import {returnStatusLabel} from '../../utils/afterSales'
import {formatPrice} from '../../data/store'
import Dialog from '../common/Dialog'

export default function OrderAfterSales({order,refresh,readOnly=false}) {
  const [action,setAction]=useState(null)
  const [busy,setBusy]=useState(false)
  const pending=useRef(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const record=order.returnRequest
  async function submit(event) {
    event.preventDefault()
    if(pending.current) return
    const reason=new FormData(event.currentTarget).get('reason')
    pending.current=true;setBusy(true);setError('')
    try {
      await api.post(`/orders/${order.id}/${action==='cancel'?'cancel':'returns'}`,{revision:order.revision,...(action==='return'?{reason}:{})})
      setMessage(action==='cancel'?'Order canceled.':'Return request submitted.')
      setAction(null);refresh()
    } catch(e) {setError(apiError(e))} finally {pending.current=false;setBusy(false)}
  }
  return <section className="order-after-sales">
    {!readOnly&&order.actions?.canCancel&&<button className="button" onClick={()=>{setError('');setAction('cancel')}}>Cancel order</button>}
    {!readOnly&&order.actions?.canReturn&&<button className="button" onClick={()=>{setError('');setAction('return')}}>Request return &amp; refund</button>}
    {message&&<p role="status">{message}</p>}
    {record&&<>
      <h2>{returnStatusLabel(record.state)}</h2><p className="preserve-lines">{record.reason}</p>
      <ol className="return-history">{record.history.map((event,index)=><li key={index}><strong>{returnStatusLabel(event.state)}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time>{event.reason&&<p>{event.reason}</p>}</li>)}</ol>
      {record.inspection?.length>0&&<ul>{record.inspection.map(item=><li key={item.productId}>{record.items.find(line=>line.productId===item.productId)?.name}: {item.restock?'Restocked':'Not restocked'} · {item.reason}</li>)}</ul>}
      {record.refund&&<p><strong>Refund recorded: {formatPrice(record.refund.amount)}</strong><br/>{new Date(record.refund.at).toLocaleString()}<br/><span className="payment-reference">{record.refund.reference}</span></p>}
    </>}
    <Dialog open={!!action} onClose={()=>setAction(null)} labelledBy="after-sales-heading" className="after-sales-dialog" busy={busy} focusCancel={action==='cancel'}>
      <h2 id="after-sales-heading">{action==='cancel'?'Cancel this order?':'Return this order'}</h2>
      <p>{action==='cancel'?'This cancels the order and returns its reserved stock.':'Return all items in this order. Your refund is reviewed after the items are received and inspected.'}</p>
      <form onSubmit={submit} className="after-sales-form">
        {action==='return'&&<label>Reason for return<textarea name="reason" required maxLength={500} rows={4}/></label>}
        {error&&<p role="alert" className="field-error">{error}</p>}
        <button className="button button-primary" disabled={busy}>{busy?'Saving...':action==='cancel'?'Cancel order':'Submit return request'}</button>
      </form>
    </Dialog>
  </section>
}
