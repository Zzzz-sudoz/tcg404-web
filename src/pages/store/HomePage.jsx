import { useEffect } from 'react'
import { Link } from 'react-router'
import { formatPrice, games } from '../../data/store'
import { usePrototype } from '../../hooks/usePrototype'
import Icon from '../../components/common/Icon'
import Section from '../../components/common/Section'
import CardImage from '../../components/store/CardImage'
import ProductCard from '../../components/store/ProductCard'
import CardWheel from '../../components/store/CardWheel'

function Hero() {
  const { products } = usePrototype()
  const active = products.filter((product) => product.isActive !== false)
  const spotlight =
    active.find(
      (product) =>
        product.isFeatured && product.game === 'pokemon' && product.imageUrl,
    ) ||
    active.find((product) => product.isFeatured && product.imageUrl) ||
    active.find((product) => product.imageUrl) ||
    active[0]
  const left = active.find(
    (product) =>
      product.game === 'one-piece' &&
      product.imageUrl &&
      product.id !== spotlight?.id,
  )
  const right = active.find(
    (product) =>
      product.game === 'magic' &&
      product.imageUrl &&
      product.id !== spotlight?.id,
  )
  return (
    <div className="hero-stage">
      <section className="hero page-width" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="hero-kicker">For the love of the game.</p>
          <h1 id="hero-heading">
            GOOD CARDS.
            <br />
            GREAT
            <br />
            <span>COLLECTIONS.</span>
          </h1>
          <p>
            The chase. The artwork. That one missing single. Find your next
            obsession across Pokemon, One Piece, and Magic.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/shop">
              Find your next card
              <Icon name="arrow" />
            </Link>
            <a className="text-link" href="#shop-by-game">
              Pick your game
            </a>
          </div>
          <div className="hero-footnote">
            <Icon name="cards" />
            <span>Collect. Trade. Discover.</span>
          </div>
        </div>
        {spotlight && (
          <div className="hero-display">
            <div className="display-label">
              <span>THE FEATURED DROP</span>
              <span>01 / 03</span>
            </div>
            <div className="hero-card-stack">
              {left && (
                <div className="hero-card hero-card-left">
                  <CardImage
                    key={left.imageUrl}
                    src={left.imageUrl}
                    name={left.name}
                    eager
                  />
                </div>
              )}
              {right && (
                <div className="hero-card hero-card-right">
                  <CardImage
                    key={right.imageUrl}
                    src={right.imageUrl}
                    name={right.name}
                    eager
                  />
                </div>
              )}
              <Link
                className="hero-card hero-card-center"
                to={`/product/${spotlight.slug}`}
                aria-label={`Preview ${spotlight.name}`}
              >
                <CardImage
                  key={spotlight.imageUrl}
                  src={spotlight.imageUrl}
                  name={spotlight.name}
                  eager
                />
              </Link>
            </div>
            <div className="display-caption">
              <div>
                <small>IN THE SPOTLIGHT</small>
                <p>
                  {spotlight.name}{' '}
                  <span>
                    {spotlight.cardNumber} · {spotlight.rarity}
                  </span>
                </p>
              </div>
              <Link
                to={`/product/${spotlight.slug}`}
                aria-label="Preview spotlight card"
              >
                <Icon name="arrow" />
              </Link>
            </div>
          </div>
        )}
      </section>
      <div className="collection-ribbon" aria-hidden="true">
        <span>NOT JUST CARDS. YOUR COLLECTION.</span>
        <span>POKEMON / ONE PIECE / MAGIC</span>
        <span>COLLECT. TRADE. DISCOVER.</span>
      </div>
    </div>
  )
}

