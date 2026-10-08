import { BrowserRouter, Route, Routes } from 'react-router'
import StoreLayout from './layouts/StoreLayout'
import NotFoundPage from './pages/store/NotFoundPage'


import './App.css'
import './styles/workshop.css'
export default function App() { return (<BrowserRouter><Routes><Route element={<StoreLayout />}><Route index element={<section className="page-width empty-panel"><h1>TCG404</h1><p>Collect. Trade. Discover.</p></section>} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></BrowserRouter>) }
