import axios from 'axios'

// central axios instance - all api calls go through this
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// attach JWT token from localStorage to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinicbook_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// basic response error handling, keep it simple
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // token expired or invalid - clear storage. TODO: show a toast instead of console
      console.log('[api] got 401, clearing session:', err.response.data?.message)
      localStorage.removeItem('clinicbook_token')
      localStorage.removeItem('clinicbook_user')
    }
    return Promise.reject(err)
  }
)

export default api
