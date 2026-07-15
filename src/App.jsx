import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive, ArchiveRestore, ArrowLeft, Bell, Check, ChevronDown, Clock3, Command,
  Download, FileText, Inbox, Mail, MailOpen, Menu, MoreHorizontal, Paperclip,
  PenLine, Plus, Reply, Search, Send, Settings, Sparkles, Star, Trash2, X,
} from 'lucide-react'
import { navigation, seedEmails } from './data/emails'
import { emptyMailboxMeta, getVisibleEmails, inboxStats, moveId, toggleEmailField } from './lib/mailbox'

const navIcons = { inbox: Inbox, starred: Star, snoozed: Clock3, sent: Send, drafts: FileText, archive: Archive }
const filters = ['All mail', 'Unread', 'Important', 'Attachments']

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}

function Logo() {
  return <div className="brand" aria-label="Mailstar home">
    <div className="brand-mark"><Mail size={17} strokeWidth={2.7} /><Sparkles className="brand-spark" size={11} fill="currentColor" /></div>
    <span>mailstar</span>
  </div>
}

function Avatar({ email, large = false }) {
  return <div className={`avatar ${large ? 'avatar-large' : ''}`} style={{ background: email.avatarColor }}>{email.avatar}</div>
}

function IconButton({ label, active = false, className = '', children, ...props }) {
  return <button className={`icon-button ${active ? 'active' : ''} ${className}`} aria-label={label} title={label} {...props}>{children}</button>
}

function Sidebar({ view, stats, mobileOpen, onClose, onNavigate, onCompose }) {
  return <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
    <div className="sidebar-top">
      <Logo />
      <IconButton label="Close menu" className="mobile-close" onClick={onClose}><X size={18} /></IconButton>
    </div>
    <button className="compose-button" onClick={onCompose}><Plus size={20} /><span>New message</span><kbd>C</kbd></button>
    <nav className="nav-list" aria-label="Mailbox folders">
      {navigation.map((item) => {
        const Icon = navIcons[item.id]
        const count = item.id === 'inbox' ? stats.unread : item.id === 'drafts' ? 1 : null
        return <button key={item.id} className={view === item.id ? 'selected' : ''} onClick={() => onNavigate(item.id)}>
          <Icon size={18} strokeWidth={view === item.id ? 2.5 : 2} /><span>{item.label}</span>{count ? <b>{count}</b> : null}
        </button>
      })}
    </nav>
    <div className="sidebar-divider" />
    <div className="labels-heading"><span>Labels</span><button aria-label="Add label"><Plus size={15} /></button></div>
    <div className="label-list">
      <button><i className="dot tangerine" />Needs reply <span>2</span></button>
      <button><i className="dot violet" />Projects <span>4</span></button>
      <button><i className="dot green" />Reading <span>8</span></button>
    </div>
    <div className="sidebar-footer">
      <div className="storage"><span><b>1.8 GB</b> of 15 GB</span><div><i /></div></div>
      <button className="profile"><div className="profile-avatar">AF</div><span><b>Andrew Ferguson</b><small>andrew@mailstar.app</small></span><MoreHorizontal size={17} /></button>
    </div>
  </aside>
}

function MailItem({ email, selected, onSelect, onToggleStar }) {
  return <article className={`mail-item ${email.unread ? 'unread' : ''} ${selected ? 'selected' : ''}`}>
    <button className="mail-select" onClick={onSelect} aria-label={`Open ${email.subject}`}>
      <Avatar email={email} />
      <div className="mail-copy">
        <div className="mail-row"><b>{email.sender}</b><time>{email.time}</time></div>
        <h3>{email.subject}</h3>
        <p>{email.preview}</p>
        <div className="mail-meta">
          {email.priority === 'high' ? <span className="priority-pill">Important</span> : null}
          {email.labels.slice(0, 1).map((label) => <span key={label}>{label}</span>)}
          {email.hasAttachment ? <Paperclip size={13} /> : null}
        </div>
      </div>
    </button>
    <button className={`star-button ${email.starred ? 'starred' : ''}`} onClick={onToggleStar} aria-label={email.starred ? 'Unstar' : 'Star'}>
      <Star size={17} fill={email.starred ? 'currentColor' : 'none'} />
    </button>
  </article>
}