function ProductCollection({ products, state }) {
  if (state === 'loading')
    return (
      <div className="collection-state" role="status">
        <span className="skeleton-bar" />
        <h3>Loading featured cards</h3>
        <p>Artwork and card information will appear here.</p>
        <Link className="text-link" to="/shop">
          Browse inventory
        </Link>
      </div>
    )
  if (state === 'error')
    return (
      <div className="collection-state" role="alert">
        <h3>Featured cards couldn’t load</h3>
        <p>Inventory is unavailable. Open the card room to try again.</p>
        <Link className="button button-secondary" to="/shop">
          Open card room
        </Link>
      </div>
    )
  if (state === 'empty' || products.length === 0)
    return (
      <div className="collection-state">
        <h3>No featured cards yet</h3>
        <p>Featured inventory will appear here. See the arrivals below.</p>
        <a className="text-link" href="#new-arrivals">
          See new arrivals
        </a>
      </div>
    )
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default function HomePage() {
  const { products, loading, error, refreshProducts } = usePrototype()
  const featured = products
    .filter((product) => product.isActive !== false && product.isFeatured)
    .slice(0, 4)
  const arrivals = products
    .filter((product) => product.isActive !== false)
    .toSorted((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 4)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return
    const animations = []
    const observer = new IntersectionObserver(
      (entries) => {
        if (preference.matches) return
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          animations.push(
            entry.target.animate(
              [
                { opacity: 0.3, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)' },
            ),
          )
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.08 },
    )
    document
      .querySelectorAll('.page-section, .collector-note')
      .forEach((section) => observer.observe(section))
    const stopMotion = () => {
      if (preference.matches)
        animations.forEach((animation) => animation.cancel())
    }
    preference.addEventListener('change', stopMotion)
    return () => {
      observer.disconnect()
      animations.forEach((animation) => animation.cancel())
      preference.removeEventListener('change', stopMotion)
    }
  }, [])

  return (
    <>
      <Hero />
      <CardWheel />
      <div className="page-width">
        <Section
          id="shop-by-game"
          title="PICK YOUR WORLD."
          note="Your favorite universe. Your next favorite card."
        >
          <div className="game-grid">
            {games.map((game) => (
              <Link
                className={`game-tile game-${game.id}`}
                to={`/shop?game=${game.id}`}
                key={game.id}
              >
                <div className="game-tile-copy">
                  <span className="catalog-index">{game.index} / SINGLES</span>
                  <h3>{game.name}</h3>
                  <p>{game.subtitle}</p>
                  <span className="game-tile-link">
                    Browse cards
                    <Icon name="arrow" />
                  </span>
                </div>
                <div className="game-art">
                  <CardImage src={game.image} name={game.name} />
                </div>
              </Link>
            ))}
          </div>
        </Section>
        <Section
          id="featured"
          title="THE CHASE LIST."
          note="Featured singles from the store collection."
          action={
            <Link className="text-link" to="/shop?featured=true">
              View all singles
              <Icon name="arrow" />
            </Link>
          }
        >
          <ProductCollection
            products={featured}
            state={loading ? 'loading' : error ? 'error' : ''}
          />
          <p className="demo-disclaimer">
            Store selling prices in PHP. Checkout remains a demonstration.
          </p>
          {error && (
            <button className="button" onClick={() => refreshProducts()}>
              Reload inventory
            </button>
          )}
        </Section>
        <Section
          id="new-arrivals"
          title="FRESH FINDS."
          note="Recently added to the store collection."
          action={
            <Link className="text-link" to="/shop?sort=newest">
              All arrivals
              <Icon name="arrow" />
            </Link>
          }
        >
          <div className="arrivals-grid">
            {arrivals.map((product) => (
              <article className="arrival-card" key={product.id}>
                <Link
                  className="arrival-media"
                  to={`/product/${product.slug}`}
                  aria-label={`Preview ${product.name}`}
                >
                  <CardImage src={product.imageUrl} name={product.name} />
                </Link>
                <div className="arrival-info">
                  <span className="arrival-label">
                    New · {product.gameName}
                  </span>
                  <h3>
                    <Link to={`/product/${product.slug}`}>{product.name}</Link>
                  </h3>
                  <p>{product.setName}</p>
                  {product.source === 'demo-fallback' && (
                    <p className="muted">Sample inventory · demo values</p>
                  )}
                  <p className="arrival-condition">
                    {product.rarity} · {product.condition}
                  </p>
                  <div>
                    <strong>{formatPrice(product.price)}</strong>
                    <span className="stock">
                      {product.stock
                        ? `${product.stock} in stock`
                        : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
        <section
          id="collector-notes"
          className="collector-note"
          aria-labelledby="collector-heading"
        >
          <div className="collector-index">404 / FIELD NOTES</div>
          <div>
            <h2 id="collector-heading">
              A deck to play.
              <br />A collection to keep.
            </h2>
            <p>
              Chasing a favorite character? Finishing a set? Finding the missing
              piece of your deck? Start with the cards that mean something to
              you.
            </p>
            <a className="text-link" href="#shop-by-game">
              Find cards by game
              <Icon name="arrow" />
            </a>
          </div>
          <div className="collector-checklist">
            <h3>Before you pick a single</h3>
            <ol>
              <li>
                <span>01</span>Check the set and card number.
              </li>
              <li>
                <span>02</span>Compare rarity and condition.
              </li>
              <li>
                <span>03</span>Find its place in your collection.
              </li>
            </ol>
          </div>
        </section>
        <div className="reassurance-strip">
          <span>
            Know your single.<small>Set, rarity, and condition in view.</small>
          </span>
          <span>
            Give every card its space.
            <small>Full artwork. Consistent previews.</small>
          </span>
          <span>
            Keep collecting.<small>Pokemon, One Piece, and Magic.</small>
          </span>
        </div>
      </div>
    </>
  )
}
