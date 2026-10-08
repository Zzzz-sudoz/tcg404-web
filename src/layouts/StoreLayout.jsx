import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import Icon from '../components/common/Icon'
import { usePrototype } from '../hooks/usePrototype'
import { useAuth } from '../hooks/useAuth'
import { apiError } from '../utils/api'

function Brand() {
  return (
    <span className="wordmark">
      TCG<span>404</span>
      <span className="wordmark-square" aria-hidden="true" />
    </span>
  )
}

function StoreHeader() {
  const { cart, persistenceNotice } = usePrototype()
  const { user, logout } = useAuth()
  const [authError, setAuthError] = useState('')
  const count = cart.reduce((sum, line) => sum + line.quantity, 0)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const navigate = useNavigate()

  function handleSearch(event) {
    event.preventDefault()
    const query = search.trim()
    setMenuOpen(false)
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleMenuKey(event) {
    if (event.key === 'Escape' && menuOpen) {
      closeMenu()
      menuButton.current?.focus()
    }
  }

  return (
    <header className="store-header" onKeyDown={handleMenuKey}>
      <div className="header-main page-width">
        <Link
          className="header-brand"
          to="/"
          aria-label="TCG404 home"
          onClick={closeMenu}
        >
          <Brand />
          <span className="brand-tagline">Collect. Trade. Discover.</span>
        </Link>
        <form className="global-search" role="search" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="store-search">
            Search cards, games, or sets
          </label>
          <span className="search-leading">
            <Icon name="search" />
          </span>
          <input
            id="store-search"
            type="search"
            placeholder="Search cards, games, or sets…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" aria-label="Search cards">
            <Icon name="arrow" />
          </button>
        </form>
        <div className="header-actions">
          <Link
            className="utility-link account-link"
            to={user ? '/account' : '/login'}
            onClick={closeMenu}
          >
            <Icon name="user" />
            <span>{user?.name || 'Account'}</span>
          </Link>
          {user && (
            <button
              className="text-link"
              onClick={async () => {
                try {
                  await logout()
                  closeMenu()
                } catch (e) {
                  setAuthError(apiError(e))
                }
              }}
            >
              Sign out
            </button>
          )}
          <Link className="utility-link" to="/cart" onClick={closeMenu}>
            <Icon name="bag" />
            <span>Cart</span>
            <span className="cart-count" aria-label={`${count} items`}>
              {count}
            </span>
          </Link>
          <button
            ref={menuButton}
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="store-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
            <span>Menu</span>
          </button>
        </div>
      </div>
      {authError && (
        <p className="page-width field-error" role="alert">
          {authError}
        </p>
      )}
      {persistenceNotice && (
        <p className="page-width persistence-notice" role="status">
          {persistenceNotice}
        </p>
      )}
      <div className="navigation-wrap">
        <nav
          id="store-navigation"
          aria-label="Main navigation"
          className={`store-nav page-width ${menuOpen ? 'is-open' : ''}`}
        >
          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/shop" onClick={closeMenu}>
            Shop all
          </NavLink>
          <Link to="/shop?game=pokemon" onClick={closeMenu}>
            Pokémon
          </Link>
          <Link to="/shop?game=one-piece" onClick={closeMenu}>
            One Piece
          </Link>
          <Link to="/shop?game=magic" onClick={closeMenu}>
            Magic: The Gathering
          </Link>
          <Link
            className="nav-arrivals"
            to="/#new-arrivals"
            onClick={closeMenu}
          >
            New arrivals
            <Icon name="arrow" />
          </Link>
          {user?.role === 'admin' && (
            <NavLink to="/admin" onClick={closeMenu}>
              Admin workspace
            </NavLink>
          )}
          <Link
            className="mobile-account"
            to={user ? '/account' : '/login'}
            onClick={closeMenu}
          >
            {user?.name || 'Account'}
          </Link>
        </nav>
      </div>
    </header>
  )
}

function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="page-width footer-main">
        <div>
          <Link to="/" aria-label="TCG404 home">
            <Brand />
          </Link>
          <p>
            For the deck builders.
            <br />
            The binder keepers. The collectors.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/shop">Shop singles</Link>
          <Link to="/#shop-by-game">Shop by game</Link>
          <Link to="/#collector-notes">Collector notes</Link>
          <Link to="/admin">Admin workspace</Link>
        </nav>
        <div className="footer-statement">
          <span>Collect. Trade. Discover.</span>
          <p>A place for your next great find.</p>
        </div>
      </div>
      <div className="page-width footer-bottom">
        <span>© 2026 TCG404</span>
        <span>
          Your next great find. From our collection to yours.
        </span>
      </div>
    </footer>
  )
}

export default function StoreLayout() {
  const location = useLocation()
  const main = useRef(null)

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
      main.current?.focus({ preventScroll: true })
    }
  }, [location.pathname, location.hash])

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <StoreHeader key={location.pathname} />
      <main id="main-content" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
      <StoreFooter />
    </>
  )
}
