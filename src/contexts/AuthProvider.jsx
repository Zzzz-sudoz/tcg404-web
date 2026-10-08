import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { api, apiError } from '../utils/api'
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const restore = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.data.user)
    } catch (e) {
      setUser(null)
      if (e.response?.status !== 401) setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const timer = setTimeout(restore, 0)
    return () => clearTimeout(timer)
  }, [restore])
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (e) => {
        if (e.response?.status === 401) setUser(null)
        return Promise.reject(e)
      },
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [])
  const authenticate = async (action, values) => {
    const response = await api.post(`/auth/${action}`, values)
    setError('')
    setUser(response.data.data.user)
    return response.data.data.user
  }
  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
    setError('')
  }
  const loadProfile = useCallback(async (signal) => {
    const response = await api.get('/auth/profile', { signal })
    setUser(response.data.data.user)
    return response.data.data.user
  }, [])
  const saveProfile = async (name) => {
    const response = await api.patch('/auth/profile', { name })
    setUser(response.data.data.user)
    return response.data.data.user
  }
  return (
    <AuthContext
      value={{
        user,
        loading,
        error,
        restore,
        authenticate,
        logout,
        loadProfile,
        saveProfile,
      }}
    >
      {children}
    </AuthContext>
  )
}
