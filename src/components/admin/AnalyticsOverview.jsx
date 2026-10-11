import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router'
import {formatPrice} from '../../data/store'
import {orderStatusLabel} from '../../utils/operations'

function Sparkline({values,label}) {
  const max=Math.max(1,...values)
  const points=values.map((value,index)=>`${4+index/Math.max(1,values.length-1)*232},${52-value/max*44}`).join(' ')
  return <svg className="metric-sparkline" viewBox="0 0 240 60" role="img" aria-label={label}><path d={`M ${points.replaceAll(' ',' L ')} L 236 58 L 4 58 Z`} fill="currentColor" opacity=".1"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>
}
export function SummaryMetrics({data}) {
  const rows=[
    ['Net order value',formatPrice(data.orderValue),'Delivered value after recorded refunds','gold',data.trend.map(day=>day.orderValue)],
    ['Orders',data.orders,`${data.completedOrders??data.statuses.completed??0} delivered`,'mint',data.trend.map(day=>day.orders)],
    ['Net units sold',data.netUnitsSold??data.unitsSold,'Delivered units after full-order refunds','lavender',data.trend.map(day=>day.unitsSold)],
    ['Recorded refunds',formatPrice(data.simulatedRefundValue??0),'Refunds for orders created in this period','coral',data.trend.map(day=>day.simulatedRefundValue??0)],
  ]
  return <div className="metric-grid finishing-metrics">{rows.map(([label,value,hint,tone,values])=><article className={`metric metric-${tone}`} key={label}><span className="metric-label">{label}</span><strong>{value}</strong><small>{hint}</small><Sparkline values={values} label={`${label} over the selected order dates`}/></article>)}</div>
}

export function SalesTrend({data}) {
  const container=useRef(null)
  const [width,setWidth]=useState(700)
  const [selected,setSelected]=useState(null)
  useEffect(()=>{
    const observer=new ResizeObserver(([entry])=>setWidth(Math.max(200,Math.floor(entry.contentRect.width))))
    observer.observe(container.current)
    return()=>observer.disconnect()
  },[])
  const rows=data.trend
  const max=Math.max(1,...rows.map(row=>Math.max(row.orderValue,row.revenue)))
  const left=58,right=16,top=24,bottom=250,plot=width-left-right
  const x=index=>left+(index+.5)/Math.max(1,rows.length)*plot
  const y=value=>bottom-value/max*(bottom-top)
  const paid=rows.map((row,index)=>`${x(index)},${y(row.revenue)}`).join(' ')
  const step=Math.max(1,Math.ceil(rows.length/(width<500?3:6)))
  return <section className="admin-panel analytics-panel finishing-trend">
    <div className="panel-heading"><div><h2>Order value over time</h2><p>By original order date · net of recorded refunds</p></div><div className="chart-legend"><span>Net order value</span><span>Actual paid revenue</span></div></div>
    <div ref={container} className="responsive-trend">
      <svg viewBox={`0 0 ${width} 294`} role="img" aria-label="Net delivered order value bars and actual paid revenue line. Each day is keyboard accessible; exact values are below.">
        {[0,1,2,3,4].map(tick=><g key={tick}><line x1={left} x2={width-right} y1={y(max*tick/4)} y2={y(max*tick/4)} className="chart-guide"/><text x={left-10} y={y(max*tick/4)+4} textAnchor="end">{new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(max*tick/4)}</text></g>)}
        {rows.map((row,index)=><g key={row.date}><rect x={x(index)-Math.max(1,plot/rows.length*.6)/2} width={Math.max(1,plot/rows.length*.6)} y={y(row.orderValue)} height={Math.max(2,bottom-y(row.orderValue))} className="sales-bar" tabIndex={0} role="button" aria-label={`${row.date}: net value ${formatPrice(row.orderValue)}, paid revenue ${formatPrice(row.revenue)}, ${row.orders} orders`} onFocus={()=>setSelected(row)} onMouseEnter={()=>setSelected(row)} onClick={()=>setSelected(row)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(row)}}}><title>{row.date}: {formatPrice(row.orderValue)}</title></rect>{(index%step===0||index===rows.length-1)&&<text x={x(index)} y={278} textAnchor="middle">{row.date.slice(5)}</text>}</g>)}
        <polyline points={paid} fill="none" stroke="#9cdbcb" strokeWidth="3" strokeDasharray="6 4"/>
      </svg>
    </div>
    <p className="chart-readout" role="status">{selected?`${selected.date} · ${formatPrice(selected.orderValue)} net value · ${formatPrice(selected.revenue)} actual paid revenue · ${selected.orders} orders`:'Select a day to see its values.'}</p>
    <details><summary>Exact daily values</summary><div className="table-scroll" role="region" tabIndex={0} aria-label="Daily order values"><table><thead><tr><th>Order date (UTC)</th><th>Net value</th><th>Actual paid revenue</th><th>Orders</th><th>Net units</th></tr></thead><tbody>{rows.map(row=><tr key={row.date}><td>{row.date}</td><td>{formatPrice(row.orderValue)}</td><td>{formatPrice(row.revenue)}</td><td>{row.orders}</td><td>{row.unitsSold}</td></tr>)}</tbody></table></div></details>
  </section>
}

export function FulfillmentSummary({data}) {
  const total=data.orders||0
  const delivered=data.statuses.completed||0
  const percent=total?Math.round(delivered/total*100):0
  const states=[['pending',data.statuses.pending||0],['processing',(data.statuses.processing||0)+(data.statuses.confirmed||0)],['shipped',data.statuses.shipped||0],['completed',delivered],['cancelled',data.statuses.cancelled||0],['delayed',data.statuses.delayed||0]]
  return <section className="admin-panel fulfillment-summary"><h2>Fulfillment</h2><div className="fulfillment-progress"><svg viewBox="0 0 140 140" role="img" aria-label={`${delivered} of ${total} orders delivered, ${percent} percent`}><circle cx="70" cy="70" r="54" fill="none" stroke="#ffffff15" strokeWidth="10"/><circle cx="70" cy="70" r="54" fill="none" stroke="#9cdbcb" strokeWidth="10" strokeLinecap="round" pathLength="100" strokeDasharray={`${percent} 100`} transform="rotate(-90 70 70)"/><text x="70" y="75" textAnchor="middle">{percent}%</text></svg><p><strong>{delivered} of {total}</strong><br/>orders delivered</p></div><div className="fulfillment-rows">{states.map(([state,count])=><Link key={state} to={`/admin/orders?status=${state}`}><span>{orderStatusLabel(state)}</span><strong>{count}</strong><span className="fulfillment-track"><span style={{width:`${total?count/total*100:0}%`}}/></span></Link>)}</div></section>
}

export function AccountingSummary({data}) {
  return <section className="admin-panel accounting-summary"><h2>Payment &amp; inventory</h2><dl>{[
    ['Actual paid revenue',formatPrice(data.revenue)],['Simulated gross value',formatPrice(data.simulatedGrossValue??0)],['Simulated net value',formatPrice(data.simulatedNetValue??0)],['Refunds recorded in this period',formatPrice(data.refundEvents?.amount??0)],['Low stock',data.inventory.lowStock],['Out of stock',data.inventory.outOfStock],
  ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>Refund activity uses refund dates. Order value uses original order dates.</p><Link className="text-link" to="/admin/inventory">Review inventory</Link></section>
}
