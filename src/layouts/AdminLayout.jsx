import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { apiError } from '../utils/api'
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [error, setError] = useState('')
  const { pathname } = useLocation()
  const main = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    main.current?.focus({ preventScroll: true })
  }, [pathname])
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        Skip to workspace
      </a>
      <aside className="admin-sidebar">
        <Link className="wordmark" to="/admin">
          TCG<span>404</span>.
        </Link>
        <p className="eyebrow">COLLECTOR OPERATIONS</p>
        <nav aria-label="Admin navigation">
          {[
            ['', 'Overview'],
            ['/products', 'Products'],
            ['/card-import', 'Card import'],
            ['/orders', 'Orders'],
            ['/analytics', 'Analytics'],
            ['/inventory', 'Inventory'],
          ].map(([path, label], i) => (
            <NavLink key={label} end={path === ''} to={`/admin${path}`}>
              <span className="nav-number">0{i + 1}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="button" to="/">
          ← Back to store
        </Link>
        <p className="prototype-note">
          Saved orders, stock movements and completed demand come from the store.
        </p>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>THE WORKBENCH</span>
          <span>{user.name} · Admin</span>
          <button
            className="text-link"
            onClick={async () => {
              try {
                await logout()
              } catch (e) {
                setError(apiError(e))
              }
            }}
          >
            Sign out
          </button>
        </header>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <main ref={main} id="admin-main" tabIndex="-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
