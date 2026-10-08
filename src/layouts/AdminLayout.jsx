import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/common/Icon'
import SignOutButton from '../components/common/SignOutButton'
export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
        <p className="eyebrow">ADMIN WORKSPACE</p>
        <nav aria-label="Admin navigation">
          {[
            ['', 'Overview', 'overview'],
            ['/products', 'Products', 'cards'],
            ['/card-import', 'Card import', 'import'],
            ['/orders', 'Manage orders', 'bag'],
            ['/analytics', 'Analytics', 'analytics'],
            ['/inventory', 'Inventory', 'inventory'],
          ].map(([path, label, icon]) => (
            <NavLink key={label} end={path === ''} to={`/admin${path}`}>
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-actions">
          <Link className="button button-secondary" to="/">
            ← Back to store
          </Link>
          <SignOutButton
            onSignedOut={() => navigate('/login', { replace: true })}
          />
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>TCG404 / OPERATIONS</span>
          <span className="admin-identity">
            <Icon name="user" />
            {user.name}
            <span className="status-chip">Admin</span>
          </span>
        </header>
        <main ref={main} id="admin-main" tabIndex="-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
