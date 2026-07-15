export const emptyMailboxMeta = { archived: [], snoozed: [], sent: [], drafts: [] }

export function getVisibleEmails(emails, { view = 'inbox', filter = 'All mail', query = '', meta = emptyMailboxMeta } = {}) {
  const archived = new Set(meta.archived || [])
  const snoozed = new Set(meta.snoozed || [])
  let result = emails.filter((email) => {
    if (view === 'archive') return archived.has(email.id)
    if (view === 'snoozed') return snoozed.has(email.id)
    if (view === 'starred') return email.starred && !archived.has(email.id) && !snoozed.has(email.id)
    if (view === 'inbox') return !archived.has(email.id) && !snoozed.has(email.id)
    return false
  })

  if (filter === 'Unread') result = result.filter((email) => email.unread)
  if (filter === 'Important') result = result.filter((email) => email.priority === 'high')
  if (filter === 'Attachments') result = result.filter((email) => email.hasAttachment)

  const term = query.trim().toLowerCase()
  if (term) {
    result = result.filter((email) => [email.sender, email.email, email.subject, email.preview, ...email.labels].join(' ').toLowerCase().includes(term))
  }
  return result
}

export function toggleEmailField(emails, id, field) {
  return emails.map((email) => email.id === id ? { ...email, [field]: !email[field] } : email)
}

export function moveId(list = [], id, shouldInclude = true) {
  return shouldInclude ? [...new Set([...list, id])] : list.filter((item) => item !== id)
}

export function inboxStats(emails, meta = emptyMailboxMeta) {
  const visible = getVisibleEmails(emails, { meta })
  return {
    total: visible.length,
    unread: visible.filter((email) => email.unread).length,
    important: visible.filter((email) => email.priority === 'high').length,
  }
}
