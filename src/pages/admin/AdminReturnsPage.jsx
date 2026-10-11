import {useState} from 'react'
import {Link} from 'react-router'
import {useApiQuery} from '../../hooks/useApiQuery'
import QueryState from '../../components/common/QueryState'
import Pagination from '../../components/common/Pagination'
import {returnStatusLabel} from '../../utils/afterSales'
import {formatPrice} from '../../data/store'

export default function AdminReturnsPage() {
  const [state,setState]=useState('')
  const [page,setPage]=useState(1)
  const [revision,setRevision]=useState(0)
  const response=useApiQuery('/admin/returns',`state=${state}&page=${page}`,revision)
  return <div className="admin-page">
    <header className="admin-heading"><div><h1>Returns.</h1><p>Review requests, inspect returned cards and record refunds.</p></div></header>
    <div className="return-filters"><label>Request status<select value={state} onChange={event=>{setState(event.target.value);setPage(1)}}><option value="">All requests</option>{['requested','approved','rejected','received','closed'].map(value=><option value={value} key={value}>{returnStatusLabel(value)}</option>)}</select></label><button className="button" onClick={()=>setRevision(n=>n+1)} disabled={response.loading}>Refresh</button></div>
    <QueryState response={response} retry={()=>setRevision(n=>n+1)}/>
    {!response.loading&&!response.error&&<section className="admin-panel">
      {!response.data.length?<p>No return requests in this view.</p>:<div className="table-scroll" role="region" aria-label="Return requests" tabIndex={0}><table><thead><tr><th>Order</th><th>Requested</th><th>Status</th><th>Amount</th><th>Review</th></tr></thead><tbody>{response.data.map(record=><tr key={record.id}><td>{record.orderNumber}</td><td>{new Date(record.createdAt).toLocaleDateString()}</td><td>{returnStatusLabel(record.state)}</td><td>{formatPrice(record.total)}</td><td><Link to={`/admin/returns/${record.id}`} className="text-link">View request</Link></td></tr>)}</tbody></table></div>}
      {response.meta.totalPages>1&&<Pagination page={page} pages={response.meta.totalPages} onChange={setPage}/>}
    </section>}
  </div>
}
