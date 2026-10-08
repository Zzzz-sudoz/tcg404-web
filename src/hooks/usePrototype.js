import { useContext } from 'react'
import { PrototypeContext } from '../contexts/PrototypeContext'
import { useCart } from './useCart'
export function usePrototype() {
  const inventory = useContext(PrototypeContext)
  const cart = useCart()
  return { ...inventory, ...cart }
}
