import LoadingLayout from '../../components/common/LoadingLayout'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import { useAuth } from '../../hooks/useAuth'
import { formatPrice } from '../../data/store'
import { useApiQuery } from '../../hooks/useApiQuery'
import CardImage from '../../components/store/CardImage'
import ProductCard from '../../components/store/ProductCard'
import NotFoundPage from './NotFoundPage'
import SavedReference from '../../components/store/SavedReference'

export default function ProductPage() {
  const { slug } = useParams()
  return <ProductDetail key={slug} slug={slug} />
}

function ProductDetail({ slug }) {
  const { user } = useAuth()
  const { products, addToCart, rememberProducts } = usePrototype()
  const [revision, setRevision] = useState(0)
  const response = useApiQuery(
    `/products/${encodeURIComponent(slug)}`,
    '',
    revision,
  )
  const product =
    response.data && !Array.isArray(response.data)
      ? response.data
      : response.loading
        ? products.find((item) => item.slug === slug || item.id === slug)
        : null
  useEffect(() => {
    if (product) rememberProducts([product])
  }, [product, rememberProducts])
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  if (response.loading && !product)
    return (
      <div className="page-width workshop-page">
        <LoadingLayout variant="detail" count={2} />
      </div>
    )
  if (response.status === 404) return <NotFoundPage />
  if (response.error || !product)
    return (
      <div className="page-width empty-panel" role="alert">
        <p>{response.error || 'Card unavailable.'}</p>
        <button className="button" onClick={() => setRevision((v) => v + 1)}>
          Try again
        </button>
      </div>
    )
  const related = products
    .filter(
      (p) =>
        p.id !== product.id && p.game === product.game && p.isActive !== false,
    )
    .slice(0, 4)
  return (
    <div className="page-width workshop-page">
      <p className="breadcrumb">
        <Link to="/shop">Card room</Link> / {product.gameName} / {product.name}
      </p>
      <div className="product-detail">
        <div className={`detail-stage stage-${product.game}`}>
          <span className="eyebrow">ARTWORK / {product.cardNumber}</span>
          <CardImage
            key={product.imageUrl}
            src={product.imageUrl}
            name={product.name}
            eager
          />
          <span className="detail-art-caption">{product.setName}</span>
        </div>
        <section className="detail-copy">
          <p className="eyebrow">
            {product.gameName} · {product.rarity}
          </p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="muted">Store selling price · PHP</p>
          <SavedReference product={product} />
          <dl className="metadata">
            {[
              ['Set', product.setName],
              ['Card number', product.cardNumber],
              ['Condition', product.condition],
              ['SKU', product.sku],
              [
                'Stock',
                product.stock ? `${product.stock} available` : 'Out of stock',
              ],
            ]
              .filter(
                ([, value]) =>
                  value !== null && value !== undefined && value !== '',
              )
              .map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          {!/demonstration|demo values|no payment|no physical|inventory is verified/i.test(
            product.description || '',
          ) && <p>{product.description}</p>}
          {product.notes && <p>{product.notes}</p>}
          {user?.role !== 'admin' && (
            <form
              className="add-cart-form"
              onSubmit={(e) => {
                e.preventDefault()
                setMessage(
                  addToCart(product.id, quantity) || 'Added to your cart.',
                )
              }}
            >
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  max={Math.min(10, product.stock || 1)}
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={!product.stock}
                />
              </label>
              <button className="button button-primary" disabled={!product.stock}>
                {product.stock ? 'Add to cart' : 'Out of stock'}
              </button>
            </form>
          )}
          <p role="status">{message}</p>
          {user?.role !== 'admin' && message === 'Added to your cart.' && (
            <Link className="text-link" to="/cart">
              View your cart →
            </Link>
          )}
        </section>
      </div>
      {related.length > 0 && (
        <section className="related-section">
          <div className="section-heading">
            <h2>More from this world.</h2>
            <Link to={`/shop?game=${product.game}`}>Explore the game →</Link>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} quickAdd />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
