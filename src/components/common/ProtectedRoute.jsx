import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
export default function ProtectedRoute({ admin = false }) {
  const { user, loading, error, restore } = useAuth()
  const location = useLocation()
  if (loading)
    return (
      <div className="page-width empty-panel" role="status">
        Restoring your session...
      </div>
    )
  if (error)
    return (
      <div className="page-width empty-panel" role="alert">
        <p>{error}</p>
        <button className="button" onClick={restore}>
          Try again
        </button>
      </div>
    )
  if (!user)
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  if (admin && user.role !== 'admin')
    return (
      <div className="page-width empty-panel">
        <h1>Admin access required.</h1>
        <p>Your customer account cannot open this workspace.</p>
        <Link className="button" to="/shop">
          Return to shop
        </Link>
      </div>
    )
  return <Outlet />
}
