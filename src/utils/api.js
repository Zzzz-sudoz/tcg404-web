import axios from 'axios'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})
export const apiError = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error?.message ||
  error.message ||
  'Request unavailable. Try again.'
export const apiFields = (error) =>
  error.response?.data?.error?.fields ||
  error.response?.data?.fields ||
  error.response?.data?.errors ||
  {}
api.interceptors.response.use((response) => {
  if (/\/products(?:\/|$)/.test(response.config.url)) {
    const decorate = (product) => ({
      ...product,
      gameName:
        {
          pokemon: 'Pokémon',
          'one-piece': 'One Piece',
          magic: 'Magic: The Gathering',
        }[product.game] || product.game,
    })
    response.data.data = Array.isArray(response.data.data)
      ? response.data.data.map(decorate)
      : decorate(response.data.data)
  }
  return response
})
