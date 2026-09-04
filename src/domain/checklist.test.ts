import { describe, expect, it } from 'vitest'

import * as checklistDomain from './checklist'

function createChecklistItem() {
  return (
    checklistDomain as typeof checklistDomain & {
      createChecklistItem?: (input: {
        id: string
        text: string
      }) => {
        id: string
        text: string
        completed: boolean
      }
    }
  ).createChecklistItem
}

function renameChecklistItem() {
  return (
    checklistDomain as typeof checklistDomain & {
      renameChecklistItem?: (
        item: { id: string; text: string; completed: boolean },
        text: string,
      ) => { id: string; text: string; completed: boolean }
    }
  ).renameChecklistItem
}

function setChecklistItemCompleted() {
  return (
    checklistDomain as typeof checklistDomain & {
      setChecklistItemCompleted?: (
        item: { id: string; text: string; completed: boolean },
        completed: boolean,
      ) => { id: string; text: string; completed: boolean }
    }
  ).setChecklistItemCompleted
}

describe('checklist item domain', () => {
  it('creates a trimmed incomplete checklist item', () => {
    expect(
      createChecklistItem()?.({
        id: 'check-1',
        text: '  Review safety notes  ',
      }),
    ).toEqual({
      id: 'check-1',
      text: 'Review safety notes',
      completed: false,
    })
  })

  it('rejects a blank checklist item', () => {
    expect(() =>
      createChecklistItem()?.({
        id: 'check-1',
        text: '   ',
      }),
    ).toThrow('Checklist item text is required')
  })

  it('renames a checklist item without mutating the original', () => {
    const item = {
      id: 'check-1',
      text: 'Review safety notes',
      completed: false,
    }

    const next = renameChecklistItem()?.(item, '  Confirm camera mount  ')

    expect(next?.text).toBe('Confirm camera mount')
    expect(item.text).toBe('Review safety notes')
  })

  it('changes completion without mutating the original', () => {
    const item = {
      id: 'check-1',
      text: 'Review safety notes',
      completed: false,
    }

    const next = setChecklistItemCompleted()?.(item, true)

    expect(next?.completed).toBe(true)
    expect(item.completed).toBe(false)
  })
})
