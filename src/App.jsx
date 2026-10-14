import './styles/loading.css'
import { lazy, Suspense, useState } from 'react'
import LoadingLayout from './components/common/LoadingLayout'
import { createBrowserRouter, RouterProvider, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import Dialog from './components/common/Dialog'
import StoreLayout from './layouts/StoreLayout'
import HomePage from './pages/store/HomePage'
import AuthProvider from './contexts/AuthProvider'
import FavoritesProvider from './contexts/FavoritesProvider'
import FavoritesPage from './pages/store/FavoritesPage'
import AdminReturnsPage from './pages/admin/AdminReturnsPage'
import AdminReturnDetailPage from './pages/admin/AdminReturnDetailPage'
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
import './styles/theme.css'

const AuthPage = lazy(() => import('./pages/store/AuthPage'))

function Application() {
  return (
      <AuthProvider>
        <FavoritesProvider>
        <PrototypeProvider>
          <CartProvider>
            <ApplicationRoutes />
          </CartProvider>
        </PrototypeProvider>
        </FavoritesProvider>
      </AuthProvider>
  )
}

function ApplicationRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const [authBusy, setAuthBusy] = useState(false)
  const isAuth = location.pathname === '/login' || location.pathname === '/register'
  const background = location.state?.backgroundLocation || { pathname: '/', search: '', hash: '' }
  const closeAuth = () => { if (!authBusy) navigate(background, { replace: true }) }
  return <>
            <Routes location={isAuth ? background : location}>
              <Route element={<StoreLayout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route element={<ProtectedRoute customer guest />}>
                  <Route path="cart" element={<CartPage />} />
                </Route>
                <Route element={<ProtectedRoute customer />}>
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="account" element={<AccountLayout />}>
                    <Route index element={<AccountOverview />} />
                    <Route path="profile" element={<AccountPage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="favorites" element={<FavoritesPage />} />
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
                  <Route path="returns" element={<AdminReturnsPage />} />
                  <Route path="returns/:id" element={<AdminReturnDetailPage />} />
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
    {isAuth && <Dialog open onClose={closeAuth} labelledBy="auth-title" className="auth-dialog" cancelLabel="Back to browsing" busy={authBusy}>
      <Suspense fallback={<LoadingLayout count={1} />}>
        <AuthPage key={location.pathname} register={location.pathname === '/register'} backgroundLocation={background} onBusyChange={setAuthBusy} />
      </Suspense>
    </Dialog>}
  </>
}

const router = createBrowserRouter([{ path: '*', element: <Application /> }])
export default function App() { return <RouterProvider router={router} /> }
