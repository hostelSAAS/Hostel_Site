import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { api, authApi, socketURL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Button, Empty, ErrorNotice, Loading, Page, Pagination, useResource } from '../components/ui'

export default function Messages() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const selected = params.get('conversation') || ''
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const [page, setPage] = useState(1)
  const inbox = useResource(`/conversations?page=${page}`)
  const history = useResource(selected ? `/conversations/${selected}/messages?limit=50` : null)
  const [older, setOlder] = useState([])
  const [cursor, setCursor] = useState(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [receipts, setReceipts] = useState({})
  const scroll = useRef(null)
  const readThrough = useRef('')
  useEffect(() => { setOlder([]); setCursor(null); setDraft(''); setError(''); readThrough.current = '' }, [selected])
  useEffect(() => { if (history.result) { setOlder([]); setCursor(history.result.nextCursor) } }, [history.result])
  useEffect(() => {
    const socket = io(socketURL, { withCredentials: true, transports: ['websocket'] })
    socket.on('connect', () => { setLive(true); inbox.reload(); history.reload() })
    socket.on('disconnect', reason => { setLive(false); if (reason === 'io server disconnect') authApi.me().catch(() => {}) })
    socket.on('connect_error', () => setLive(false))
    socket.on('message:new', message => { inbox.reload(); if (message.conversation === selectedRef.current) history.reload() })
    socket.on('messages:read', receipt => {
      inbox.reload()
      if (receipt.userId !== user.id) setReceipts(current => ({ ...current, [receipt.conversationId]: receipt }))
    })
    return () => socket.disconnect()
  }, [user.id])
  const messages = useMemo(() => [...new Map([...older, ...(history.result?.data || [])].map(message => [message._id, message])).values()].sort((a, b) => a._id.localeCompare(b._id)), [older, history.result])
  useEffect(() => {
    if (!selected || !messages.length || !scroll.current) return
    let timer
    let through = ''
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== 'visible') return
      for (const entry of entries) if (entry.isIntersecting && entry.target.dataset.messageId > through) through = entry.target.dataset.messageId
      if (!through || through <= readThrough.current) return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const previous = readThrough.current
        readThrough.current = through
        try { await api(`/conversations/${selected}/read`, { method: 'PATCH', body: { through } }); inbox.reload() }
        catch (cause) { readThrough.current = previous; setError(cause.message) }
      }, 200)
    }, { root: scroll.current, threshold: 0.5 })
    scroll.current.querySelectorAll('[data-incoming="true"]').forEach(node => observer.observe(node))
    const visible = () => { if (document.visibilityState === 'visible') { observer.disconnect(); scroll.current?.querySelectorAll('[data-incoming="true"]').forEach(node => observer.observe(node)) } }
    document.addEventListener('visibilitychange', visible)
    return () => { observer.disconnect(); clearTimeout(timer); document.removeEventListener('visibilitychange', visible) }
  }, [selected, messages])
  async function send(event) {
    event.preventDefault(); if (!draft.trim()) return
    setBusy(true); setError('')
    try { await api(`/conversations/${selected}/messages`, { method: 'POST', body: { text: draft.trim() } }); setDraft(''); history.reload(); inbox.reload() }
    catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  async function loadOlder() {
    const conversation = selected
    setLoadingOlder(true); setError('')
    try { const result = await api(`/conversations/${selected}/messages?before=${cursor}&limit=50`); if (selectedRef.current === conversation) { setOlder(current => [...result.data, ...current]); setCursor(result.nextCursor) } }
    catch (cause) { setError(cause.message) } finally { setLoadingOlder(false) }
  }
  const conversation = inbox.result?.data.find(item => item._id === selected)
  return <Page eyebrow="Your conversations" title="Messages." action={<Button secondary onClick={() => { inbox.reload(); history.reload() }}>Refresh</Button>}><p role="status" className="mb-4 text-xs text-zinc-500">{live ? 'Live updates connected' : 'Live updates reconnecting. You can refresh to check for messages.'}</p><ErrorNotice>{error}</ErrorNotice><div className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white md:grid-cols-[300px_1fr]"><aside className="border-b border-zinc-200 p-3 md:border-b-0 md:border-r"><h2 className="p-2 text-sm font-semibold">Inbox</h2><ErrorNotice retry={inbox.reload}>{inbox.error}</ErrorNotice>{inbox.loading ? <Loading /> : inbox.result?.data.length ? inbox.result.data.map(item => <button key={item._id} onClick={() => setParams({ conversation: item._id })} className={`my-1 w-full rounded-xl p-3 text-left ${selected === item._id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}><span className="flex justify-between gap-2 text-xs font-semibold"><span>{user.role === 'OWNER' ? item.student?.name : item.owner?.name}</span>{item.unreadCount > 0 && <span aria-label="Unread messages">{item.unreadCount}</span>}</span><span className="mt-1 block text-xs text-zinc-500">{item.hostel?.name || 'Listing unavailable'}</span><span className="mt-1 block truncate text-xs text-zinc-400">{item.lastMessage?.text || 'Start a conversation'}</span></button>) : <Empty>No conversations yet.</Empty>}<Pagination pagination={inbox.result?.pagination} onChange={setPage} /></aside><section className="min-w-0 p-4 sm:p-6">{!selected ? <Empty>Choose a conversation to read and reply.</Empty> : <><h2 className="mb-4 text-sm font-semibold">{conversation?.hostel?.name || 'Conversation'}</h2><ErrorNotice retry={history.reload}>{history.error}</ErrorNotice>{history.loading ? <Loading /> : <div ref={scroll} className="flex max-h-[55vh] min-h-48 flex-col gap-3 overflow-y-auto py-3">{cursor && <Button secondary disabled={loadingOlder} onClick={loadOlder}>{loadingOlder ? 'Loading…' : 'Load older messages'}</Button>}{!messages.length && !history.error && <Empty>No messages yet. Say hello.</Empty>}{messages.map(message => {
    const own = message.sender === user.id
    const read = message.readAt || (receipts[selected]?.through >= message._id && receipts[selected]?.readAt)
    return <div key={message._id} data-message-id={message._id} data-incoming={!own} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${own ? 'self-end bg-zinc-950 text-white' : 'self-start bg-zinc-100 text-zinc-700'}`}><p className="whitespace-pre-wrap break-words">{message.text}</p><p className="mt-2 text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString()}{own && (read ? ' · Read' : ' · Sent')}</p></div>
  })}</div>}{!history.error && <form onSubmit={send} className="mt-4 flex gap-2 border-t border-zinc-100 pt-4"><input aria-label="Message" className="input min-w-0 flex-1" required maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a message…" /><Button disabled={busy || !draft.trim()}>{busy ? 'Sending…' : 'Send'}</Button></form>}</>}</section></div></Page>
}
