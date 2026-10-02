import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { Button, Cover, Empty, ErrorNotice, Field, Loading, Notice, Page, Pagination, Status, useResource } from '../components/ui'

export function OwnerDashboard() {
  const { user } = useAuth()
  const { result, loading, error, reload } = useResource('/owner/summary')
  const data = result?.data
  return <Page eyebrow="Owner workspace" title={`Welcome, ${user.firstName || user.name}.`} description="Your listings and student conversations." action={<Link className="action-link" to="/hostel">Manage listings</Link>}><ErrorNotice retry={reload}>{error}</ErrorNotice>{loading && <Loading />}{data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Listings', data.hostels.reduce((sum, item) => sum + item.count, 0)], ['Approved', data.hostels.find(item => item._id === 'APPROVED')?.count || 0], ['Conversations', data.conversations], ['Unread messages', data.unreadMessages]].map(([label, value]) => <div className="panel" key={label}><p className="text-xs text-zinc-500">{label}</p><p className="mt-4 text-3xl font-semibold">{value}</p></div>)}</div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><Link className="panel text-sm font-semibold" to="/hostel">Create, edit and submit your listings →</Link><Link className="panel text-sm font-semibold" to="/messages">Read and reply to students →</Link></div></Page>
}
const blank = { name: '', description: '', city: '', address: '', price: '', beds: '', gender: 'ANY', amenities: '' }
function listingForm(hostel) { return hostel ? { ...Object.fromEntries(Object.keys(blank).map(key => [key, hostel[key] ?? blank[key]])), amenities: hostel.amenities.join(', ') } : { ...blank } }
export function OwnerListings() {
  const [page, setPage] = useState(1)
  const list = useResource(`/owner/hostels?page=${page}`)
  const [editing, setEditing] = useState(undefined)
  const [generation, setGeneration] = useState(0)
  return <Page eyebrow="Property management" title="Your hostels." description="Save a draft, upload photos, then submit it for review." action={<Button onClick={() => { setEditing(null); setGeneration(value => value + 1) }}>Create listing</Button>}><ErrorNotice retry={list.reload}>{list.error}</ErrorNotice>{editing !== undefined ? <ListingEditor key={generation} initial={editing} onClose={() => { setEditing(undefined); list.reload() }} onSaved={list.reload} /> : list.loading ? <Loading /> : <><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.result?.data.map(hostel => <article key={hostel._id} className="panel"><Cover hostel={hostel} /><div className="my-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{hostel.name}</h2><Status value={hostel.status} /></div><p className="mb-4 text-xs text-zinc-500">{hostel.city} · PKR {hostel.price.toLocaleString()} / month</p>{hostel.moderationReason && <p className="mb-4 text-sm text-amber-800">Review note: {hostel.moderationReason}</p>}<Button secondary onClick={() => { setEditing(hostel); setGeneration(value => value + 1) }}>Manage listing</Button></article>)}</div>{list.result?.data.length === 0 && <Empty>You have no listings. Create your first hostel to get started.</Empty>}<Pagination pagination={list.result?.pagination} onChange={setPage} /></>}</Page>
}
function ListingEditor({ initial, onClose, onSaved }) {
  const [hostel, setHostel] = useState(initial)
  const [form, setForm] = useState(() => listingForm(initial))
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const suspended = hostel?.status === 'SUSPENDED'
  const update = key => event => { setForm(current => ({ ...current, [key]: event.target.value })); setDirty(true); setNotice('') }
  async function perform(action, message) {
    setBusy(true); setError(''); setNotice('')
    try { const result = await action(); if (result?.data) setHostel(result.data); setNotice(message); onSaved(); return result }
    catch (cause) { setError(cause.message); return null } finally { setBusy(false) }
  }
  async function save(event) {
    event.preventDefault()
    const result = await perform(() => api(hostel ? `/hostels/${hostel._id}` : '/hostels', { method: hostel ? 'PUT' : 'POST', body: { ...form, price: Number(form.price), beds: Number(form.beds), amenities: form.amenities.split(',').map(value => value.trim()).filter(Boolean) } }), 'Draft saved. Submit it when your details and photos are ready.')
    if (result) setDirty(false)
  }
  async function upload(event) {
    const files = Array.from(event.target.files || []); event.target.value = ''
    if (!files.length) return
    if ((hostel.images.length + files.length) > 10 || files.some(file => file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setError('Choose JPEG, PNG or WebP files up to 5 MiB each, with at most 10 photos per listing.'); return }
    const body = new FormData(); files.forEach(file => body.append('images', file))
    await perform(() => api(`/hostels/${hostel._id}/images`, { method: 'POST', body }), 'Photos uploaded. The listing is now a draft.')
  }
  function arrange(images, coverImage) { return perform(() => api(`/hostels/${hostel._id}/images`, { method: 'PUT', body: { publicIds: images.map(image => image.publicId), coverImage } }), 'Photo settings saved. The listing is now a draft.') }
  function move(index, offset) { const images = [...hostel.images]; [images[index], images[index + offset]] = [images[index + offset], images[index]]; arrange(images, hostel.coverImage || images[0].publicId) }
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><Button secondary disabled={busy} onClick={() => { if (!dirty || window.confirm('Discard unsaved changes?')) onClose() }}>Back to listings</Button>{hostel && <Status value={hostel.status} />}</div><ErrorNotice>{error}</ErrorNotice><Notice>{notice}</Notice>{suspended && <ErrorNotice>This listing is suspended. An administrator must restore it before you can edit or submit it.</ErrorNotice>}{hostel?.moderationReason && <p className="text-sm text-amber-800">Review note: {hostel.moderationReason}</p>}<form onSubmit={save} className="panel"><fieldset disabled={busy || suspended} className="grid gap-5 sm:grid-cols-2"><Field label="Hostel name"><input className="input" required maxLength={150} value={form.name} onChange={update('name')} /></Field><Field label="City"><input className="input" required maxLength={100} value={form.city} onChange={update('city')} /></Field><div className="sm:col-span-2"><Field label="Full address"><input className="input" required maxLength={300} value={form.address} onChange={update('address')} /></Field></div><div className="sm:col-span-2"><Field label="Description"><textarea className="input" required maxLength={5000} value={form.description} onChange={update('description')} /></Field></div><Field label="Monthly price (PKR)"><input className="input" type="number" min={0} max={10000000} required value={form.price} onChange={update('price')} /></Field><Field label="Available beds"><input className="input" type="number" min={0} max={10000} step={1} required value={form.beds} onChange={update('beds')} /></Field><Field label="Residents"><select className="input" value={form.gender} onChange={update('gender')}><option value="ANY">Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></Field><Field label="Amenities (comma separated)"><input className="input" value={form.amenities} onChange={update('amenities')} placeholder="WiFi, Laundry" /></Field><Button disabled={busy || suspended}>{busy ? 'Please wait…' : 'Save draft'}</Button></fieldset><p className="mt-4 text-xs leading-5 text-zinc-500">Editing an approved listing returns it to draft and removes it from public search until it is approved again.</p></form>
    {hostel && <section className="panel"><h2 className="text-sm font-semibold">Photos</h2><p className="my-3 text-xs text-zinc-500">JPEG, PNG or WebP · Up to 5 MiB each · Maximum 10 photos</p><input aria-label="Upload photos" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy || suspended || dirty} onChange={upload} className="mb-5 block w-full text-xs" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{hostel.images.map((image, index) => <div key={image.publicId} className="rounded-xl border border-zinc-200 p-3"><img src={image.url} alt={`Hostel photo ${index + 1}`} className="h-40 w-full rounded-lg object-cover" /><div className="mt-3 flex flex-wrap gap-2"><Button secondary disabled={busy || suspended || dirty || image.publicId === hostel.coverImage} onClick={() => arrange(hostel.images, image.publicId)}>{image.publicId === hostel.coverImage ? 'Cover photo' : 'Make cover'}</Button><Button secondary aria-label={`Move photo ${index + 1} earlier`} disabled={busy || suspended || dirty || index === 0} onClick={() => move(index, -1)}>←</Button><Button secondary aria-label={`Move photo ${index + 1} later`} disabled={busy || suspended || dirty || index === hostel.images.length - 1} onClick={() => move(index, 1)}>→</Button><Button secondary disabled={busy || suspended || dirty} onClick={() => perform(() => api(`/hostels/${hostel._id}/images`, { method: 'DELETE', body: { publicId: image.publicId } }), 'Photo removed. The listing is now a draft.')}>Remove</Button></div></div>)}</div></section>}
    {hostel && <section className="panel flex flex-wrap items-center gap-3"><Button disabled={busy || suspended || dirty || !hostel.images.length || !['DRAFT', 'REJECTED'].includes(hostel.status)} onClick={() => perform(() => api(`/hostels/${hostel._id}/submit`, { method: 'POST' }), 'Submitted for administrator review.')}>Submit for review</Button>{dirty && <span className="text-xs text-zinc-500">Save your changes before managing photos or submitting.</span>}<Button secondary disabled={busy} onClick={() => setConfirmDelete(true)}>Delete listing</Button>{confirmDelete && <div className="w-full rounded-xl bg-rose-50 p-4"><p className="mb-3 text-sm text-rose-800">Remove this listing from your account and public search?</p><Button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api(`/hostels/${hostel._id}`, { method: 'DELETE' }); onClose() } catch (cause) { setError(cause.message); setBusy(false) } }}>Confirm deletion</Button><Button secondary disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button></div>}</section>}
  </div>
}
