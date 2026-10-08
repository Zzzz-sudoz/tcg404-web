import './styles/loading.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import StoreLayout from './layouts/StoreLayout'
import HomePage from './pages/store/HomePage'
import AuthPage from './pages/store/AuthPage'
import AuthProvider from './contexts/AuthProvider'
import CartProvider from './contexts/CartProvider'
import AccountPage from './pages/store/AccountPage'
import AccountLayout from './layouts/AccountLayout'
import AccountOverview from './pages/store/AccountOverview'
import AccountPreferences from './pages/store/AccountPreferences'
import OrdersPage from './pages/store/OrdersPage'
import OrderDetailPage from './pages/store/OrderDetailPage'
import AdminInventoryPage from './pages/admin/AdminInventoryPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import NotFoundPage from './pages/store/NotFoundPage'
import PrototypeProvider from './contexts/PrototypeProvider'
import ShopPage from './pages/store/ShopPage'
import ProductPage from './pages/store/ProductPage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminProductFormPage from './pages/admin/AdminProductFormPage'
import AdminCardImportPage from './pages/admin/AdminCardImportPage'
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage'
import './App.css'
import './styles/workshop.css'
import './styles/collector-operations.css'
import './styles/customer-workspace.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrototypeProvider>
          <CartProvider>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="account" element={<AccountLayout />}>
                    <Route index element={<AccountOverview />} />
                    <Route path="profile" element={<AccountPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="orders/:id" element={<OrderDetailPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route
                      path="addresses"
                      element={<AccountPreferences key="addresses" />}
                    />
                    <Route
                      path="payments"
                      element={<AccountPreferences key="payments" payments />}
                    />
                    <Route
                      path="password"
                      element={<Navigate to="/account/profile" replace />}
                    />
                  </Route>
                </Route>
                <Route path="login" element={<AuthPage key="login" />} />
                <Route
                  path="register"
                  element={<AuthPage key="register" register />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route element={<ProtectedRoute admin />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route
                    path="products/new"
                    element={<AdminProductFormPage />}
                  />
                  <Route
                    path="products/:id/edit"
                    element={<AdminProductFormPage />}
                  />
                  <Route path="card-import" element={<AdminCardImportPage />} />
                  <Route path="orders" element={<OrdersPage admin />} />
                  <Route
                    path="orders/:id"
                    element={<OrderDetailPage admin />}
                  />
                  <Route path="analytics" element={<AdminDashboardPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route
                    path="inventory/movements"
                    element={<AdminInventoryPage movements />}
                  />
                  <Route path="*" element={<AdminPlaceholderPage />} />
                </Route>
              </Route>
            </Routes>
          </CartProvider>
        </PrototypeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
