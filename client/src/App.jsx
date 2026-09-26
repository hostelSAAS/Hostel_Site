import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  GripVertical,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PencilLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { api, authApi } from './services/api'

const listingImages = [
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=900&q=85',
]

const conversations = [
  { name: 'Ayesha Khan', initials: 'AK', text: 'Is the single room still available?', time: '2m', unread: 2 },
  { name: 'Hamza Ali', initials: 'HA', text: 'Can I visit this Saturday?', time: '1h', unread: 0 },
  { name: 'Mariam Noor', initials: 'MN', text: 'Thank you for the details.', time: '3h', unread: 0 },
  { name: 'Saad Ahmed', initials: 'SA', text: 'Does the rent include mess?', time: '1d', unread: 0 },
]

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/hostel', label: 'My hostel', icon: Building2 },
  { to: '/messages', label: 'Messages', icon: MessageCircle, badge: 2 },
  { to: '/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function cn(...classes) { return classes.filter(Boolean).join(' ') }

function Logo() {
  return <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950 text-sm font-bold text-white">H</span><div><p className="text-[14px] font-semibold tracking-tight text-zinc-950">hostel<span className="text-zinc-400">hub</span></p><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-400">Owner portal</p></div></div>
}

function Sidebar({ open, onClose, onSignOut }) {
  return <><button aria-label="Close navigation" onClick={onClose} className={cn('fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm lg:hidden', open ? 'block' : 'hidden')} /><aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-zinc-200 bg-white p-4 transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}><div className="flex h-14 items-center justify-between px-2"><Logo /><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-500 lg:hidden"><X size={16} /></button></div><div className="mt-7 rounded-xl border border-zinc-200 bg-zinc-50 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Listing status</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><p className="mt-2 text-xs font-semibold text-zinc-800">The Olive House</p><p className="mt-1 text-[10px] text-zinc-400">Live · Approved</p></div><nav className="mt-6 grid gap-1">{navItems.map(({ to, label, icon: Icon, badge }) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => cn('flex h-11 items-center gap-3 rounded-xl px-3 text-xs font-medium transition', isActive ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950')}><Icon size={16} /><span className="flex-1">{label}</span>{badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[9px] font-bold text-zinc-950">{badge}</span>}</NavLink>)}</nav><div className="mt-auto border-t border-zinc-100 pt-4"><button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"><Settings size={15} />Settings</button><button onClick={onSignOut} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"><LogOut size={15} />Sign out</button></div></aside></>
}

function Header({ onMenu, user }) {
  const location = useLocation()
  const current = navItems.find((item) => location.pathname.startsWith(item.to))
  const displayName = user?.name || 'Owner'
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-[#f7f7f7]/90 px-5 backdrop-blur-xl lg:px-8"><div className="flex items-center gap-3"><button onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 lg:hidden"><Menu size={18} /></button><div><p className="text-[10px] font-medium text-zinc-400">Workspace</p><p className="text-sm font-semibold text-zinc-800">{current?.label || 'Owner portal'}</p></div></div><div className="flex items-center gap-2"><button className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500"><Bell size={16} /></button><button className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1.5 pl-1.5 pr-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-950 text-[10px] font-semibold text-white">{initials || 'U'}</span><span className="hidden text-xs font-semibold text-zinc-700 sm:block">{displayName}</span><ChevronDown size={13} className="text-zinc-400" /></button></div></header>
}

function Shell({ children, onSignOut, user }) {
  const [open, setOpen] = useState(false)
  return <div className="min-h-screen bg-[#f7f7f7]"><Sidebar open={open} onClose={() => setOpen(false)} onSignOut={onSignOut} /><div className="lg:pl-[260px]"><Header onMenu={() => setOpen(true)} user={user} />{children}</div></div>
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title mt-2">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">{description}</p></div>{action}</div>
}

function Metric({ icon: Icon, label, value, change }) {
  return <div className="rounded-2xl border border-zinc-200 bg-white p-4"><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-600"><Icon size={16} /></span><span className="text-[10px] font-semibold text-emerald-600">{change}</span></div><p className="mt-5 text-xs text-zinc-400">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">{value}</p></div>
}

function Dashboard({ firstName }) {
  return <main className="mx-auto max-w-[1320px] p-5 lg:p-8"><PageHeading eyebrow="Owner workspace" title={`Good morning, ${firstName || 'Owner'}.`} description="Here’s how your property is performing and what needs your attention." action={<NavLink to="/hostel" className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white">Manage listing <ArrowRight size={15} /></NavLink>} /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Eye} label="Listing views" value="2,481" change="+12.8%" /><Metric icon={MessageCircle} label="New inquiries" value="24" change="+8.4%" /><Metric icon={Users} label="Profile visits" value="684" change="+5.2%" /><Metric icon={BarChart3} label="Occupancy" value="83%" change="+4.1%" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]"><section className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-zinc-900">Listing performance</h2><p className="mt-1 text-xs text-zinc-400">Views over the last 30 days</p></div><button className="flex items-center gap-1 text-xs font-medium text-zinc-500">30 days <ChevronDown size={13} /></button></div><div className="mt-7 flex h-52 items-end gap-2 border-b border-l border-zinc-200 px-3">{[28, 35, 31, 46, 42, 58, 51, 68, 63, 76, 71, 88, 81, 94, 86, 102, 95, 110, 103, 119, 112, 126, 120, 136].map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><span style={{ height: `${height / 1.4}%` }} className={cn('w-full rounded-t-sm', index > 18 ? 'bg-zinc-900' : 'bg-zinc-200')} /></div>)}</div><div className="mt-3 flex justify-between pl-3 text-[10px] text-zinc-400"><span>1 Sep</span><span>15 Sep</span><span>30 Sep</span></div></section><section className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900">Owner checklist</h2><span className="text-[10px] font-semibold text-zinc-400">3 of 4</span></div><div className="mt-5 grid gap-3">{[['Complete your profile', true], ['Add hostel details', true], ['Upload at least 5 photos', true], ['Add room availability', false]].map(([label, done]) => <div key={label} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"><span className={cn('grid h-7 w-7 place-items-center rounded-lg', done ? 'bg-zinc-950 text-white' : 'border border-zinc-200 bg-white text-zinc-300')}>{done ? <Check size={14} /> : <Clock3 size={14} />}</span><span className={cn('text-xs font-medium', done ? 'text-zinc-600' : 'text-zinc-900')}>{label}</span></div>)}</div></section></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_1fr]"><ListingSummary /><RecentInquiries /></div></main>
}

function ListingSummary() {
  return <section className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-zinc-900">Your listing</h2><p className="mt-1 text-xs text-zinc-400">Visible to students</p></div><NavLink to="/hostel" className="text-xs font-semibold text-zinc-500">Edit listing</NavLink></div><div className="mt-5 flex flex-col gap-4 rounded-xl bg-zinc-50 p-3 sm:flex-row sm:items-center"><img src={listingImages[0]} alt="The Olive House" className="h-28 w-full rounded-xl object-cover sm:w-36" /><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-zinc-900">The Olive House</h3><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">Approved</span></div><p className="mt-1 text-xs text-zinc-400">Gulberg III, Lahore</p><div className="mt-4 flex gap-5"><div><p className="text-sm font-semibold text-zinc-900">12</p><p className="text-[10px] text-zinc-400">Rooms</p></div><div><p className="text-sm font-semibold text-zinc-900">10</p><p className="text-[10px] text-zinc-400">Occupied</p></div><div><p className="text-sm font-semibold text-zinc-900">4.9</p><p className="text-[10px] text-zinc-400">Rating</p></div></div></div></div></section>
}

function RecentInquiries() {
  return <section className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-zinc-900">Recent inquiries</h2><p className="mt-1 text-xs text-zinc-400">Your latest student messages</p></div><NavLink to="/messages" className="text-xs font-semibold text-zinc-500">View all</NavLink></div><div className="mt-5 grid gap-4">{conversations.slice(0, 3).map((person) => <div key={person.name} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">{person.initials}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="truncate text-xs font-semibold text-zinc-700">{person.name}</p><span className="text-[10px] text-zinc-400">{person.time}</span></div><p className="mt-1 truncate text-[11px] text-zinc-400">{person.text}</p></div>{person.unread > 0 && <span className="h-2 w-2 rounded-full bg-zinc-950" />}</div>)}</div></section>
}

function HostelEditor() {
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cover, setCover] = useState(0)
  const [form, setForm] = useState({ name: 'The Olive House', address: '24-B Main Boulevard, Gulberg III', city: 'Lahore', state: 'Punjab', university: 'LUMS', description: 'A calm, secure student residence with bright rooms, shared study areas, reliable utilities, and easy access to nearby universities.', price: '28500', rooms: '12' })
  const update = (key) => (event) => { setForm({ ...form, [key]: event.target.value }); setSaved(false) }

  return <main className="mx-auto max-w-[1200px] p-5 lg:p-8"><PageHeading eyebrow="Property management" title="My hostel." description="Keep your listing accurate, useful, and ready for the students who are searching." action={<div className="flex gap-2"><button onClick={() => setSaved(true)} className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-600">{saved ? 'Saved' : 'Save draft'}</button><button onClick={() => setSubmitted(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white">{submitted ? <><Check size={14} /> Submitted</> : <>Submit for review <ArrowRight size={14} /></>}</button></div>} />{submitted && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><Clock3 size={17} className="mt-0.5 text-amber-700" /><div><p className="text-xs font-semibold text-amber-900">Your changes are under review</p><p className="mt-1 text-[11px] leading-5 text-amber-700">We usually review updates within 24 hours. Your current approved listing stays live meanwhile.</p></div></div>}<div className="mt-7 grid gap-5 xl:grid-cols-[1fr_320px]"><div className="grid gap-5"><EditorSection title="Basic information" description="The essential details students see first."><div className="grid gap-4 sm:grid-cols-2"><label className="field sm:col-span-2"><span>Hostel name</span><input className="input" value={form.name} onChange={update('name')} /></label><label className="field sm:col-span-2"><span>Full address</span><input className="input" value={form.address} onChange={update('address')} /></label><label className="field"><span>State / province</span><select className="input" value={form.state} onChange={update('state')}><option>Punjab</option><option>Sindh</option><option>Islamabad Capital Territory</option><option>Khyber Pakhtunkhwa</option></select></label><label className="field"><span>City</span><select className="input" value={form.city} onChange={update('city')}><option>Lahore</option><option>Islamabad</option><option>Karachi</option><option>Peshawar</option></select></label><label className="field sm:col-span-2"><span>Nearby university</span><input className="input" value={form.university} onChange={update('university')} /></label><label className="field sm:col-span-2"><span>Description</span><textarea className="input" value={form.description} onChange={update('description')} /></label></div></EditorSection><EditorSection title="Rooms and pricing" description="Set the starting monthly price and current capacity."><div className="grid gap-4 sm:grid-cols-2"><label className="field"><span>Starting monthly rent (PKR)</span><input type="number" className="input" value={form.price} onChange={update('price')} /></label><label className="field"><span>Total rooms</span><input type="number" className="input" value={form.rooms} onChange={update('rooms')} /></label></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{['1 bed room', '2 bed room', '3 bed room'].map((room, index) => <label key={room} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"><input type="checkbox" defaultChecked={index < 2} className="accent-zinc-950" /><span className="text-xs font-medium text-zinc-600">{room}</span></label>)}</div></EditorSection><EditorSection title="Amenities" description="Help students quickly understand what is included."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['Air conditioning', 'Mess available', 'Wi-Fi', 'Power backup', 'Laundry', 'Security guard', 'Study room', 'Attached bathroom', 'Parking'].map((amenity, index) => <label key={amenity} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"><input type="checkbox" defaultChecked={index < 6} className="accent-zinc-950" /><span className="text-xs font-medium text-zinc-600">{amenity}</span></label>)}</div></EditorSection><EditorSection title="Photos" description="Drag to reorder and choose the image students see first."><div className="grid gap-3 sm:grid-cols-2">{listingImages.map((image, index) => <div key={image} className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"><img src={image} alt={`Hostel view ${index + 1}`} className="h-40 w-full object-cover" /><span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-zinc-500"><GripVertical size={14} /></span>{cover === index ? <span className="absolute bottom-2 left-2 rounded-lg bg-zinc-950 px-2 py-1 text-[9px] font-semibold text-white">Cover image</span> : <button onClick={() => setCover(index)} className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-semibold text-zinc-700 opacity-0 transition group-hover:opacity-100">Make cover</button>}<button className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-zinc-500"><X size={13} /></button></div>)}<button className="grid h-40 place-items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-700"><span className="grid place-items-center gap-2"><ImagePlus size={22} /><span className="text-[11px] font-semibold">Upload photos</span></span></button></div><p className="mt-3 text-[10px] text-zinc-400">JPG, PNG or WebP · Maximum 10 MB each · Up to 12 photos</p></EditorSection></div><aside className="space-y-5"><section className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-900">Listing health</h2><span className="text-sm font-semibold text-zinc-950">92%</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full w-[92%] rounded-full bg-zinc-950" /></div><p className="mt-4 text-[11px] leading-5 text-zinc-500">Add room availability to help students make faster decisions.</p></section><section className="rounded-2xl border border-zinc-200 bg-white p-5"><h2 className="text-sm font-semibold text-zinc-900">Approval</h2><div className="mt-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={17} /></span><div><p className="text-xs font-semibold text-zinc-700">Approved</p><p className="mt-0.5 text-[10px] text-zinc-400">Since 18 Sep 2026</p></div></div><p className="mt-4 border-t border-zinc-100 pt-4 text-[11px] leading-5 text-zinc-500">Important changes are reviewed before appearing publicly.</p></section></aside></div></main>
}

function EditorSection({ title, description, children }) { return <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6"><div className="mb-6"><h2 className="text-sm font-semibold text-zinc-900">{title}</h2><p className="mt-1 text-xs text-zinc-400">{description}</p></div>{children}</section> }

function Messages() {
  const [active, setActive] = useState(0)
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState([])
  const person = conversations[active]
  function sendMessage() { if (!draft.trim()) return; setSent([...sent, draft.trim()]); setDraft('') }
  return <main className="mx-auto max-w-[1200px] p-5 lg:p-8"><PageHeading eyebrow="Student inquiries" title="Messages." description="Answer questions and turn interest into confirmed residents." /><div className="mt-7 grid min-h-[620px] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[330px_1fr]"><aside className="border-b border-zinc-200 lg:border-b-0 lg:border-r"><div className="border-b border-zinc-100 p-4"><div className="flex h-10 items-center gap-2 rounded-xl bg-zinc-50 px-3"><Search size={15} className="text-zinc-400" /><input placeholder="Search conversations" className="w-full bg-transparent text-xs outline-none placeholder:text-zinc-400" /></div></div><div className="p-2">{conversations.map((item, index) => <button key={item.name} onClick={() => setActive(index)} className={cn('flex w-full items-start gap-3 rounded-xl p-3 text-left transition', active === index ? 'bg-zinc-100' : 'hover:bg-zinc-50')}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">{item.initials}</span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><span className="truncate text-xs font-semibold text-zinc-700">{item.name}</span><span className="text-[9px] text-zinc-400">{item.time}</span></span><span className="mt-1 block truncate text-[11px] text-zinc-400">{item.text}</span></span>{item.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-zinc-950 px-1 text-[9px] font-bold text-white">{item.unread}</span>}</button>)}</div></aside><section className="flex min-h-[520px] flex-col"><div className="flex items-center justify-between border-b border-zinc-100 p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">{person.initials}</span><div><p className="text-xs font-semibold text-zinc-800">{person.name}</p><p className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online</p></div></div><button className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-50"><MoreHorizontal size={16} /></button></div><div className="flex flex-1 flex-col justify-end gap-4 p-5"><div className="max-w-[360px] rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-xs leading-5 text-zinc-600">Hi, is the single room with the attached bathroom still available?</div><div className="max-w-[360px] self-end rounded-2xl rounded-br-md bg-zinc-950 px-4 py-3 text-xs leading-5 text-white">Hello {person.name.split(' ')[0]}, yes it is available. The monthly rent is PKR 28,500 including Wi-Fi and utilities.</div><div className="max-w-[330px] rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-xs leading-5 text-zinc-600">That sounds good. Can I arrange a visit this Saturday?</div>{sent.map((message, index) => <div key={index} className="max-w-[360px] self-end rounded-2xl rounded-br-md bg-zinc-950 px-4 py-3 text-xs leading-5 text-white">{message}</div>)}</div><div className="flex items-end gap-2 border-t border-zinc-100 p-4"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder="Write a reply..." rows="1" className="min-h-11 flex-1 resize-none rounded-xl bg-zinc-50 px-3.5 py-3 text-xs outline-none placeholder:text-zinc-400" /><button onClick={sendMessage} className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-950 text-white"><Send size={15} /></button></div></section></div></main>
}

function Subscription() {
  return <main className="mx-auto max-w-[1050px] p-5 lg:p-8"><PageHeading eyebrow="Billing" title="Subscription." description="Simple pricing for owners who want their property to stand out." /><div className="mt-7 rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><span className="rounded-full bg-zinc-950 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Active</span><span className="text-xs font-medium text-zinc-400">Owner Pro</span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">PKR 2,499 <span className="text-sm font-normal text-zinc-400">/ month</span></p><p className="mt-2 text-xs text-zinc-500">Your plan renews on 18 October 2026.</p></div><button className="h-11 self-start rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-600 sm:self-auto">Manage billing</button></div><div className="mt-7 grid gap-3 border-t border-zinc-100 pt-6 sm:grid-cols-2">{['One active property listing', 'Unlimited student inquiries', 'Performance analytics', 'Priority listing review', 'Photo gallery with 12 images', 'Verified owner badge'].map((feature) => <div key={feature} className="flex items-center gap-2 text-xs text-zinc-600"><span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-100"><Check size={11} /></span>{feature}</div>)}</div></div><section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-zinc-900">Payment method</h2><p className="mt-1 text-xs text-zinc-400">Used for monthly renewal</p></div><button className="text-xs font-semibold text-zinc-500">Edit</button></div><div className="mt-5 flex items-center gap-3 rounded-xl bg-zinc-50 p-4"><span className="grid h-10 w-12 place-items-center rounded-lg bg-white text-xs font-bold text-zinc-700 shadow-sm">VISA</span><div><p className="text-xs font-semibold text-zinc-700">•••• •••• •••• 4242</p><p className="mt-1 text-[10px] text-zinc-400">Expires 08/28</p></div></div></section></main>
}

function Profile() {
  const [saved, setSaved] = useState(false)
  return <main className="mx-auto max-w-[1000px] p-5 lg:p-8"><PageHeading eyebrow="Account" title="Owner profile." description="Keep your contact and verification details up to date." action={<button onClick={() => setSaved(true)} className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white">{saved && <Check size={14} />}{saved ? 'Changes saved' : 'Save changes'}</button>} /><div className="mt-7 grid gap-5"><section className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-zinc-950 text-lg font-semibold text-white">AM</span><div><h2 className="text-sm font-semibold text-zinc-900">Areeba Malik</h2><p className="mt-1 text-xs text-zinc-400">Property owner</p><button className="mt-2 text-[11px] font-semibold text-zinc-600">Change photo</button></div><span className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 sm:flex"><CheckCircle2 size={13} /> Identity verified</span></div></section><section className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="mb-6"><h2 className="text-sm font-semibold text-zinc-900">Personal information</h2><p className="mt-1 text-xs text-zinc-400">Used for account and student communication.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="field"><span>First name</span><input className="input" defaultValue="Areeba" /></label><label className="field"><span>Last name</span><input className="input" defaultValue="Malik" /></label><label className="field"><span>Email address</span><input className="input" type="email" defaultValue="areeba@example.com" /></label><label className="field"><span>Phone number</span><input className="input" defaultValue="+92 300 1234567" /></label><label className="field sm:col-span-2"><span>CNIC number</span><input className="input" defaultValue="35202-•••••••-4" disabled /></label></div></section></div></main>
}

function AccountEntry({ onAuthenticated }) {
  const [mode, setMode] = useState('choose')
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [usernameState, setUsernameState] = useState('')
  const update = key => event => { setForm(current => ({ ...current, [key]: event.target.value })); if (key === 'username') setUsernameState('') }
  async function checkUsername() {
    const value = form.username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,24}$/.test(value)) { setUsernameState(value ? 'Use 3–24 letters, numbers, or underscores.' : ''); return }
    try {
      const result = await api(`/auth/username-available?username=${encodeURIComponent(value)}`)
      setUsernameState(result.data.available ? 'Username is available.' : 'That username is taken. Please choose another username.')
    } catch { setUsernameState('Could not check username. Try again.') }
  }
  async function submit(event) {
    event.preventDefault(); setError('')
    if (mode === 'register' && form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (mode === 'register' && usernameState.includes('taken')) { setError('That username is taken. Please choose another username.'); return }
    setBusy(true)
    try {
      const response = mode === 'login'
        ? await authApi.login({ username: form.username.trim(), password: form.password })
        : await authApi.register({ username: form.username.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim(), email: form.email.trim(), password: form.password, role: 'OWNER' })
      onAuthenticated(response.data)
    } catch (cause) {
      setError(cause.status === 409 ? 'That username or email is already registered. Please choose another username or use the login page.' : cause.message || 'Something went wrong. Please try again.')
      if (cause.status === 409) setUsernameState('That username is taken. Please choose another username.')
    } finally { setBusy(false) }
  }
  async function demoLogin() {
    setError(''); setBusy(true)
    try {
      const response = await authApi.login({ username: 'owner', password: 'Password123!' })
      onAuthenticated(response.data)
    } catch (cause) { setError(cause.message || 'Demo account unavailable. Start the server and run npm run seed in the server folder.') }
    finally { setBusy(false) }
  }
  const inputClass = 'input'
  return <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1fr_1fr]">
    <section className="hidden min-h-screen flex-col justify-between bg-zinc-950 p-12 text-white lg:flex"><Logo /><div className="max-w-lg"><p className="text-xs font-semibold uppercase tracking-[.2em] text-zinc-400">HostelHub · Owner portal</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-[-.05em]">A better home for your hostel business.</h1><p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">Manage your listing, connect with students, and keep everything in one place.</p></div><p className="text-xs text-zinc-500">Your property, your workspace.</p></section>
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-[440px]">
      <div className="mb-10 lg:hidden"><Logo /></div>
      {mode === 'choose' ? <><p className="eyebrow">Welcome to HostelHub</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">Owner portal access</h2><p className="mt-3 text-sm leading-6 text-zinc-500">Log in to manage your hostel or create an owner account to get started.</p><div className="mt-8 grid gap-3"><button onClick={() => setMode('login')} className="flex h-14 items-center justify-between rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white">Log in <ArrowRight size={17} /></button><button onClick={() => setMode('register')} className="flex h-14 items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800">Register as an owner <ArrowRight size={17} /></button></div></> : <>
        <button onClick={() => { setMode('choose'); setError(''); setUsernameState('') }} className="mb-7 text-xs font-medium text-zinc-500 hover:text-zinc-950">← Back</button>
        <p className="eyebrow">{mode === 'register' ? 'Create your account' : 'Welcome back'}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">{mode === 'register' ? 'Register as an owner.' : 'Log in to your account.'}</h2><p className="mt-2 text-sm text-zinc-500">{mode === 'register' ? 'Tell us about yourself to set up your owner profile.' : 'Enter your username and password to continue.'}</p>
        <form onSubmit={submit} className="mt-7 grid gap-4">
          <label className="field"><span>Username</span><input className={inputClass} autoComplete="username" required minLength="3" maxLength="24" value={form.username} onChange={update('username')} onBlur={mode === 'register' ? checkUsername : undefined} placeholder="e.g. areeba_malik" />{mode === 'register' && usernameState && <small className={usernameState.includes('available') ? 'text-emerald-700' : 'text-rose-600'}>{usernameState}</small>}</label>
          {mode === 'register' && <><div className="grid grid-cols-2 gap-3"><label className="field"><span>First name</span><input className={inputClass} autoComplete="given-name" required maxLength="60" value={form.firstName} onChange={update('firstName')} /></label><label className="field"><span>Last name</span><input className={inputClass} autoComplete="family-name" required maxLength="60" value={form.lastName} onChange={update('lastName')} /></label></div><label className="field"><span>Phone number</span><input className={inputClass} type="tel" autoComplete="tel" required maxLength="30" value={form.phone} onChange={update('phone')} /></label><label className="field"><span>Email address</span><input className={inputClass} type="email" autoComplete="email" required value={form.email} onChange={update('email')} /></label></>}
          <label className="field"><span>Password</span><input className={inputClass} type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 10 : 1} value={form.password} onChange={update('password')} /></label>
          {mode === 'register' && <label className="field"><span>Confirm password</span><input className={inputClass} type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={update('confirmPassword')} /></label>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">{error}</p>}
          <button disabled={busy} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Please wait…' : mode === 'register' ? 'Create owner account' : 'Log in'} {!busy && <ArrowRight size={16} />}</button>
        </form>{mode === 'login' && <button disabled={busy} onClick={demoLogin} className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 disabled:opacity-50">{busy ? 'Please wait…' : 'Log in with demo owner account'}</button>}<p className="mt-6 text-center text-xs text-zinc-500">{mode === 'register' ? 'Already have an account?' : 'New to HostelHub?'} <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); setUsernameState('') }} className="font-semibold text-zinc-950">{mode === 'register' ? 'Log in' : 'Register'}</button></p>
      </>}
    </div></main>
  </div>
}

function NotFound() { return <main className="grid min-h-[70vh] place-items-center p-6 text-center"><div><p className="eyebrow">404</p><h1 className="page-title mt-2">Page not found.</h1><NavLink to="/dashboard" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white">Back to overview <ArrowRight size={14} /></NavLink></div></main> }

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { authApi.me().then(result => setUser(result.data)).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  async function signOut() { try { await authApi.logout() } finally { setUser(null) } }
  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-sm text-zinc-400">Loading your workspace…</div>
  if (!user) return <AccountEntry onAuthenticated={setUser} />
  const firstName = user.firstName || user.name?.split(/\s+/)[0]
  return <Shell user={user} onSignOut={signOut}><Routes><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Dashboard firstName={firstName} />} /><Route path="/hostel" element={<HostelEditor />} /><Route path="/messages" element={<Messages />} /><Route path="/subscription" element={<Subscription />} /><Route path="/profile" element={<Profile />} /><Route path="*" element={<NotFound />} /></Routes></Shell>
}
