import {useEffect,useRef,useState} from 'react'
import {FavoritesContext} from './FavoritesContext'
import {useAuth} from '../hooks/useAuth'
import {api,apiError} from '../utils/api'

export default function FavoritesProvider({children}) {
  const {user}=useAuth()
  const [state,setState]=useState({owner:null,ids:new Set(),loading:false,error:''})
  const [pending,setPending]=useState(new Set())
  const [revision,setRevision]=useState(0)
  const activeOwner=useRef(null)
  const owner=user?.role==='customer'?user.id:null
  activeOwner.current=owner
  useEffect(()=>{
    if(!owner) return
    const controller=new AbortController()
    const timer=setTimeout(async()=>{
      setState({owner,ids:new Set(),loading:true,error:''})
      try {
        const ids=new Set()
        let page=1, pages=1
        do {
          const response=await api.get(`/favorites?page=${page}&limit=100`,{signal:controller.signal})
          response.data.data.forEach(row=>ids.add(row.productId))
          pages=response.data.meta.totalPages
          page++
        } while(page<=pages && !controller.signal.aborted)
        if(!controller.signal.aborted) setState({owner,ids,loading:false,error:''})
      } catch(error) {if(!controller.signal.aborted) setState({owner,ids:new Set(),loading:false,error:apiError(error)})}
    },0)
    return ()=>{clearTimeout(timer);controller.abort()}
  },[owner])
  const current=state.owner===owner && owner?state:{ids:new Set(),loading:!!owner,error:''}
  const busy=useRef(new Set())
  async function toggle(id, remove = false) {
    if(!owner || busy.current.has(id) || current.loading) return
    const capturedOwner=owner
    busy.current.add(id);setPending(new Set(busy.current))
    try {
      if(remove || current.ids.has(id)) await api.delete(`/favorites/${id}`)
      else await api.put(`/favorites/${id}`,{})
      if(activeOwner.current===capturedOwner) setState(previous=>{
        const ids=new Set(previous.ids)
        if(remove || ids.has(id)) ids.delete(id); else ids.add(id)
        return {...previous,ids,error:''}
      })
      if(activeOwner.current===capturedOwner) setRevision(value=>value+1)
    } catch(error) {
      if(activeOwner.current===capturedOwner) setState(previous=>({...previous,error:apiError(error)}))
      throw error
    } finally {busy.current.delete(id);setPending(new Set(busy.current))}
  }
  return <FavoritesContext.Provider value={{...current,pending,toggle,revision}}>{children}</FavoritesContext.Provider>
}
