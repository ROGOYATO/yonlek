import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { ViewPreferences } from './view-preferences'

type TaskViewMode = 'list' | 'board'
type GetTaskViewModeFn = (preferences: ViewPreferences) => TaskViewMode

describe('view preference Task view mode', () => {
  it('defaults to List and updates Board mode without mutating previous preferences', () => {
    const current = viewPreferenceDomain.createDefaultViewPreferences()
    const getTaskViewMode = (
      viewPreferenceDomain as unknown as { getTaskViewMode: GetTaskViewModeFn }
    ).getTaskViewMode

    expect(getTaskViewMode(current)).toBe('list')

    const next = viewPreferenceDomain.updateViewPreferences(current, {
      viewMode: 'board',
    } as Partial<ViewPreferences>)

    expect(getTaskViewMode(next)).toBe('board')
    expect(current).toEqual(viewPreferenceDomain.createDefaultViewPreferences())
  })
})
