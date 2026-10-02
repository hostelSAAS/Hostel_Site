import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Building2, CreditCard, LayoutDashboard, Menu, MessageCircle, UserRound, X } from 'lucide-react'
import { AuthProvider, RequireRole, SignOut, useAuth } from './context/AuthContext'
import { Account, Profile } from './pages/Account'
import { OwnerDashboard, OwnerListings } from './pages/Owner'
import Messages from './pages/Messages'
import { Deferred, Page } from './components/ui'

const links = [
  ['/dashboard', 'Overview', LayoutDashboard], ['/hostel', 'My hostels', Building2],
  ['/messages', 'Messages', MessageCircle], ['/subscription', 'Subscription', CreditCard], ['/profile', 'Profile', UserRound],
]
function Shell() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()
  const title = links.find(([path]) => location.pathname.startsWith(path))?.[1] || 'Owner portal'
  return <div className="min-h-screen bg-[#f7f7f7]">{open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm lg:hidden" />}<aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-zinc-200 bg-white p-4 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-14 items-center justify-between px-2"><NavLink to="/dashboard" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950 text-sm font-bold text-white">H</span><span><span className="text-sm font-semibold">hostel<span className="text-zinc-400">hub</span></span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-400">Owner portal</span></span></NavLink><button aria-label="Close navigation" className="p-2 lg:hidden" onClick={() => setOpen(false)}><X size={17} /></button></div><div className="mt-7 rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="eyebrow">Your workspace</p><p className="mt-2 text-xs font-semibold">{user.name}</p></div><nav className="mt-6 grid gap-1">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex h-11 items-center gap-3 rounded-xl px-3 text-xs font-medium ${isActive ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}><Icon size={16} />{label}</NavLink>)}</nav><div className="mt-auto border-t border-zinc-100 pt-4"><SignOut /></div></aside><div className="lg:pl-[260px]"><header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-[#f7f7f7]/90 px-5 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setOpen(true)} className="rounded-xl border border-zinc-200 bg-white p-3 lg:hidden"><Menu size={18} /></button><div><p className="text-[10px] text-zinc-400">Workspace</p><p className="text-sm font-semibold">{title}</p></div></div><NavLink to="/profile" className="rounded-xl border border-zinc-200 bg-white p-3 text-xs font-semibold">{user.name}</NavLink></header><Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/owner" element={<Navigate to="/dashboard" replace />} /><Route path="/owner/hostel" element={<Navigate to="/hostel" replace />} /><Route path="/owner/messages" element={<Navigate to="/messages" replace />} /><Route path="/owner/profile" element={<Navigate to="/profile" replace />} /><Route path="/owner/subscription" element={<Navigate to="/subscription" replace />} /><Route path="/dashboard" element={<OwnerDashboard />} /><Route path="/hostel" element={<OwnerListings />} /><Route path="/messages" element={<Messages />} /><Route path="/profile" element={<Profile key={user.id} />} /><Route path="/subscription" element={<Deferred title="Subscriptions" />} /><Route path="*" element={<Page title="Page not found"><NavLink to="/dashboard" className="action-link">Back to overview</NavLink></Page>} /></Routes></div></div>
}
export default function App() {
  return <AuthProvider><Routes><Route path="/login" element={<Account role="OWNER" />} /><Route path="/register" element={<Account key="register" role="OWNER" />} /><Route path="*" element={<RequireRole roles={['OWNER']}><Shell /></RequireRole>} /></Routes></AuthProvider>
}
