import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, SignOut } from '../context/AuthContext'
import { api } from '../services/api'
import { Button, ErrorNotice, Field, Loading, Notice, Page } from '../components/ui'

export function Account({ role = 'STUDENT' }) {
  const auth = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const owner = role === 'OWNER'
  const update = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  if (auth.loading) return <Loading />
  if (auth.user) {
    if (owner && auth.user.role !== 'OWNER') return <Page title="An owner account is required"><SignOut /></Page>
    const from = location.state?.from
    const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !['/login', '/register'].includes(from.split('?')[0]) ? from : owner ? '/dashboard' : auth.user.role === 'ADMIN' ? '/admin' : '/hostels'
    return <Navigate to={destination} replace />
  }
  async function submit(event) {
    event.preventDefault(); setError('')
    if (mode === 'register' && form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      await auth.authenticate(mode, mode === 'login' ? { username: form.username.trim(), password: form.password } : { name: form.name.trim(), email: form.email.trim(), password: form.password, role, ...(form.username.trim() && { username: form.username.trim() }), ...(form.phone.trim() && { phone: form.phone.trim() }) })
    } catch (cause) { setError(cause.status === 409 ? 'That email or username is already registered. Please sign in or choose another.' : cause.message) }
    finally { setBusy(false) }
  }
  return <div className="min-h-[85vh] bg-white lg:grid lg:grid-cols-2"><section className="hidden flex-col justify-center bg-zinc-950 p-12 text-white lg:flex"><p className="text-xs font-semibold uppercase tracking-[.2em] text-zinc-400">HostelHub · {owner ? 'Owner portal' : 'Student and admin portal'}</p><h1 className="mt-5 max-w-lg text-5xl font-semibold leading-tight tracking-[-.05em]">{owner ? 'A better home for your hostel business.' : 'Find a place that feels like home.'}</h1><p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">{owner ? 'Manage your listings and connect with students in one place.' : 'Save your favorite spaces and talk directly to their owners.'}</p></section><main className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-[440px]"><p className="eyebrow">{mode === 'register' ? 'Create your account' : 'Welcome back'}</p><h1 className="page-title mt-3">{mode === 'register' ? 'Register.' : 'Sign in.'}</h1><ErrorNotice retry={auth.retry}>{auth.error}</ErrorNotice><form onSubmit={submit} className="mt-7 grid gap-4">
    {mode === 'register' && <><Field label="Full name"><input className="input" autoComplete="name" required maxLength={100} value={form.name} onChange={update('name')} /></Field><Field label="Email"><input className="input" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update('email')} /></Field>{owner && <Field label="Phone number"><input className="input" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={update('phone')} /></Field>}</>}
    <Field label={mode === 'login' ? 'Username or email' : `Username${owner ? '' : ' (optional)'}`}><input className="input" autoComplete="username" required={mode === 'login' || owner} maxLength={mode === 'login' ? 254 : 24} pattern={mode === 'register' ? '[a-zA-Z0-9_]{3,24}' : undefined} title={mode === 'register' ? '3–24 letters, numbers or underscores' : undefined} value={form.username} onChange={update('username')} /></Field>
    <Field label="Password"><input className="input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 10 : 1} maxLength={72} value={form.password} onChange={update('password')} /></Field>{mode === 'register' && <Field label="Confirm password"><input className="input" type="password" autoComplete="new-password" required value={form.confirm} onChange={update('confirm')} /></Field>}
    <ErrorNotice>{error}</ErrorNotice><Button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : `Create ${owner ? 'owner' : 'student'} account`}</Button></form><button className="mt-6 text-xs font-semibold text-zinc-600 underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Already registered? Sign in'}</button></div></main></div>
}
export function Profile() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone || '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  async function save(event) { event.preventDefault(); setBusy(true); setSaved(false); setError(''); try { const result = await api('/auth/me', { method: 'PATCH', body: { name: name.trim(), phone: phone.trim() } }); setUser(result.data); setSaved(true) } catch (cause) { setError(cause.message) } finally { setBusy(false) } }
  return <Page eyebrow="Account" title="Your profile." description="Keep your contact information up to date."><form onSubmit={save} className="panel grid max-w-xl gap-5"><Field label="Full name"><input className="input" required maxLength={100} value={name} onChange={event => { setName(event.target.value); setSaved(false) }} /></Field><Field label="Email"><input className="input" value={user.email} readOnly /></Field><Field label="Phone"><input className="input" type="tel" maxLength={30} value={phone} onChange={event => { setPhone(event.target.value); setSaved(false) }} /></Field><p className="text-xs text-zinc-500">Account type: {user.role}</p><ErrorNotice>{error}</ErrorNotice><Notice>{saved && 'Your profile has been saved.'}</Notice><Button disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></form></Page>
}
