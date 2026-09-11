import { describe, expect, it } from 'vitest'

import * as viewPreferenceDomain from './view-preferences'
import type { ViewPreferences } from './view-preferences'

type IsTaskViewModeFn = (value: unknown) => boolean

describe('view preference Calendar Task view mode', () => {
  it('recognizes Calendar as a supported mode and still defaults missing mode to List', () => {
    const isTaskViewMode = (
      viewPreferenceDomain as unknown as { isTaskViewMode: IsTaskViewModeFn }
    ).isTaskViewMode

    expect(isTaskViewMode('list')).toBe(true)
    expect(isTaskViewMode('board')).toBe(true)
    expect(isTaskViewMode('calendar')).toBe(true)
    expect(isTaskViewMode('timeline')).toBe(true)
    expect(isTaskViewMode('gantt')).toBe(false)

    const current = viewPreferenceDomain.createDefaultViewPreferences()
    expect(viewPreferenceDomain.getTaskViewMode(current)).toBe('list')

    const next = viewPreferenceDomain.updateViewPreferences(current, {
      viewMode: 'calendar',
    } as Partial<ViewPreferences>)

    expect(viewPreferenceDomain.getTaskViewMode(next)).toBe('calendar')
    expect(current).toEqual(viewPreferenceDomain.createDefaultViewPreferences())
  })
})
