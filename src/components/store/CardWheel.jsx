import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import CardImage from './CardImage'
import Icon from '../common/Icon'

export default function CardWheel() {
  const { products } = usePrototype()
  const cards = products
    .filter((product) => product.isActive !== false && product.imageUrl)
    .slice(0, 7)
  return cards.length ? (
    <LiveWheel key={cards.map((card) => card.id).join(',')} cards={cards} />
  ) : null
}

function LiveWheel({ cards }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hidden, setHidden] = useState(() => document.hidden)
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const stage = useRef(null)
  const active = cards[index]

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changePreference = () => setReduced(preference.matches)
    const changeVisibility = () => setHidden(document.hidden)
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 },
    )
    observer.observe(stage.current)
    preference.addEventListener('change', changePreference)
    document.addEventListener('visibilitychange', changeVisibility)
    return () => {
      observer.disconnect()
      preference.removeEventListener('change', changePreference)
      document.removeEventListener('visibilitychange', changeVisibility)
    }
  }, [])

  useEffect(() => {
    if (paused || interacting || reduced || hidden || !visible) return
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % cards.length),
      4800,
    )
    return () => window.clearInterval(timer)
  }, [paused, interacting, reduced, hidden, visible, cards.length])

  function move(direction) {
    setIndex((current) => (current + direction + cards.length) % cards.length)
  }

  return (
    <section
      id="card-wheel"
      className="card-wheel"
      aria-labelledby="wheel-heading"
      ref={stage}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() =>
        setInteracting(stage.current.contains(document.activeElement))
      }
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(event.currentTarget.matches(':hover'))
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
    >
      <div className="wheel-heading page-width">
        <div>
          <p className="catalog-index">THE COLLECTOR'S ROTATION</p>
          <h2 id="wheel-heading">A DIFFERENT ANGLE.</h2>
        </div>
        <p>A closer look at the store collection.</p>
      </div>
      <div
        className="wheel-viewport"
        role="group"
        aria-roledescription="carousel"
        aria-label="Store card showcase"
      >
        <div className="wheel-track">
          {cards.map((product, position) => {
            let offset = (position - index + cards.length) % cards.length
            if (offset > cards.length / 2) offset -= cards.length
            const shown = Math.abs(offset) <= 2
            return (
              <button
                key={product.id}
                type="button"
                className={`wheel-card${offset === 0 ? ' is-current' : ''}`}
                style={{
                  '--offset': offset,
                  '--distance': Math.abs(offset),
                  zIndex: cards.length - Math.abs(offset),
                }}
                aria-label={`Show ${product.name}`}
                aria-pressed={offset === 0}
                aria-hidden={!shown}
                tabIndex={shown ? 0 : -1}
                onClick={() => setIndex(position)}
              >
                <CardImage src={product.imageUrl} name={product.name} />
              </button>
            )
          })}
        </div>
      </div>
      <div className="wheel-footer page-width">
        <button
          className="wheel-direction wheel-previous"
          type="button"
          aria-label="Previous showcase card"
          onClick={() => move(-1)}
        >
          <Icon name="arrow" />
        </button>
        <div
          className="wheel-caption"
          aria-live={paused || interacting || reduced ? 'polite' : 'off'}
        >
          <span className="catalog-index">
            {String(index + 1).padStart(2, '0')} /{' '}
            {String(cards.length).padStart(2, '0')} · {active.gameName}
          </span>
          <h3>{active.name}</h3>
          <Link className="text-link" to={`/product/${active.slug}`}>
            Preview this card <Icon name="arrow" />
          </Link>
        </div>
        <button
          className="wheel-direction"
          type="button"
          aria-label="Next showcase card"
          onClick={() => move(1)}
        >
          <Icon name="arrow" />
        </button>
      </div>
      <div className="wheel-playback">
        <button
          type="button"
          className="wheel-pause"
          disabled={reduced}
          onClick={() => setPaused((current) => !current)}
        >
          {reduced
            ? 'Motion off'
            : paused
              ? 'Resume rotation'
              : 'Pause rotation'}
        </button>
      </div>
    </section>
  )
}
