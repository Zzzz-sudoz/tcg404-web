import { Link } from 'react-router'
export default function AdminPlaceholderPage() {
  return (
    <div className="admin-page">
      <p className="eyebrow">COLLECTOR OPERATIONS</p>
      <h1>Workspace page not found.</h1>
      <div className="empty-panel">
        <h2>Choose a workspace from the navigation.</h2>
        <p>
          Overview shows saved orders and current inventory. Products lets you
          manage store singles.
        </p>
        <Link className="button" to="/admin">
          Back to overview
        </Link>
      </div>
    </div>
  )
}
