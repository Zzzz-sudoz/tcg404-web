import { BrowserRouter, Route, Routes } from 'react-router'
import StoreLayout from './layouts/StoreLayout'
import NotFoundPage from './pages/store/NotFoundPage'
import HomePage from './pages/store/HomePage'
import ShopPage from './pages/store/ShopPage'
import ProductPage from './pages/store/ProductPage'
import CartPage from './pages/store/CartPage'
import CheckoutPage from './pages/store/CheckoutPage'
import AuthPage from './pages/store/AuthPage'
import AccountPage from './pages/store/AccountPage'
import OrdersPage from './pages/store/OrdersPage'
import OrderDetailPage from './pages/store/OrderDetailPage'
import PrototypeProvider from './contexts/PrototypeProvider'
import CartProvider from './contexts/CartProvider'
import AuthProvider from './contexts/AuthProvider'
import ProtectedRoute from './components/common/ProtectedRoute'
import './App.css'
import './styles/workshop.css'
export default function App() { return (<AuthProvider><PrototypeProvider><CartProvider><BrowserRouter><Routes><Route element={<StoreLayout />}><Route index element={<HomePage />} />
<Route path="shop" element={<ShopPage />} /><Route path="product/:slug" element={<ProductPage />} />
<Route path="cart" element={<CartPage />} /><Route element={<ProtectedRoute />}><Route path="checkout" element={<CheckoutPage />} /></Route>
<Route path="login" element={<AuthPage key="login" />} /><Route path="register" element={<AuthPage key="register" register />} /><Route element={<ProtectedRoute />}><Route path="account" element={<AccountPage />} /><Route path="account/orders" element={<OrdersPage />} /><Route path="account/orders/:id" element={<OrderDetailPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Route></Routes></BrowserRouter></CartProvider></PrototypeProvider></AuthProvider>) }
