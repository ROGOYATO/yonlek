import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  updateViewPreferences,
} from './view-preferences'

describe('view preferences', () => {
  it('creates the default workspace view', () => {
    expect(createDefaultViewPreferences()).toEqual({
      projectView: 'all',
      query: '',
      status: 'all',
      priority: 'all',
      dueDate: 'all',
      sort: 'created',
    })
  })

  it('updates selected preferences without mutating the previous value', () => {
    const current = createDefaultViewPreferences()
    const next = updateViewPreferences(current, {
      projectView: 'project-2',
      status: 'done',
      sort: 'priority',
    })

    expect(next).toEqual({
      ...current,
      projectView: 'project-2',
      status: 'done',
      sort: 'priority',
    })
    expect(current).toEqual(createDefaultViewPreferences())
  })
})
