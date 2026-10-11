import {useState} from 'react'
import {useNavigate,useLocation} from 'react-router'
import {useAuth} from '../../hooks/useAuth'
import {useFavorites} from '../../hooks/useFavorites'
import {apiError} from '../../utils/api'
import Icon from '../common/Icon'

export default function FavoriteButton({product}) {
  const {user}=useAuth()
  const favorites=useFavorites()
  const navigate=useNavigate()
  const location=useLocation()
  const [error,setError]=useState('')
  if(user?.role==='admin') return null
  const saved=favorites.ids.has(product.id)
  return <div className="favorite-control">
    <button type="button" className={`favorite-button ${saved?'is-saved':''}`} aria-label={`${saved?'Remove':'Save'} ${product.name} ${saved?'from':'to'} favorites`} aria-pressed={saved} disabled={!!user&&(favorites.loading||favorites.pending.has(product.id))} onClick={async()=>{
      if(!user) {navigate(`/login?returnTo=${encodeURIComponent(location.pathname+location.search)}`);return}
      setError('')
      try {await favorites.toggle(product.id)} catch(e) {setError(apiError(e))}
    }}><Icon name="heart" /></button>
    {error&&<span role="alert" className="field-error">{error}</span>}
  </div>
}
