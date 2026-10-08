import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import { summarizeCart } from '../../utils/cart'
import { formatPrice } from '../../data/store'
import CardImage from '../../components/store/CardImage'
import Icon from '../../components/common/Icon'
import { useCartInventory } from '../../hooks/useCartInventory'

export default function CartPage() {
  const {
    cart,
    products,
    setCartQuantity,
    removeFromCart,
    persistenceNotice,
    dismissOrderReceipt,
  } = usePrototype()
  useEffect(() => {
    dismissOrderReceipt()
  }, [dismissOrderReceipt])
  const [errors, setErrors] = useState({})
  const summary = summarizeCart(cart, products)
  const inventory = useCartInventory()
  return (
    <div className="page-width workshop-page">
      <header className="page-intro">
        <p className="eyebrow">YOUR COLLECTOR’S TRAY</p>
        <h1>Keep the good ones.</h1>
        <p>
          {summary.count} {summary.count === 1 ? 'card' : 'cards'} in your cart
          · {persistenceNotice ? 'Current tab' : 'Saved in this browser'}
        </p>
      </header>
      {persistenceNotice && (
        <p className="persistence-notice" role="status">
          {persistenceNotice}
        </p>
      )}
      {cart.length > 0 && inventory.loading && (
        <p role="status">Checking current prices and stock...</p>
      )}
      {inventory.error && (
        <p role="alert">
          {inventory.error}{' '}
          <button className="button" onClick={inventory.retry}>
            Check inventory again
          </button>
        </p>
      )}
      {!cart.length ? (
        <div className="empty-panel">
          <h2>Your tray is waiting.</h2>
          <p>Find a single that belongs in your collection.</p>
          <Link className="button button-primary" to="/shop">
            Explore singles
          </Link>
        </div>
      ) : (
        <div className="commerce-layout">
          <section className="cart-lines" aria-label="Cart items">
            {summary.lines.map((line) => (
              <article className="cart-line" key={line.id}>
                <div className="cart-art">
                  <CardImage
                    src={line.product?.imageUrl}
                    name={line.product?.name || 'Unavailable card'}
                  />
                </div>
                <div>
                  <h2>
                    {line.product?.slug && line.product?.name ? (
                      <Link to={`/product/${line.product.slug}`}>
                        {line.product.name}
                      </Link>
                    ) : (
                      'Unavailable card'
                    )}
                  </h2>
                  <p>{line.product?.setName}</p>
                  <p className="muted">
                    {line.product?.condition} ·{' '}
                    {formatPrice(line.product?.price || 0)} each
                  </p>
                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      step="1"
                      max={Math.min(999, line.product?.stock || 1)}
                      value={line.quantity}
                      onChange={(e) =>
                        setErrors({
                          ...errors,
                          [line.id]: setCartQuantity(
                            line.id,
                            Number(e.target.value),
                          ),
                        })
                      }
                    />
                  </label>
                  {errors[line.id] && (
                    <p role="alert" className="field-error">
                      {errors[line.id]}
                    </p>
                  )}
                  {line.priceChanged && (
                    <p role="status">
                      Price changed since adding. Current price is shown.
                    </p>
                  )}
                  {line.stockChanged && (
                    <p role="status">
                      Stock changed since adding. Current availability is{' '}
                      {line.product?.stock}.
                    </p>
                  )}
                  {line.reason && (
                    <p role="alert" className="field-error">
                      {line.reason}
                    </p>
                  )}
                  <button
                    type="button"
                    className="cart-remove"
                    aria-label={`Remove ${line.product?.name || 'card'} from cart`}
                    onClick={() => removeFromCart(line.id)}
                  >
                    <Icon name="trash" />
                    Remove
                  </button>
                </div>
                <strong>{formatPrice(line.total)}</strong>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <p className="eyebrow">THE TALLY</p>
            <h2>Your collection, next.</h2>
            <div className="row-between">
              <span>Subtotal</span>
              <strong>{formatPrice(summary.subtotal)}</strong>
            </div>
            <p>
              Choose your payment method and delivery address at checkout.
            </p>
            {summary.valid && !inventory.loading && !inventory.error ? (
              <Link className="button button-primary" to="/checkout">
                Review checkout →
              </Link>
            ) : (
              <p role="alert">
                {inventory.loading
                  ? 'Checking current inventory before checkout.'
                  : inventory.error
                    ? 'Check inventory again before checkout.'
                    : 'Resolve unavailable quantities before checkout.'}
              </p>
            )}
            <Link className="text-link" to="/shop">
              Continue collecting
            </Link>
            <p className="prototype-note">
              Prices and availability are checked against current store
              inventory. Delivery details are entered only at checkout.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
