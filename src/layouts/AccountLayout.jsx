import { NavLink, Outlet } from 'react-router'
import Icon from '../components/common/Icon'
import SignOutButton from '../components/common/SignOutButton'
import { useAuth } from '../hooks/useAuth'

export default function AccountLayout() {
  const { user } = useAuth()
  return (
    <div className="page-width customer-workspace">
      <aside className="customer-sidebar">
        <div className="customer-identity">
          <span className="customer-avatar">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{user.name}</strong>
            <span>Your collection</span>
          </div>
        </div>
        <nav aria-label="Account navigation">
          {[
            ['', 'Overview', 'overview'],
            ['profile', 'Profile', 'user'],
            ['orders', 'Orders', 'bag'],
            ['cart', 'Cart', 'cards'],
            ['addresses', 'Addresses', 'location'],
            ['payments', 'Payment methods', 'payment'],
          ].map(([path, label, icon]) => (
            <NavLink
              key={path}
              to={`/account${path ? `/${path}` : ''}`}
              end={path !== 'orders'}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="customer-logout">
          <SignOutButton />
        </div>
      </aside>
      <div className="customer-content">
        <Outlet />
      </div>
    </div>
  )
}
