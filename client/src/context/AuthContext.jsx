import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authApi } from '../services/api'
import { Button, ErrorNotice, Loading, Page } from '../components/ui'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    authApi.me({ signal: controller.signal }).then(result => { if (!controller.signal.aborted) setUser(result.data) }).catch(cause => {
      if (!controller.signal.aborted) { setUser(null); if (cause.status !== 401) setError(cause.message) }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => {
    const expired = () => setUser(null)
    window.addEventListener('session-expired', expired)
    return () => window.removeEventListener('session-expired', expired)
  }, [])
  async function authenticate(mode, body) {
    await authApi[mode](body)
    try { const result = await authApi.me(); setUser(result.data); setError(''); return result.data }
    catch (cause) { if (cause.status === 401) throw new Error('Your sign-in session could not be saved. Allow site cookies and try signing in again.'); throw cause }
  }
  async function logout() {
    try { await authApi.logout() } catch (cause) { if (cause.status !== 401) throw cause }
    setUser(null)
  }
  return <AuthContext.Provider value={{ user, setUser, loading, error, authenticate, logout, retry: () => setAttempt(value => value + 1) }}>{children}</AuthContext.Provider>
}
export function SignOut() {
  const { logout } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <div><Button secondary disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await logout() } catch (cause) { setError(cause.message) } finally { setBusy(false) } }}>Sign out</Button><ErrorNotice>{error}</ErrorNotice></div>
}
export function RequireRole({ roles, children }) {
  const { user, loading, error, retry } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (error) return <Page title="Unable to load your account"><ErrorNotice retry={retry}>{error}</ErrorNotice></Page>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  if (!roles.includes(user.role)) return <Page title="Access restricted" description="This account cannot access this portal. Sign in with the appropriate account."><SignOut /></Page>
  return children
}
