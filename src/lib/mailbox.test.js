import { describe, expect, it } from 'vitest'
import { getVisibleEmails, inboxStats, moveId, toggleEmailField } from './mailbox'

const emails = [
  { id: '1', sender: 'Maya', email: 'm@x.test', subject: 'Launch', preview: 'Live', labels: ['Work'], unread: true, starred: true, priority: 'high', hasAttachment: true },
  { id: '2', sender: 'Nora', email: 'n@x.test', subject: 'Coffee', preview: 'Tuesday', labels: ['Personal'], unread: false, starred: false, priority: 'normal' },
]

describe('mailbox utilities', () => {
  it('filters inbox, archived, and snoozed messages', () => {
    const meta = { archived: ['2'], snoozed: [] }
    expect(getVisibleEmails(emails, { meta }).map((email) => email.id)).toEqual(['1'])
    expect(getVisibleEmails(emails, { view: 'archive', meta }).map((email) => email.id)).toEqual(['2'])
  })

  it('searches across sender, subject, preview, and labels', () => {
    expect(getVisibleEmails(emails, { query: 'personal' }).map((email) => email.id)).toEqual(['2'])
    expect(getVisibleEmails(emails, { query: 'launch' }).map((email) => email.id)).toEqual(['1'])
  })

  it('supports smart filters', () => {
    expect(getVisibleEmails(emails, { filter: 'Unread' })).toHaveLength(1)
    expect(getVisibleEmails(emails, { filter: 'Important' })).toHaveLength(1)
    expect(getVisibleEmails(emails, { filter: 'Attachments' })).toHaveLength(1)
  })

  it('toggles fields immutably', () => {
    const next = toggleEmailField(emails, '1', 'starred')
    expect(next[0].starred).toBe(false)
    expect(emails[0].starred).toBe(true)
  })

  it('moves IDs without duplicates and computes inbox stats', () => {
    expect(moveId(['1'], '1', true)).toEqual(['1'])
    expect(moveId(['1'], '1', false)).toEqual([])
    expect(inboxStats(emails)).toEqual({ total: 2, unread: 1, important: 1 })
  })
})
