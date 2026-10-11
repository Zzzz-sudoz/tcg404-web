import {useState} from 'react'
import {useApiQuery} from '../../hooks/useApiQuery'
import {useFavorites} from '../../hooks/useFavorites'
import ProductCard from '../../components/store/ProductCard'
import QueryState from '../../components/common/QueryState'
import Pagination from '../../components/common/Pagination'
import {apiError} from '../../utils/api'

export default function FavoritesPage() {
  const [page,setPage]=useState(1)
  const [revision,setRevision]=useState(0)
  const [error,setError]=useState('')
  const favorites=useFavorites()
  const response=useApiQuery('/favorites',`page=${page}&limit=12`,revision+favorites.revision)
  return <section className="favorites-page">
    <h1>Your favorites.</h1><p>Keep the cards you want to come back to.</p>
    <QueryState response={response} retry={()=>setRevision(n=>n+1)}/>
    {error&&<p role="alert" className="field-error">{error}</p>}
    {!response.loading&&!response.error&&<>
      {!response.data.length&&<p className="admin-panel">No favorites yet. Save a card using its heart.</p>}
      <div className="product-grid">{response.data.map(row=>row.available&&row.product?<ProductCard key={row.productId} product={row.product} quickAdd/>:<article key={row.productId} className="admin-panel"><h2>{row.product?.name||'Unavailable card'}</h2><p>This card is currently unavailable.</p><button className="button" disabled={favorites.pending.has(row.productId)} onClick={async()=>{try{await favorites.toggle(row.productId, true);setRevision(n=>n+1)}catch(e){setError(apiError(e))}}}>Remove favorite</button></article>)}</div>
      {response.meta.totalPages>1&&<Pagination page={page} pages={response.meta.totalPages} onChange={setPage}/>}
    </>}
  </section>
}
