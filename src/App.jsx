import { BrowserRouter, Route, Routes } from 'react-router'
import StoreLayout from './layouts/StoreLayout'
import NotFoundPage from './pages/store/NotFoundPage'
import HomePage from './pages/store/HomePage'
import ShopPage from './pages/store/ShopPage'
import ProductPage from './pages/store/ProductPage'
import PrototypeProvider from './contexts/PrototypeProvider'
import CartProvider from './contexts/CartProvider'

import './App.css'
import './styles/workshop.css'
export default function App() { return (<PrototypeProvider><CartProvider><BrowserRouter><Routes><Route element={<StoreLayout />}><Route index element={<HomePage />} />
<Route path="shop" element={<ShopPage />} /><Route path="product/:slug" element={<ProductPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></BrowserRouter></CartProvider></PrototypeProvider>) }
