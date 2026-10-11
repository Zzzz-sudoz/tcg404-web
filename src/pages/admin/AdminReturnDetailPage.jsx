import {useRef,useState} from 'react'
import {Link,useParams} from 'react-router'
import {useApiQuery} from '../../hooks/useApiQuery'
import {api,apiError} from '../../utils/api'
import {returnStatusLabel} from '../../utils/afterSales'
import {formatPrice} from '../../data/store'
import QueryState from '../../components/common/QueryState'
import Dialog from '../../components/common/Dialog'

export default function AdminReturnDetailPage() {
  const {id}=useParams()
  const [revision,setRevision]=useState(0)
  const response=useApiQuery(`/admin/returns/${id}`,'',revision)
  return <div className="admin-page"><Link className="text-link" to="/admin/returns">Back to returns</Link><QueryState response={response} retry={()=>setRevision(n=>n+1)}/>{!response.loading&&!response.error&&<ReturnReview key={`${id}-${response.data.revision}`} record={response.data} refresh={()=>setRevision(n=>n+1)}/>}</div>
}

function ReturnReview({record,refresh}) {
  const [action,setAction]=useState('')
  const [reason,setReason]=useState('')
  const [inspection,setInspection]=useState(record.items.map(item=>({productId:item.productId,restock:false,reason:''})))
  const [busy,setBusy]=useState(false)
  const pending=useRef(false)
  const [error,setError]=useState('')
  async function submit(event) {
    event.preventDefault()
    if(pending.current)return
    pending.current=true;setBusy(true);setError('')
    try {
      await api.patch(`/admin/returns/${record.id}`,{action,revision:record.revision,...(action==='reject'?{reason}:{}),...(action==='receive'?{inspection}:{})})
      setAction('');refresh()
    } catch(e){setError(apiError(e))} finally{pending.current=false;setBusy(false)}
  }
  return <>
    <header className="admin-heading"><div><h1>{returnStatusLabel(record.state)}</h1><p>{record.orderNumber}</p></div><Link className="button" to={`/admin/orders/${record.orderId}`}>View original order</Link></header>
    <div className="commerce-layout">
      <section className="admin-panel"><h2>Customer request</h2><p className="preserve-lines">{record.reason}</p><h2>Returned cards</h2><div className="return-items">{record.items.map(item=><div key={item.productId}><strong>{item.name}</strong><p>{item.sku} · {item.condition}</p><p>Quantity {item.quantity} · {formatPrice(item.lineTotal)}</p></div>)}</div><h2>Request history</h2><ol className="return-history">{record.history.map((event,index)=><li key={index}><strong>{returnStatusLabel(event.state)}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time>{event.reason&&<p>{event.reason}</p>}</li>)}</ol></section>
      <aside className="order-summary"><h2>Return total</h2><strong>{formatPrice(record.total)}</strong><p>Includes the original shipping and tax.</p>
        {record.inspection.length>0&&<><h2>Inspection</h2>{record.inspection.map(item=><p key={item.productId}><strong>{record.items.find(line=>line.productId===item.productId)?.name}</strong><br/>{item.restock?'Restocked':'Not restocked'} · {item.reason}</p>)}</>}
        {record.refund&&<><h2>Refund recorded</h2><p>{formatPrice(record.refund.amount)} · {new Date(record.refund.at).toLocaleString()}</p><p className="payment-reference">{record.refund.reference}</p></>}
        <div className="return-actions">
          {record.state==='requested'&&<><button className="button" onClick={()=>setAction('reject')}>Decline request</button><button className="button button-primary" onClick={()=>setAction('approve')}>Approve return</button></>}
          {record.state==='approved'&&<button className="button button-primary" onClick={()=>setAction('receive')}>Receive &amp; inspect</button>}
          {record.state==='received'&&<button className="button button-primary" onClick={()=>setAction('close')}>Record refund</button>}
        </div>
      </aside>
    </div>
    <Dialog open={!!action} onClose={()=>setAction('')} labelledBy="return-review-heading" className="after-sales-dialog" busy={busy} focusCancel>
      <h2 id="return-review-heading">{{approve:'Approve this return?',reject:'Decline this request?',receive:'Receive and inspect',close:'Record this refund?'}[action]}</h2>
      <form className="after-sales-form" onSubmit={submit}>
        {action==='approve'&&<p>Approval allows the customer to return the items. Stock and refund totals stay unchanged until inspection.</p>}
        {action==='reject'&&<label>Reason for declining<textarea value={reason} onChange={event=>setReason(event.target.value)} required maxLength={500}/></label>}
        {action==='receive'&&<><p>Confirm the cards have arrived. Restock only inspected cards that match the original condition. Saving records these inventory decisions once.</p>{record.items.map((item,index)=><fieldset key={item.productId}><legend>{item.name} · {item.quantity} cards</legend><label>Inventory decision<select value={String(inspection[index].restock)} onChange={event=>setInspection(values=>values.map((value,i)=>i===index?{...value,restock:event.target.value==='true'}:value))}><option value="false">Do not restock</option><option value="true">Restock</option></select></label><label>Inspection reason<textarea required maxLength={500} value={inspection[index].reason} onChange={event=>setInspection(values=>values.map((value,i)=>i===index?{...value,reason:event.target.value}:value))}/></label></fieldset>)}</>}
        {action==='close'&&<p>Record the full refund of {formatPrice(record.total)} against the original order. Inventory decisions have already been recorded.</p>}
        {error&&<p role="alert" className="field-error">{error}</p>}
        <button className="button button-primary" disabled={busy}>{busy?'Saving...':'Confirm'}</button>
      </form>
    </Dialog>
  </>
}