function EmptyState({ view, query, onCompose }) {
  const copy = query ? ['No messages found', 'Try a different person, subject, or label.']
    : view === 'archive' ? ['Nothing in the archive', 'Messages you archive will wait here, out of the way.']
      : view === 'snoozed' ? ['Nothing is snoozed', 'Snooze a message and it will return when you are ready.']
        : view === 'sent' ? ['No sent messages yet', 'Send something brilliant and it will appear here.']
          : ['The coast is clear', 'There is nothing waiting in this view.']
  return <div className="empty-state"><div><MailOpen size={27} /></div><h3>{copy[0]}</h3><p>{copy[1]}</p>{view === 'sent' ? <button onClick={onCompose}>Write a message</button> : null}</div>
}

function MailList({ view, filter, setFilter, emails, selectedId, query, onSelect, onToggleStar, onCompose }) {
  const title = navigation.find((item) => item.id === view)?.label || 'Inbox'
  return <section className={`mail-list-panel ${selectedId ? 'has-selection' : ''}`}>
    <header className="list-header">
      <div><p className="eyebrow">Mailbox</p><h1>{title}</h1></div>
      <button className="filter-select">Newest first <ChevronDown size={15} /></button>
    </header>
    {['inbox', 'starred'].includes(view) ? <div className="filter-tabs" role="tablist" aria-label="Message filters">
      {filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
    </div> : null}
    <div className="mail-list" aria-live="polite">
      {emails.length ? emails.map((email) => <MailItem key={email.id} email={email} selected={email.id === selectedId} onSelect={() => onSelect(email.id)} onToggleStar={() => onToggleStar(email.id)} />)
        : <EmptyState view={view} query={query} onCompose={onCompose} />}
    </div>
  </section>
}

function Reader({ email, archived, snoozed, onClose, onToggleStar, onToggleRead, onArchive, onSnooze, onDelete, onReply }) {
  if (!email) return <section className="reader reader-blank">
    <div className="blank-orbit"><Mail size={27} /><Sparkles size={16} /></div>
    <p>Select a message to read</p><span>Tip: press <kbd>J</kbd> and <kbd>K</kbd> to move through your inbox.</span>
  </section>
  return <section className="reader active-reader">
    <div className="reader-toolbar">
      <IconButton label="Back to list" className="reader-back" onClick={onClose}><ArrowLeft size={19} /></IconButton>
      <div className="reader-actions">
        <IconButton label={archived ? 'Move to inbox' : 'Archive'} onClick={onArchive}>{archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}</IconButton>
        <IconButton label={snoozed ? 'Unsnooze' : 'Snooze'} active={snoozed} onClick={onSnooze}><Clock3 size={18} /></IconButton>
        <IconButton label={email.unread ? 'Mark read' : 'Mark unread'} onClick={onToggleRead}>{email.unread ? <MailOpen size={18} /> : <Mail size={18} />}</IconButton>
        <IconButton label="Delete" onClick={onDelete}><Trash2 size={18} /></IconButton>
        <IconButton label="More actions"><MoreHorizontal size={19} /></IconButton>
      </div>
    </div>
    <article className="message-content">
      <div className="message-heading">
        <div className="message-labels">{email.labels.map((label) => <span key={label}>{label}</span>)}</div>
        <h2>{email.subject}</h2>
      </div>
      <div className="sender-line">
        <Avatar email={email} large />
        <div><b>{email.sender}</b><span>to me · {email.date}</span></div>
        <IconButton label={email.starred ? 'Unstar' : 'Star'} active={email.starred} onClick={onToggleStar}><Star size={18} fill={email.starred ? 'currentColor' : 'none'} /></IconButton>
      </div>
      <div className="message-body">{email.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {email.attachment ? <button className="attachment-card">
        <span className="pdf-icon"><FileText size={21} /></span><span><b>{email.attachment.name}</b><small>{email.attachment.size} · PDF</small></span><Download size={18} />
      </button> : null}
      <div className="reply-box" role="button" tabIndex="0" onClick={onReply} onKeyDown={(event) => event.key === 'Enter' && onReply()}>
        <Reply size={18} /><span>Reply to {email.sender.split(' ')[0]}…</span><kbd>R</kbd>
      </div>
      <p className="secure-note"><Check size={13} /> Message scanned and protected by Mailstar</p>
    </article>
  </section>
}

function ComposeModal({ mode = 'compose', replyingTo, onClose, onSend }) {
  const [to, setTo] = useState(replyingTo?.email || '')
  const [subject, setSubject] = useState(replyingTo ? `Re: ${replyingTo.subject}` : '')
  const [body, setBody] = useState('')
  const canSend = to.trim() && subject.trim() && body.trim()
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="compose-title">
      <header><div><p>{mode === 'reply' ? 'Reply' : 'New message'}</p><h2 id="compose-title">{mode === 'reply' ? `Reply to ${replyingTo.sender}` : 'Make it count.'}</h2></div><IconButton label="Close compose" onClick={onClose}><X size={20} /></IconButton></header>
      <label><span>To</span><input value={to} onChange={(event) => setTo(event.target.value)} placeholder="name@example.com" autoFocus /></label>
      <label><span>Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What is this about?" /></label>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write something worth reading…" aria-label="Message body" />
      <footer>
        <div><IconButton label="Attach file"><Paperclip size={18} /></IconButton><button className="ai-write"><Sparkles size={16} />Help me write</button></div>
        <button className="send-button" disabled={!canSend} onClick={() => onSend({ to, subject, body })}>Send message <Send size={16} /></button>
      </footer>
    </section>
  </div>
}

function CommandPalette({ onClose, commands }) {
  const [query, setQuery] = useState('')
  const visible = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))
  return <div className="modal-backdrop command-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command menu">
      <label><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command…" /><kbd>ESC</kbd></label>
      <div>{visible.map((command) => <button key={command.label} onClick={() => { command.action(); onClose() }}><command.icon size={18} /><span>{command.label}</span>{command.key ? <kbd>{command.key}</kbd> : null}</button>)}</div>
      <footer><span><i>↑</i><i>↓</i> Navigate</span><span><i>↵</i> Select</span></footer>
    </section>
  </div>
}

