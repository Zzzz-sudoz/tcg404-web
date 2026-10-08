import { Link } from 'react-router'
import { useState } from 'react'
import { usePrototype } from '../../hooks/usePrototype'
import { formatPrice } from '../../data/store'
import CardImage from './CardImage'

export default function ProductCard({ product, quickAdd = false }) {
  const { addToCart } = usePrototype()
  const [message, setMessage] = useState('')
  const stockLabel =
    product.stock === 0
      ? 'Out of stock'
      : product.stock <= 2
        ? `Only ${product.stock} left`
        : 'In stock'

  return (
    <article className="product-card">
      <Link
        className="product-media"
        to={`/product/${product.slug}`}
        aria-label={`Preview ${product.name}`}
      >
        <CardImage src={product.imageUrl} name={product.name} />
        <span className="media-index">{product.cardNumber}</span>
      </Link>
      <div className="product-meta">
        <span>{product.gameName}</span>
        <span className={product.stock <= 2 ? 'stock stock-low' : 'stock'}>
          {stockLabel}
        </span>
      </div>
      <h3>
        <Link to={`/product/${product.slug}`}>{product.name}</Link>
      </h3>
      {product.source === 'demo-fallback' && (
        <p className="muted">Sample inventory · demo price and stock</p>
      )}
      <p className="product-set">{product.setName}</p>
      <p className="product-condition">
        {product.rarity} · {product.condition}
      </p>
      <div className="product-bottom">
        <strong>{formatPrice(product.price)}</strong>
        <Link to={`/product/${product.slug}`} className="product-preview">
          Preview<span className="sr-only"> {product.name}</span>
        </Link>
      </div>
      {quickAdd && (
        <>
          <button
            className="button quick-add"
            disabled={!product.stock}
            onClick={() =>
              setMessage(addToCart(product.id, 1) || 'Added to your cart.')
            }
          >
            {product.stock ? 'Add to cart' : 'Out of stock'}
          </button>
          <span className="feedback" role="status">
            {message}
          </span>
        </>
      )}
    </article>
  )
}
