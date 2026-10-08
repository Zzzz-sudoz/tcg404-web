import { Link } from 'react-router'
import { formatPrice } from '../../data/store'
import CardImage from './CardImage'

export default function ProductCard({ product, quickAdd = false }) {
  const stockLabel =
    product.stock === 0
      ? 'Out of stock'
      : product.stock <= 2
        ? `Only ${product.stock} left`
        : 'In stock'

  return (
    <article className={`product-card card-game-${product.game}`}>
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
      {quickAdd &&
        (product.stock ? (
          <Link className="button quick-add" to={`/product/${product.slug}`}>
            Add to cart
          </Link>
        ) : (
          <button className="button quick-add" disabled>
            Out of stock
          </button>
        ))}
    </article>
  )
}