function Toast({ message }) {
  return message ? <div className="toast"><Check size={16} />{message}</div> : null
}

export default function App() {
  const [emails, setEmails] = useStoredState('mailstar-emails-v1', seedEmails)
  const [meta, setMeta] = useStoredState('mailstar-meta-v1', emptyMailboxMeta)
  const [view, setView] = useState('inbox')
  const [filter, setFilter] = useState('All mail')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(seedEmails[0].id)
  const [compose, setCompose] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')
  const searchRef = useRef(null)
  const toastTimer = useRef(null)

  const visibleEmails = useMemo(() => getVisibleEmails(emails, { view, filter, query, meta }), [emails, view, filter, query, meta])
  const stats = useMemo(() => inboxStats(emails, meta), [emails, meta])
  const selectedEmail = emails.find((email) => email.id === selectedId)
  const isArchived = meta.archived.includes(selectedId)
  const isSnoozed = meta.snoozed.includes(selectedId)

  function notify(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  function navigate(nextView) {
    setView(nextView); setFilter('All mail'); setQuery(''); setSelectedId(null); setSidebarOpen(false)
  }

  function toggleField(id, field) {
    setEmails((current) => toggleEmailField(current, id, field))
  }

  function archiveSelected() {
    if (!selectedId) return
    const restoring = meta.archived.includes(selectedId)
    setMeta((current) => ({ ...current, archived: moveId(current.archived, selectedId, !restoring), snoozed: moveId(current.snoozed, selectedId, false) }))
    notify(restoring ? 'Moved back to inbox' : 'Message archived')
    setSelectedId(null)
  }

  function snoozeSelected() {
    if (!selectedId) return
    const restoring = meta.snoozed.includes(selectedId)
    setMeta((current) => ({ ...current, snoozed: moveId(current.snoozed, selectedId, !restoring), archived: moveId(current.archived, selectedId, false) }))
    notify(restoring ? 'Returned to inbox' : 'Snoozed until tomorrow')
    setSelectedId(null)
  }

  function deleteSelected() {
    setEmails((current) => current.filter((email) => email.id !== selectedId))
    setSelectedId(null)
    notify('Message moved to trash')
  }

  function moveSelection(direction) {
    if (!visibleEmails.length) return
    const index = visibleEmails.findIndex((email) => email.id === selectedId)
    const nextIndex = Math.min(Math.max((index < 0 ? 0 : index) + direction, 0), visibleEmails.length - 1)
    setSelectedId(visibleEmails[nextIndex].id)
  }

  function sendMessage(message) {
    setCompose(null)
    notify(`Message sent to ${message.to}`)
  }

  const commands = [
    { label: 'Compose a new message', icon: PenLine, key: 'C', action: () => setCompose({ mode: 'compose' }) },
    { label: 'Search mail', icon: Search, key: '/', action: () => searchRef.current?.focus() },
    { label: 'Go to inbox', icon: Inbox, action: () => navigate('inbox') },
    { label: 'Go to starred', icon: Star, action: () => navigate('starred') },
    { label: 'Go to archive', icon: Archive, action: () => navigate('archive') },
  ]

  useEffect(() => {
    function handleKeyboard(event) {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true); return }
      if (event.key === 'Escape') { setCompose(null); setPaletteOpen(false); setSidebarOpen(false); return }
      if (typing || compose || paletteOpen) return
      if (event.key === '/') { event.preventDefault(); searchRef.current?.focus() }
      if (event.key.toLowerCase() === 'c') setCompose({ mode: 'compose' })
      if (event.key.toLowerCase() === 'e') archiveSelected()
      if (event.key.toLowerCase() === 's' && selectedId) toggleField(selectedId, 'starred')
      if (event.key.toLowerCase() === 'r' && selectedEmail) setCompose({ mode: 'reply', email: selectedEmail })
      if (event.key.toLowerCase() === 'j') moveSelection(1)
      if (event.key.toLowerCase() === 'k') moveSelection(-1)
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  })

  return <div className="app-shell">
    <Sidebar view={view} stats={stats} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={navigate} onCompose={() => setCompose({ mode: 'compose' })} />
    {sidebarOpen ? <button className="sidebar-scrim" aria-label="Close navigation overlay" onClick={() => setSidebarOpen(false)} /> : null}
    <main className="workspace">
      <header className="topbar">
        <IconButton label="Open menu" className="menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></IconButton>
        <div className="search-box"><Search size={18} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, subjects, or labels" aria-label="Search mail" />{query ? <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button> : <kbd>/</kbd>}</div>
        <button className="command-trigger" onClick={() => setPaletteOpen(true)}><Command size={16} /><span>Quick actions</span><kbd>⌘ K</kbd></button>
        <IconButton label="Notifications" className="notification-button"><Bell size={19} /><i /></IconButton>
        <IconButton label="Settings"><Settings size={19} /></IconButton>
      </header>
      <div className="mail-workspace">
        <MailList view={view} filter={filter} setFilter={setFilter} emails={visibleEmails} selectedId={selectedId} query={query} onSelect={(id) => { setSelectedId(id); if (emails.find((email) => email.id === id)?.unread) toggleField(id, 'unread') }} onToggleStar={(id) => toggleField(id, 'starred')} onCompose={() => setCompose({ mode: 'compose' })} />
        <Reader email={selectedEmail} archived={isArchived} snoozed={isSnoozed} onClose={() => setSelectedId(null)} onToggleStar={() => toggleField(selectedId, 'starred')} onToggleRead={() => toggleField(selectedId, 'unread')} onArchive={archiveSelected} onSnooze={snoozeSelected} onDelete={deleteSelected} onReply={() => setCompose({ mode: 'reply', email: selectedEmail })} />
      </div>
    </main>
    {compose ? <ComposeModal mode={compose.mode} replyingTo={compose.email} onClose={() => setCompose(null)} onSend={sendMessage} /> : null}
    {paletteOpen ? <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} /> : null}
    <Toast message={toast} />
  </div>
}
