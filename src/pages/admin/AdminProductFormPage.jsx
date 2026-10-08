import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import { useApiQuery } from '../../hooks/useApiQuery'
import ProductForm from '../../components/admin/ProductForm'
const blank = {
  name: '',
  sku: '',
  game: 'pokemon',
  setName: '',
  cardNumber: '',
  rarity: '',
  condition: 'Near mint',
  price: '',
  stock: '',
  lowStockThreshold: 2,
  imageUrl: '',
  isFeatured: false,
  isActive: true,
}
export default function AdminProductFormPage() {
  const { id } = useParams()
  return id ? <ExistingProduct key={id} id={id} /> : <Editor initial={blank} />
}
function ExistingProduct({ id }) {
  const response = useApiQuery(`/admin/products/${encodeURIComponent(id)}`)
  if (response.loading)
    return (
      <div className="admin-page empty-panel" role="status">
        Loading inventory record...
      </div>
    )
  if (response.error)
    return (
      <div className="admin-page empty-panel" role="alert">
        <h1>Record unavailable.</h1>
        <p>{response.error}</p>
        <Link className="button" to="/admin/products">
          Return to products
        </Link>
      </div>
    )
  return <Editor initial={response.data} />
}
function Editor({ initial }) {
  const navigate = useNavigate()
  const { products, rememberProducts, upsertProduct } = usePrototype()
  useEffect(() => {
    if (initial.id) rememberProducts([initial])
  }, [initial, rememberProducts])
  return (
    <div className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">PRODUCT EDITOR</p>
          <h1>
            {initial.id ? 'Refine the single.' : 'Make room for a new card.'}
          </h1>
        </div>
      </header>
      <ProductForm
        initial={initial}
        products={products}
        onCancel={() => navigate('/admin/products')}
        onSave={async (product) => {
          await upsertProduct(product)
          navigate('/admin/products?saved=true')
        }}
      />
    </div>
  )
}
