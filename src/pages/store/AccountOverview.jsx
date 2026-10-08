import { Link } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { useApiQuery } from '../../hooks/useApiQuery'
import { formatPrice } from '../../data/store'
import { orderStatusLabel } from '../../utils/operations'
import Icon from '../../components/common/Icon'

export default function AccountOverview() {
  const { user } = useAuth()
  const orders = useApiQuery('/orders/my-orders', 'limit=3')
  return (
    <section className="customer-overview">
      <header className="customer-welcome">
        <p className="eyebrow">YOUR COLLECTOR SPACE</p>
        <h1>Welcome back, {user.name}.</h1>
      </header>
      <div className="customer-shortcuts">
        {[
          ['profile', 'Your profile', 'user'],
          ['orders', 'Track your orders', 'bag'],
          ['addresses', 'Delivery addresses', 'location'],
          ['payments', 'Payment methods', 'payment'],
        ].map(([path, label, icon]) => (
          <Link key={path} to={`/account/${path}`}>
            <Icon name={icon} />
            <strong>{label}</strong>
            <Icon name="arrow" />
          </Link>
        ))}
      </div>
      <section className="customer-recent">
        <div className="row-between">
          <h2>Recent orders</h2>
          <Link to="/account/orders">View all</Link>
        </div>
        {orders.loading ? (
          <p role="status">Loading orders...</p>
        ) : orders.error ? (
          <p role="alert">
            {orders.error} <Link to="/account/orders">View orders</Link>
          </p>
        ) : orders.data.length ? (
          orders.data.map((order) => (
            <Link
              className="customer-order-row"
              key={order.id}
              to={`/account/orders/${order.id}`}
            >
              <div>
                <strong>
                  {order.items.map((item) => item.name).join(', ')}
                </strong>
                <span>{order.orderNumber}</span>
              </div>
              <span>{orderStatusLabel(order.status)}</span>
              <strong>{formatPrice(order.total)}</strong>
              <Icon name="arrow" />
            </Link>
          ))
        ) : (
          <div className="customer-empty">
            <Icon name="bag" />
            <h3>Your collection starts here.</h3>
            <Link to="/shop">Browse cards</Link>
          </div>
        )}
      </section>
    </section>
  )
}
