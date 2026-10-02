import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Button, Cover, Empty, ErrorNotice, Field, Loading, Page, Pagination, useResource } from '../components/ui'

function Favorite({ hostel, onChange }) {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saved = user?.favoriteIds?.includes(hostel._id)
  if (user && user.role !== 'STUDENT') return null
  async function toggle() {
    if (!user) { navigate('/login', { state: { from: `/hostels/${hostel._id}` } }); return }
    setBusy(true); setError('')
    try { await api(`/hostels/${hostel._id}/favorite`, { method: saved ? 'DELETE' : 'POST' }); setUser(current => current && ({ ...current, favoriteIds: saved ? current.favoriteIds.filter(id => id !== hostel._id) : [...(current.favoriteIds || []), hostel._id] })); onChange?.() }
    catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  return <div><Button secondary disabled={busy} onClick={toggle} aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}><Heart size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save'}</Button><ErrorNotice>{error}</ErrorNotice></div>
}
export function HostelCard({ hostel, onChange }) {
  return <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-lg"><Link to={`/hostels/${hostel._id}`}><Cover hostel={hostel} /><div className="px-5 pt-5"><h2 className="font-semibold">{hostel.name}</h2><p className="mt-2 flex items-center gap-1 text-xs text-zinc-500"><MapPin size={12} />{hostel.city} · {hostel.address}</p></div></Link><div className="mx-5 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 py-4"><div><p className="text-sm font-semibold">PKR {hostel.price.toLocaleString()} <span className="text-xs font-normal text-zinc-400">/ month</span></p><p className="mt-1 text-xs text-zinc-500">{hostel.beds} beds · {hostel.gender === 'ANY' ? 'All residents' : hostel.gender.toLowerCase()}</p></div><Favorite hostel={hostel} onChange={onChange} /></div></article>
}
export function Hostels({ favorites = false }) {
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState(() => Object.fromEntries(['q', 'city', 'minPrice', 'maxPrice', 'gender', 'sort'].map(key => [key, params.get(key) || ''])))
  const query = new URLSearchParams()
  for (const key of ['q', 'city', 'minPrice', 'maxPrice', 'gender', 'sort', 'page']) if (params.get(key)) query.set(key, params.get(key))
  if (favorites) { const page = query.get('page'); query.forEach((_, key) => { if (key !== 'page') query.delete(key) }); query.delete('q'); query.delete('city'); query.delete('minPrice'); query.delete('maxPrice'); query.delete('gender'); query.delete('sort'); if (page) query.set('page', page) }
  const list = useResource(`/${favorites ? 'favorites' : 'hostels'}?${query}`)
  const update = key => event => setFilters(current => ({ ...current, [key]: event.target.value }))
  function search(event) { event.preventDefault(); setParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))) }
  return <Page eyebrow={favorites ? 'Your collection' : 'Explore spaces'} title={favorites ? 'Saved hostels.' : 'Find your next place.'} description={favorites ? 'Your saved, currently approved listings.' : 'Search approved hostels by location, budget and availability.'}>{!favorites && <form onSubmit={search} className="panel mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Search"><input className="input" placeholder="Name or area" value={filters.q} onChange={update('q')} maxLength={100} /></Field><Field label="City"><input className="input" value={filters.city} onChange={update('city')} maxLength={100} /></Field><Field label="Minimum monthly price"><input className="input" type="number" min={0} max={10000000} value={filters.minPrice} onChange={update('minPrice')} /></Field><Field label="Maximum monthly price"><input className="input" type="number" min={filters.minPrice || 0} max={10000000} value={filters.maxPrice} onChange={update('maxPrice')} /></Field><Field label="Residents"><select className="input" value={filters.gender} onChange={update('gender')}><option value="">All listings</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="ANY">Any</option></select></Field><Field label="Sort"><select className="input" value={filters.sort} onChange={update('sort')}><option value="">Newest</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option></select></Field><Button className="self-end">Search</Button><Button secondary type="button" className="self-end" onClick={() => { setFilters({ q: '', city: '', minPrice: '', maxPrice: '', gender: '', sort: '' }); setParams({}) }}>Clear filters</Button></form>}<ErrorNotice retry={list.reload}>{list.error}</ErrorNotice>{list.loading ? <Loading /> : list.result && <><p className="mb-5 text-sm text-zinc-500">{list.result.pagination.total} {list.result.pagination.total === 1 ? 'place' : 'places'}</p><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.result.data.map(hostel => <HostelCard key={hostel._id} hostel={hostel} onChange={favorites ? list.reload : undefined} />)}</div>{!list.result.data.length && <Empty>{favorites ? 'No saved hostels yet. Browse listings to find your favorites.' : 'No matching hostels. Try changing your filters.'}</Empty>}<Pagination pagination={list.result.pagination} onChange={page => { const next = new URLSearchParams(params); next.set('page', page); setParams(next) }} /></>}</Page>
}
export function HostelDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { result, loading, error, reload } = useResource(`/hostels/${id}`)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  async function message() {
    if (!user) { navigate('/login', { state: { from: `/hostels/${id}` } }); return }
    setBusy(true); setActionError('')
    try { const chat = await api('/conversations', { method: 'POST', body: { hostelId: id } }); navigate(`/messages?conversation=${chat.data._id}`) }
    catch (cause) { setActionError(cause.message) } finally { setBusy(false) }
  }
  const hostel = result?.data
  return <Page eyebrow="Find your space" title={hostel?.name || 'Hostel details'}><ErrorNotice retry={reload}>{error}</ErrorNotice>{loading && <Loading />}{hostel && <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><section><Cover hostel={hostel} className="h-80 w-full" /><div className="mt-4 grid grid-cols-3 gap-3">{hostel.images.map(image => <a key={image.publicId} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={`${hostel.name} photo`} className="h-28 w-full rounded-xl object-cover" /></a>)}</div><p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-600">{hostel.description}</p><div className="mt-5 flex flex-wrap gap-2">{hostel.amenities.map(item => <span key={item} className="rounded-lg bg-zinc-100 px-3 py-2 text-xs">{item}</span>)}</div></section><aside className="panel h-fit"><p className="text-2xl font-semibold">PKR {hostel.price.toLocaleString()}<span className="text-xs font-normal text-zinc-400"> / month</span></p><p className="mt-4 text-sm text-zinc-500">{hostel.address}, {hostel.city}</p><p className="mt-3 text-sm text-zinc-500">{hostel.beds} available beds · {hostel.gender}</p><p className="mt-3 text-sm text-zinc-500">Managed by {hostel.owner?.name || 'Hostel owner'}</p><div className="mt-6 flex flex-wrap gap-3"><Favorite hostel={hostel} />{(!user || user.role === 'STUDENT') && <Button disabled={busy} onClick={message}>{busy ? 'Opening…' : 'Message owner'}</Button>}</div><ErrorNotice>{actionError}</ErrorNotice></aside></div>}</Page>
}
