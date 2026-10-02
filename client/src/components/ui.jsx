import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function useResource(path) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ result: null, error: '', loading: true, path })
  useEffect(() => {
    const controller = new AbortController()
    if (!path) { setState({ result: null, error: '', loading: false, path }); return }
    setState({ result: null, error: '', loading: true, path })
    api(path, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setState({ result, error: '', loading: false, path })
    }).catch(error => { if (!controller.signal.aborted) setState({ result: null, error: error.message, loading: false, path }) })
    return () => controller.abort()
  }, [path, version])
  const current = state.path === path ? state : { result: null, error: '', loading: true }
  return { ...current, reload: () => setVersion(value => value + 1) }
}
export function Page({ eyebrow, title, description, children, action }) {
  return <main className="mx-auto max-w-[1240px] p-5 py-10 lg:p-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title mt-3">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>}</div>{action}</div>{children}</main>
}
export function ErrorNotice({ children, retry }) { return children ? <div role="alert" className="my-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{children}{retry && <button className="ml-3 underline" onClick={retry}>Try again</button>}</div> : null }
export function Notice({ children }) { return children ? <p role="status" className="my-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{children}</p> : null }
export function Loading() { return <p role="status" className="p-6 text-sm text-zinc-500">Loading…</p> }
export function Empty({ children }) { return <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">{children}</p> }
export function Button({ secondary = false, className = '', ...props }) { return <button {...props} className={`${secondary ? 'border border-zinc-200 bg-white text-zinc-700' : 'bg-zinc-950 text-white'} inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${className}`} /> }
export function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
export function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.total <= pagination.limit) return null
  return <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-4"><Button secondary disabled={pagination.page <= 1} onClick={() => onChange(pagination.page - 1)}>Previous</Button><span className="text-xs text-zinc-500">Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span><Button secondary disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => onChange(pagination.page + 1)}>Next</Button></nav>
}
export function Status({ value }) { return <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold tracking-wide text-zinc-600">{value}</span> }
export function Deferred({ title }) { return <Page title={title} eyebrow="Coming later"><Empty>This feature is not available yet.</Empty></Page> }
export function Cover({ hostel, className = 'h-52 w-full' }) {
  const image = hostel.images?.find(item => item.publicId === hostel.coverImage) || hostel.images?.[0]
  return image ? <img src={image.url} alt={hostel.name} className={`${className} rounded-xl object-cover`} /> : <div className={`${className} grid place-items-center rounded-xl bg-zinc-100 text-xs text-zinc-400`}>No photos yet</div>
}
